import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/lib/use-theme';
import { FONTS } from '@/shared/config/theme';
import { Card, CardBody, Button, ButtonText, ButtonIcon, SettingRow } from '@/shared/ui';
import {
  useRevokeRelationship,
  useUpdateSharingConfig,
  useGenerateInvite,
} from '@/features/pairing';
import { useRelationships } from '@/entities/family-sharing';
import { useFirebaseAuth } from '@/features/auth';
import { RELATIONSHIP_STATUS } from '@/shared/config';
import type { Relationship, SharingConfig } from '@/entities/family-sharing';
import type { SettingsStackParamList } from '@/app/navigation';
import { getLinkedUsers } from '@/shared/api/bp-repository';

type NavProp = NativeStackNavigationProp<SettingsStackParamList, 'FamilySharing'>;

// ─── Linked Person Card ───────────────────────────────────────────────────────

interface LinkedPersonCardProps {
  relationship: Relationship;
  currentUid: string;
  linkedUserNames: Record<string, string>;
  onRevoke: (id: string, name: string) => void;
  onUpdateSharing: (id: string, isInitiator: boolean, config: Partial<SharingConfig>) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
}

function LinkedPersonCard({
  relationship,
  currentUid,
  linkedUserNames,
  onRevoke,
  onUpdateSharing,
  colors,
  typography,
}: LinkedPersonCardProps) {
  const { t } = useTranslation('pages');
  const isInitiator = relationship.initiatorUid === currentUid;
  const sharing = isInitiator ? relationship.initiatorSharing : relationship.recipientSharing;
  const linkedUid = isInitiator ? relationship.recipientUid : relationship.initiatorUid;
  const displayName = isInitiator && !relationship.recipientUid
    ? t('familySharing.pendingInvite')
    : (linkedUid ? (linkedUserNames[linkedUid] ?? linkedUid) : t('familySharing.pendingInvite'));

  const isPending = relationship.status === RELATIONSHIP_STATUS.pending;

  return (
    <Card variant="elevated" size="md" style={styles.personCard}>
      <CardBody>
        <View style={styles.personHeader}>
          <View style={styles.personInfo}>
            <Icon name="person-circle-outline" size={36} color={colors.accent} />
            <View style={styles.personNameCol}>
              <Text style={[styles.personName, { color: colors.textPrimary, fontSize: typography.md }]}>
                {displayName}
              </Text>
              {isPending && (
                <Text style={[styles.pendingBadge, { color: colors.warningText, fontSize: typography.xs }]}>
                  {t('familySharing.pendingInvite')}
                </Text>
              )}
            </View>
          </View>
          <Pressable
            onPress={() => onRevoke(relationship.id, displayName)}
            hitSlop={8}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t('familySharing.removeConnection')}
          >
            <Icon name="close-circle-outline" size={24} color={colors.error} />
          </Pressable>
        </View>

        {!isPending && (
          <View style={styles.sharingToggles}>
            <SettingRow
              label={t('familySharing.crisisAlerts')}
              value={sharing.crisisAlertsEnabled}
              onValueChange={(v) => onUpdateSharing(relationship.id, isInitiator, { crisisAlertsEnabled: v })}
            />
            <SettingRow
              label={t('familySharing.shareWeight')}
              value={sharing.shareWeight}
              onValueChange={(v) => onUpdateSharing(relationship.id, isInitiator, { shareWeight: v })}
            />
            <SettingRow
              label={t('familySharing.shareNotes')}
              value={sharing.shareNotes}
              onValueChange={(v) => onUpdateSharing(relationship.id, isInitiator, { shareNotes: v })}
            />
            <SettingRow
              label={t('familySharing.shareMedications')}
              value={sharing.shareMedications}
              onValueChange={(v) => onUpdateSharing(relationship.id, isInitiator, { shareMedications: v })}
            />
            <SettingRow
              label={t('familySharing.shareTags')}
              value={sharing.shareTags}
              onValueChange={(v) => onUpdateSharing(relationship.id, isInitiator, { shareTags: v })}
            />
          </View>
        )}
      </CardBody>
    </Card>
  );
}

// ─── SharingSettingsPage ──────────────────────────────────────────────────────

