import { useState, useEffect } from 'react';
import { getNativeNavigationMode, type NavigationMode } from './native-navigation-bar';

// Module-level cache — survives re-renders, reset on fresh JS bundle load only.
let cachedMode: NavigationMode | null = null;

export function useNavigationMode(): { mode: NavigationMode; loading: boolean } {
  const [mode, setMode] = useState<NavigationMode>(cachedMode ?? 'unknown');
  const [loading, setLoading] = useState(cachedMode === null);

  useEffect(() => {
    if (cachedMode !== null) {
      return;
    }
    getNativeNavigationMode().then(result => {
      cachedMode = result;
      setMode(result);
      setLoading(false);
    });
  }, []);

  return { mode, loading };
}
