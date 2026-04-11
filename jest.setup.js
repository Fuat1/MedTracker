jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

jest.mock('react-native-reanimated', () => ({
  useSharedValue: (v) => ({ value: v }),
  useAnimatedStyle: (fn) => fn(),
  withSpring: (v) => v,
  withTiming: (v) => v,
  createAnimatedComponent: (c) => c,
  FlatList: 'FlatList',
  ScrollView: 'ScrollView',
  View: 'View',
  default: {
    createAnimatedComponent: (c) => c,
    View: 'View',
    call: () => {},
  },
}));

jest.mock('react-native-gesture-handler', () => ({
  Pressable: 'Pressable',
  GestureHandlerRootView: ({ children }) => children,
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  TouchableOpacity: 'TouchableOpacity',
  State: {},
  Directions: {},
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
}));

jest.mock('@react-navigation/native', () => ({
  createNavigationContainerRef: () => ({
    isReady: jest.fn(() => false),
    navigate: jest.fn(),
    current: null,
  }),
  NavigationContainer: ({ children }) => children,
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn(),
    requestPermission: jest.fn(),
    createTriggerNotification: jest.fn(),
    getTriggerNotificationIds: jest.fn().mockResolvedValue([]),
    cancelTriggerNotifications: jest.fn(),
    onForegroundEvent: jest.fn(() => jest.fn()),
    onBackgroundEvent: jest.fn(),
  },
  TriggerType: { TIMESTAMP: 0 },
  RepeatFrequency: { DAILY: 3 },
  AndroidImportance: { HIGH: 4 },
  EventType: { PRESS: 1 },
}));
