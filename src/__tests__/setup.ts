const mockNativeModule = {
  initialize: jest.fn(),
  startTracking: jest.fn(),
  identify: jest.fn(),
  logout: jest.fn(),
  flush: jest.fn(),
  trackEvent: jest.fn(),
  fetchDeferredDeepLink: jest.fn(),
};

const mockCreateHybridObject = jest.fn(() => mockNativeModule);

jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: mockCreateHybridObject,
  },
}));

beforeEach(() => {
  mockCreateHybridObject.mockClear();
  Object.values(mockNativeModule).forEach((value) => {
    if (typeof value.mockReset === 'function') {
      value.mockReset();
    }
  });
});

export { mockCreateHybridObject, mockNativeModule };
