import {
  TikTokAppEventsModule,
  TikTokContentEventNames,
  TikTokStandardEventNames,
} from '../index';
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
      accessToken: ' token ',
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

  it('routes standard, custom, and ad-revenue helpers through generic trackEvent', () => {
    TikTokAppEventsModule.trackStandardEvent(
      TikTokStandardEventNames.Registration,
      { source: 'example' },
      ' evt-1 '
    );
    TikTokAppEventsModule.trackCustomEvent(' Custom Event ', {
      nested: { ok: true, ignored: undefined },
      steps: [1, 2],
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
      properties: {
        nested: { ok: true },
        steps: [1, 2],
      },
    });
    expect(mockNativeModule.trackEvent).toHaveBeenNthCalledWith(3, {
      name: TikTokStandardEventNames.ImpressionLevelAdRevenue,
      eventId: 'ad-1',
      properties: { revenue: 1.25, currency: 'USD' },
    });
  });

  it('routes typed content helpers through native trackContentEvent', () => {
    TikTokAppEventsModule.trackContentEvent(
      TikTokContentEventNames.Purchase,
      {
        currency: ' usd ',
        value: 9.99,
        orderId: ' order-1 ',
        contentType: ' product ',
        contents: [
          {
            contentId: ' sku-1 ',
            contentName: ' Pro Monthly ',
            price: 9.99,
            quantity: 1,
          },
          {
            contentId: '   ',
          },
        ],
      },
      ' purchase-evt-1 '
    );

    expect(mockNativeModule.trackContentEvent).toHaveBeenCalledWith({
      name: TikTokContentEventNames.Purchase,
      eventId: 'purchase-evt-1',
      properties: {
        currency: 'USD',
        value: 9.99,
        orderId: 'order-1',
        contentType: 'product',
        contents: [
          {
            contentId: 'sku-1',
            contentName: 'Pro Monthly',
            price: 9.99,
            quantity: 1,
          },
        ],
      },
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

  it('rejects invalid TikTok App IDs during initialization normalization', async () => {
    expect(() => {
      TikTokAppEventsModule.initialize({
        accessToken: 'token',
        tikTokAppId: '123,,456',
      });
    }).toThrow(
      'TikTok App IDs cannot contain empty entries, leading commas, trailing commas, or consecutive commas.'
    );

    expect(() => {
      TikTokAppEventsModule.initialize({
        accessToken: 'token',
        tikTokAppId: ['123', 'abc'],
      });
    }).toThrow('TikTok App ID at index 1 must contain only digits.');
  });

  it('rejects unsupported generic property values before crossing the bridge', () => {
    expect(() => {
      TikTokAppEventsModule.trackCustomEvent('Invalid', {
        nested: {
          handler: (() => true) as unknown as never,
        },
      });
    }).toThrow(
      'properties.nested.handler must not contain functions, symbols, bigint values, or unsupported object types.'
    );
  });

  it('rejects invalid content helper inputs before crossing the bridge', () => {
    expect(() => {
      TikTokAppEventsModule.trackContentEvent(
        TikTokContentEventNames.Purchase,
        {
          currency: 'usdollars',
        }
      );
    }).toThrow(
      'TikTok content event currency must be a 3-letter ISO 4217 code.'
    );

    expect(() => {
      TikTokAppEventsModule.trackContentEvent(
        TikTokContentEventNames.Purchase,
        {
          contents: [
            {
              contentId: 'sku-1',
              quantity: 1.5,
            },
          ],
        }
      );
    }).toThrow('TikTok content quantity must be an integer.');
  });
});