export function SharingSettingsPage() {
  const { t } = useTranslation('pages');
  const { colors, typography, touchTargetSize } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const { signOut, deleteAccount, user: firebaseUser } = useFirebaseAuth();
  const { relationships } = useRelationships();
  const revokeRelationship = useRevokeRelationship();
  const updateSharing = useUpdateSharingConfig();
  const generateInvite = useGenerateInvite();
  const [isGenerating, setIsGenerating] = useState(false);

  const currentUid = firebaseUser?.uid ?? '';

  const [linkedUserNames, setLinkedUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    void getLinkedUsers().then((users) => {
      const names: Record<string, string> = {};
      for (const u of users) {
        names[u.uid] = u.display_name;
      }
      setLinkedUserNames(names);
    });
  }, [relationships]);

  const activeRelationships = relationships.filter(
    (r) => r.status === RELATIONSHIP_STATUS.active || r.status === RELATIONSHIP_STATUS.pending,
  );

  const handleAddPerson = useCallback(async () => {
    setIsGenerating(true);
    try {
      const result = await generateInvite.mutateAsync();
      navigation.navigate('InvitePerson', { inviteCode: result.inviteCode, expiresAt: result.expiresAt });
    } finally {
      setIsGenerating(false);
    }
  }, [generateInvite, navigation]);

  const handleRevoke = useCallback(
    (relationshipId: string, name: string) => {
      Alert.alert(
        t('familySharing.removeConnection'),
        t('familySharing.removeConnectionConfirm', { name }),
        [
          { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
          {
            text: t('familySharing.removeConnection'),
            style: 'destructive',
            onPress: () => revokeRelationship.mutate(relationshipId),
          },
        ],
      );
    },
    [t, revokeRelationship],
  );

  const handleUpdateSharing = useCallback(
    (relationshipId: string, isInitiator: boolean, config: Partial<SharingConfig>) => {
      updateSharing.mutate({ relationshipId, isInitiator, config });
    },
    [updateSharing],
  );

  const handleSignOut = useCallback(() => {
    Alert.alert(
      t('familySharing.signOut'),
      '',
      [
        { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        { text: t('familySharing.signOut'), style: 'destructive', onPress: () => void signOut() },
      ],
    );
  }, [t, signOut]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      t('familySharing.deleteAccount'),
      t('familySharing.deleteAccountConfirm'),
      [
        { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('familySharing.deleteAccount'),
          style: 'destructive',
          onPress: () => void deleteAccount(),
        },
      ],
    );
  }, [t, deleteAccount]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { minHeight: touchTargetSize, minWidth: touchTargetSize }]}
          accessibilityRole="button"
          accessibilityLabel={t('common.back', { defaultValue: 'Back' })}
        >
          <Icon name="chevron-back" size={24} color={colors.accent} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>
          {t('familySharing.title')}
        </Text>
        <View style={styles.headerRight} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
      >
        {/* Account section */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: typography.xs }]}>
            {t('familySharing.myAccount').toUpperCase()}
          </Text>
          <Card variant="elevated" size="md">
            <CardBody>
              <View style={styles.accountRow}>
                <Icon name="person-circle" size={40} color={colors.accent} />
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountEmail, { color: colors.textPrimary, fontSize: typography.md }]}>
                    {firebaseUser?.displayName ?? firebaseUser?.email ?? ''}
                  </Text>
                  <Text style={[styles.accountEmail, { color: colors.textSecondary, fontSize: typography.xs }]}>
                    {firebaseUser?.email ?? ''}
                  </Text>
                </View>
              </View>
            </CardBody>
          </Card>
        </Animated.View>

        {/* Linked people */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: typography.xs }]}>
              {t('familySharing.linkedPeople').toUpperCase()}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => void handleAddPerson()}
              isLoading={isGenerating}
              accessibilityLabel={t('familySharing.addPerson')}
            >
              <ButtonIcon as={Icon} name="add" />
              <ButtonText>{t('familySharing.addPerson')}</ButtonText>
            </Button>
          </View>

          {activeRelationships.length === 0 ? (
            <Card variant="outline" size="lg">
              <CardBody>
                <View style={styles.emptyState}>
                  <Icon name="people-outline" size={48} color={colors.textTertiary} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontSize: typography.md }]}>
                    {t('familySharing.noLinkedPeople')}
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary, fontSize: typography.sm }]}>
                    {t('familySharing.noLinkedPeopleSubtitle')}
                  </Text>
                </View>
              </CardBody>
            </Card>
          ) : (
            activeRelationships.map((rel) => (
              <LinkedPersonCard
                key={rel.id}
                relationship={rel}
                currentUid={currentUid}
                linkedUserNames={linkedUserNames}
                onRevoke={handleRevoke}
                onUpdateSharing={handleUpdateSharing}
                colors={colors}
                typography={typography}
              />
            ))
          )}
        </Animated.View>

        {/* Account actions */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.accountActions}>
          <Button variant="ghost" size="md" onPress={handleSignOut} style={styles.actionBtn}>
            <ButtonIcon as={Icon} name="log-out-outline" />
            <ButtonText>{t('familySharing.signOut')}</ButtonText>
          </Button>
          <Button variant="destructive" size="md" onPress={handleDeleteAccount} style={styles.actionBtn}>
            <ButtonIcon as={Icon} name="trash-outline" />
            <ButtonText>{t('familySharing.deleteAccount')}</ButtonText>
          </Button>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4, justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: FONTS.bold, fontWeight: '700' },
  headerRight: { minWidth: 44 },
  scrollContent: { paddingHorizontal: 16, gap: 12 },
  sectionTitle: { fontFamily: FONTS.semiBold, fontWeight: '600', marginBottom: 8, marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  personCard: { marginBottom: 8 },
  personHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  personInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  personNameCol: { flexShrink: 1 },
  personName: { fontFamily: FONTS.semiBold, fontWeight: '600' },
  pendingBadge: { fontFamily: FONTS.regular, fontWeight: '400', marginTop: 2 },
  sharingToggles: { gap: 2 },
  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  emptyTitle: { fontFamily: FONTS.semiBold, fontWeight: '600', textAlign: 'center' },
  emptySubtitle: { fontFamily: FONTS.regular, fontWeight: '400', textAlign: 'center' },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  accountInfo: { flex: 1 },
  accountEmail: { fontFamily: FONTS.regular, fontWeight: '400' },
  accountActions: { gap: 8, marginTop: 8 },
  actionBtn: { justifyContent: 'center' },
});
