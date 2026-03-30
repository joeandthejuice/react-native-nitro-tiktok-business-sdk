import type { AnyMap, HybridObject } from 'react-native-nitro-modules';

export interface TikTokInitializeOptions {
  accessToken: string;
  appId?: string;
  tikTokAppIds?: string[];
  trackingEnabled?: boolean;
  automaticTrackingEnabled?: boolean;
  installTrackingEnabled?: boolean;
  launchTrackingEnabled?: boolean;
  retentionTrackingEnabled?: boolean;
  purchaseTrackingEnabled?: boolean;
  advertiserIdCollectionEnabled?: boolean;
  skAdNetworkSupportEnabled?: boolean;
  enhancedDataPostbackEnabled?: boolean;
  lowPerformanceDevice?: boolean;
  debugModeEnabled?: boolean;
  limitedDataUseEnabled?: boolean;
  delayForATTUserAuthorizationSeconds?: number;
  customUserAgent?: string;
  logLevel?: string;
}

export interface TikTokIdentity {
  externalId?: string;
  externalUserName?: string;
  phoneNumber?: string;
  email?: string;
}

export interface TikTokEvent {
  name: string;
  eventId?: string;
  properties?: AnyMap;
}

export interface TikTokAppEvents
  extends HybridObject<{ ios: 'c++'; android: 'kotlin' }> {
  initialize(options: TikTokInitializeOptions): Promise<void>;
  startTracking(): void;
  identify(identity: TikTokIdentity): void;
  logout(): void;
  flush(): void;
  trackEvent(event: TikTokEvent): void;
  fetchDeferredDeepLink(): Promise<string | undefined>;
}
