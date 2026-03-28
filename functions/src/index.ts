/**
 * MedTracker Firebase Cloud Functions
 *
 * sendCrisisAlert — called by the mobile app (fire-and-forget) when a
 * hypertensive crisis reading is recorded. Sends FCM push notifications
 * to all active linked relationships where crisisAlertsEnabled = true.
 *
 * Security model:
 *  - Callable function requires an authenticated Firebase user (context.auth).
 *  - The caller can only trigger alerts for their OWN records (context.auth.uid
 *    must match the senderUid in the request).
 *  - FCM tokens are read from each recipient's /users/{uid} doc.
 *  - Relationship docs are read server-side to determine eligible recipients.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// ─── Types ────────────────────────────────────────────────────────────────────

interface CrisisAlertRequest {
  /** The UID of the user who recorded the crisis reading */
  senderUid: string;
  /** Systolic value that triggered the crisis threshold */
  systolic: number;
  /** Diastolic value that triggered the crisis threshold */
  diastolic: number;
}

interface RelationshipDoc {
  initiatorUid: string;
  recipientUid: string | null;
  status: 'pending' | 'active' | 'revoked';
  initiatorSharing: { crisisAlertsEnabled: boolean };
  recipientSharing: { crisisAlertsEnabled: boolean };
}

interface UserDoc {
  fcmToken?: string;
  displayName?: string;
}

// ─── Crisis Alert Callable ────────────────────────────────────────────────────

export const sendCrisisAlert = functions.https.onCall(
  async (request: functions.https.CallableRequest<CrisisAlertRequest>) => {
    const auth = request.auth;
    if (!auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }

    const { senderUid, systolic, diastolic } = request.data;

    // Verify the caller is acting for their own account
    if (auth.uid !== senderUid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'senderUid must match authenticated user',
      );
    }

    // Validate reading range (mirror mobile-side validation)
    if (systolic < 40 || systolic > 300 || diastolic < 30 || diastolic > 200) {
      throw new functions.https.HttpsError('invalid-argument', 'BP values out of valid range');
    }

    // Find all active relationships involving this user where the other party
    // has crisisAlertsEnabled for the sender's readings
    const [initiatorSnap, recipientSnap] = await Promise.all([
      db
        .collection('relationships')
        .where('initiatorUid', '==', senderUid)
        .where('status', '==', 'active')
        .get(),
      db
        .collection('relationships')
        .where('recipientUid', '==', senderUid)
        .where('status', '==', 'active')
        .get(),
    ]);

    const recipientUids: string[] = [];

    // Relationships where senderUid is the initiator:
    // the recipient watches the initiator's readings → check initiatorSharing.crisisAlertsEnabled
    for (const doc of initiatorSnap.docs) {
      const rel = doc.data() as RelationshipDoc;
      if (rel.recipientUid && rel.initiatorSharing.crisisAlertsEnabled) {
        recipientUids.push(rel.recipientUid);
      }
    }

    // Relationships where senderUid is the recipient:
    // the initiator watches the recipient's readings → check recipientSharing.crisisAlertsEnabled
    for (const doc of recipientSnap.docs) {
      const rel = doc.data() as RelationshipDoc;
      if (rel.initiatorUid && rel.recipientSharing.crisisAlertsEnabled) {
        recipientUids.push(rel.initiatorUid);
      }
    }

    if (recipientUids.length === 0) {
      return { sent: 0 };
    }

    // Get sender's display name for the notification body
    const senderDoc = await db.collection('users').doc(senderUid).get();
    const senderData = senderDoc.data() as UserDoc | undefined;
    const senderName = senderData?.displayName ?? 'A family member';

    // Fetch FCM tokens for all recipients
    const recipientDocs = await Promise.all(
      recipientUids.map((uid) => db.collection('users').doc(uid).get()),
    );

    const messages: admin.messaging.Message[] = [];

    for (const recipientDoc of recipientDocs) {
      const userData = recipientDoc.data() as UserDoc | undefined;
      const fcmToken = userData?.fcmToken;
      if (!fcmToken) {
        continue;
      }

      messages.push({
        token: fcmToken,
        notification: {
          title: '⚠️ Hypertensive Crisis Alert',
          body: `${senderName} recorded a critical reading: ${systolic}/${diastolic} mmHg. Please check on them.`,
        },
        data: {
          type: 'crisis_alert',
          senderUid,
          systolic: String(systolic),
          diastolic: String(diastolic),
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'crisis_alerts',
            priority: 'max',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              contentAvailable: true,
            },
          },
        },
      });
    }

    if (messages.length === 0) {
      return { sent: 0 };
    }

    const batchResponse = await messaging.sendEach(messages);
    const successCount = batchResponse.responses.filter((r) => r.success).length;

    functions.logger.info(`Crisis alert sent: ${successCount}/${messages.length} delivered`, {
      senderUid,
      systolic,
      diastolic,
    });

    return { sent: successCount };
  },
);
