global.__DEV__ = true;

jest.mock('react-native', () => {
  const React = require('react');
  const View = (props) => React.createElement('View', props, props?.children);
  const Text = (props) => React.createElement('Text', props, props?.children);
  const TouchableOpacity = (props) => React.createElement('TouchableOpacity', props, props?.children);
  const ScrollView = (props) => React.createElement('ScrollView', props, props?.children);
  const Modal = (props) => React.createElement('Modal', props, props?.children);
  const TextInput = (props) => React.createElement('TextInput', props, props?.children);
  const ActivityIndicator = (props) => React.createElement('ActivityIndicator', props, props?.children);
  const Image = (props) => React.createElement('Image', props, props?.children);
  const StatusBar = (props) => React.createElement('StatusBar', props, props?.children);

  return {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    ActivityIndicator,
    Image,
    StatusBar,
    StyleSheet: {
      create: (styles) => styles,
      flatten: (styles) => styles,
    },
    Dimensions: {
      get: jest.fn().mockReturnValue({ width: 390, height: 844, scale: 3, fontScale: 1 }),
      addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
      removeEventListener: jest.fn(),
    },
    PixelRatio: {
      get: () => 3,
      getFontScale: () => 1,
      getPixelSizeForLayoutSize: (x) => x * 3,
      roundToNearestPixel: (x) => x,
    },
    Platform: {
      OS: 'ios',
      select: (obj) => (obj ? obj.ios || obj.default : undefined),
    },
    NativeModules: {
      NotificationBadgeModule: {
        setBadgeCount: jest.fn(),
        getBadgeCount: jest.fn(),
      },
    },
    PermissionsAndroid: {
      PERMISSIONS: {},
      request: jest.fn(() => Promise.resolve('granted')),
      check: jest.fn(() => Promise.resolve(true)),
    },
    requireNativeComponent: jest.fn(() => 'View'),
    Alert: {
      alert: jest.fn(),
    },
    Animated: {
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn(() => 0),
      })),
      createAnimatedComponent: jest.fn((Comp) => Comp),
      event: jest.fn(),
      timing: jest.fn(() => ({
        start: jest.fn((cb) => cb && cb({ finished: true })),
      })),
      spring: jest.fn(() => ({
        start: jest.fn((cb) => cb && cb({ finished: true })),
      })),
      decay: jest.fn(() => ({
        start: jest.fn((cb) => cb && cb({ finished: true })),
      })),
      parallel: jest.fn(() => ({
        start: jest.fn((cb) => cb && cb({ finished: true })),
      })),
      loop: jest.fn(() => ({
        start: jest.fn(),
        stop: jest.fn(),
      })),
      sequence: jest.fn(() => ({
        start: jest.fn(),
      })),
      delay: jest.fn(() => ({
        start: jest.fn((cb) => cb && cb({ finished: true })),
      })),
      stagger: jest.fn(() => ({
        start: jest.fn(),
      })),
      View: (props) => props?.children || null,
      Text: (props) => props?.children || null,
      Image: (props) => props?.children || null,
      ScrollView: (props) => props?.children || null,
    },
    Easing: {
      linear: (t) => t,
      ease: (t) => t,
      in: jest.fn((easing) => easing),
      out: jest.fn((easing) => easing),
      inOut: jest.fn((easing) => easing),
      cubic: (t) => t,
      quad: (t) => t,
      poly: jest.fn(() => (t) => t),
      sin: (t) => t,
      exp: (t) => t,
      circle: (t) => t,
      bounce: (t) => t,
      back: jest.fn(() => (t) => t),
      elastic: jest.fn(() => (t) => t),
      bezier: jest.fn(() => (t) => t),
    },
  };
});

jest.mock('@react-native-firebase/app', () => ({
  initializeApp: jest.fn(),
  apps: [],
  utils: () => ({
    FilePath: {},
  }),
}));

jest.mock('@react-native-firebase/auth', () => {
  const authInstance = {
    currentUser: null,
    signInWithCredential: jest.fn(),
    signInWithPhoneNumber: jest.fn(),
    onAuthStateChanged: jest.fn(() => jest.fn()),
    signOut: jest.fn(),
  };
  const auth = () => authInstance;
  auth.getAuth = () => authInstance;
  auth.signInWithPhoneNumber = jest.fn();
  return {
    __esModule: true,
    default: auth,
    getAuth: () => authInstance,
    signInWithPhoneNumber: jest.fn(),
  };
});

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  ScreenContainer: ({ children }) => children,
  Screen: ({ children }) => children,
  NativeScreensModule: {},
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }) => children,
}));

jest.mock('react-native-video', () => 'Video');

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
  };
});

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

jest.mock('@react-native-voice/voice', () => ({
  onSpeechStart: jest.fn(),
  onSpeechRecognized: jest.fn(),
  onSpeechEnd: jest.fn(),
  onSpeechError: jest.fn(),
  onSpeechResults: jest.fn(),
  onSpeechPartialResults: jest.fn(),
  onSpeechVolumeChanged: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  cancel: jest.fn(),
  destroy: jest.fn(),
  isAvailable: jest.fn(() => Promise.resolve(true)),
}));
