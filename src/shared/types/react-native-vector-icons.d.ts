// React Native polyfills requestIdleCallback globally in Hermes/JSC environments.
// InteractionManager is deprecated in the New Architecture — use requestIdleCallback instead.
declare function requestIdleCallback(callback: () => void): number;
declare function cancelIdleCallback(handle: number): void;

declare module 'react-native-vector-icons/Ionicons' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  export default class Icon extends Component<IconProps> {}
}
