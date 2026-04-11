import { NativeModules } from 'react-native';

export type NavigationMode = 'gesture' | 'buttons' | 'unknown';

export function getNativeNavigationMode(): Promise<NavigationMode> {
  // Read lazily so Jest mocks set up before the call are respected.
  const mod = (NativeModules as Record<string, unknown>)
    .NavigationBarModule as { getNavigationMode(): Promise<string> } | undefined;

  if (!mod) {
    return Promise.resolve('unknown');
  }
  return mod.getNavigationMode().then(result => {
    if (result === 'gesture' || result === 'buttons') {
      return result as NavigationMode;
    }
    return 'unknown';
  });
}
