import { TikTokAppEventsModule, TikTokStandardEventNames } from '../index';
import { mockCreateHybridObject, mockNativeModule } from './setup';

describe('TikTokAppEventsModule', () => {
  it('creates the Nitro HybridObject lazily and reuses it', async () => {
    mockNativeModule.initialize.mockResolvedValue(undefined);

    await TikTokAppEventsModule.initialize({
      accessToken: 'token',
      appId: ' app.id ',
      tikTokAppId: ['123'],
    });
    TikTokAppEventsModule.logout();

    expect(mockCreateHybridObject).toHaveBeenCalledTimes(1);
    expect(mockCreateHybridObject).toHaveBeenCalledWith('TikTokAppEvents');
    expect(mockNativeModule.initialize).toHaveBeenCalledTimes(1);
    expect(mockNativeModule.logout).toHaveBeenCalledTimes(1);
  });

  it('normalizes initialize options before calling native code', async () => {
    mockNativeModule.initialize.mockResolvedValue(undefined);

    await TikTokAppEventsModule.initialize({
      accessToken: 'token',
      appId: ' com.example.app ',
      tikTokAppId: '11, 22,33',
      trackingEnabled: false,
      logLevel: 'debug',
    });

    expect(mockNativeModule.initialize).toHaveBeenCalledWith({
      accessToken: 'token',
      appId: 'com.example.app',
      tikTokAppIds: ['11', '22', '33'],
      trackingEnabled: false,
      logLevel: 'debug',
    });
  });

  it('normalizes identity values before calling native code', () => {
    TikTokAppEventsModule.identify({
      externalId: ' user-1 ',
      externalUserName: ' demo ',
      phoneNumber: ' +4512345678 ',
      email: ' User@Example.com ',
    });

    expect(mockNativeModule.identify).toHaveBeenCalledWith({
      externalId: 'user-1',
      externalUserName: 'demo',
      phoneNumber: '+4512345678',
      email: 'user@example.com',
    });
  });

  it('routes helper methods through the generic trackEvent native call', () => {
    TikTokAppEventsModule.trackStandardEvent(
      TikTokStandardEventNames.Registration,
      { source: 'example' },
      ' evt-1 '
    );
    TikTokAppEventsModule.trackCustomEvent(' Custom Event ', {
      nested: { ok: true },
    });
    TikTokAppEventsModule.trackAdRevenueEvent(
      { revenue: 1.25, currency: 'USD' },
      ' ad-1 '
    );

    expect(mockNativeModule.trackEvent).toHaveBeenNthCalledWith(1, {
      name: TikTokStandardEventNames.Registration,
      eventId: 'evt-1',
      properties: { source: 'example' },
    });
    expect(mockNativeModule.trackEvent).toHaveBeenNthCalledWith(2, {
      name: 'Custom Event',
      eventId: undefined,
      properties: { nested: { ok: true } },
    });
    expect(mockNativeModule.trackEvent).toHaveBeenNthCalledWith(3, {
      name: TikTokStandardEventNames.ImpressionLevelAdRevenue,
      eventId: 'ad-1',
      properties: { revenue: 1.25, currency: 'USD' },
    });
  });

  it('exposes flush and deferred deep link helpers', async () => {
    mockNativeModule.fetchDeferredDeepLink.mockResolvedValue('myapp://test');

    TikTokAppEventsModule.flush();
    const deepLink = await TikTokAppEventsModule.fetchDeferredDeepLink();

    expect(mockNativeModule.flush).toHaveBeenCalledTimes(1);
    expect(mockNativeModule.fetchDeferredDeepLink).toHaveBeenCalledTimes(1);
    expect(deepLink).toBe('myapp://test');
  });

  it('rejects an empty event name before crossing the bridge', () => {
    expect(() => {
      TikTokAppEventsModule.trackCustomEvent('   ');
    }).toThrow('TikTok event name cannot be empty.');
  });

  it('rejects empty TikTok App IDs during initialization normalization', async () => {
    expect(() => {
      TikTokAppEventsModule.initialize({
        accessToken: 'token',
        tikTokAppId: [],
      });
    }).toThrow('At least one TikTok App ID is required.');
  });
});
