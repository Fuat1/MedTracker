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
