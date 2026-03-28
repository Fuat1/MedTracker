/**
 * AuthGate — wraps the root navigator.
 *
 * - Unauthenticated users who have family sharing enabled see AuthPage.
 * - Unauthenticated users without family sharing see the normal app (no forced login).
 * - While auth state is loading, renders nothing (avoids flash).
 */

import React from 'react';
import { useFirebaseAuth } from './use-firebase-auth';

interface AuthGateProps {
  /** The normal app (TabNavigator or root Stack). */
  children: React.ReactNode;
  /** Shown when user needs to sign in (only when familyEnabled in settings). */
  authPage: React.ReactNode;
  /** Whether the user has family sharing enabled in settings. */
  familyEnabled: boolean;
}

export function AuthGate({ children, authPage, familyEnabled }: AuthGateProps) {
  const { user, isLoading } = useFirebaseAuth();

  if (isLoading) {
    // Don't flash anything while Firebase resolves auth state
    return null;
  }

  if (familyEnabled && !user) {
    return <>{authPage}</>;
  }

  return <>{children}</>;
}
