# @joeandthejuice/react-native-nitro-tiktok-business-sdk

`@joeandthejuice/react-native-nitro-tiktok-business-sdk` is a Nitro Modules bridge for the TikTok Business App Events SDK on iOS and Android.

## Scope

- Supports the standalone TikTok App Events SDK.
- The current surface area is App Events only, despite the broader package name.
- Exposes a small cross-platform JS API for initialization, consent-gated tracking, identity, event tracking, manual flushes, and deferred deep links.
- Uses Nitro `AnyMap` payloads so event properties can contain nested objects and arrays without stringifying JSON.

The Android combined TikTok App Events + Pangle SDK is not wired in this first version.

## Stability And Versioning

- SemVer in this repo applies to the documented App Events API exposed by this package.
- A `1.x` release means the App Events surface is stable enough to consume as a real library, not that this package wraps every TikTok Business SDK capability.
- TikTok Login Kit, OpenSDK flows, Pangle monetization, and other non-App-Events surfaces are out of scope unless documented here explicitly.
- The first public release should be treated as `1.0.0`, not because the package is exhaustive, but because the App Events contract is stable and intentionally scoped.

## Example App

This repo includes an Expo example app under `example/` that lets you:

- initialize the SDK with your own access token, app ID, and TikTok App ID
- start tracking after consent
- identify and logout test users
- trigger standard events, custom events, and deferred deep link fetches

Run it with:

```sh
yarn
yarn example start
```

The example app exposes two init flows:

- `Initialize SDK` for the normal tracking-enabled path
- `Initialize SDK (Delayed Tracking)` for consent-gated testing

### iOS delayed-tracking caveat

TikTok's iOS SDK treats `disableTracking()` as "not initialized" even after it has otherwise configured itself. This repo normalizes that init callback so delayed-tracking init does not surface as a false failure, but TikTok still keeps its internal `initialized` flag false on iOS in that mode. As a result:

- event tracking works after `startTracking()`
- deferred deep links remain unavailable on iOS if the SDK was initialized with tracking disabled

If you need to test deferred deep links on iOS, initialize with tracking enabled.

## Install

Install the library and Nitro runtime:

```sh
yarn add @joeandthejuice/react-native-nitro-tiktok-business-sdk react-native-nitro-modules
```

You will also need your TikTok Events Manager credentials:

- `accessToken`: your TikTok App Secret
- `appId`: Android package name or iOS App Store ID
- `tikTokAppId`: your TikTok App ID from Events Manager

`accessToken` remains a runtime value in this library. `appId` and `tikTokAppId` can either be passed at runtime or configured as native defaults through the Expo plugin.

### Expo / prebuild projects

Add the package and plugin:

```ts
plugins: [
  [
    '@joeandthejuice/react-native-nitro-tiktok-business-sdk',
    {
      iosAppId: '1234567890',
      iosTikTokAppIds: ['1234567890123456789'],
      androidTikTokAppIds: ['9876543210987654321'],
      iosUserTrackingUsageDescription:
        'This identifier will be used to deliver personalized ads to you.'
    }
  ]
]
```

The plugin ensures:

- the JitPack repository is present for Android
- `use_modular_headers!` is added to the iOS Podfile so `TikTokBusinessSDK` can be imported in the iOS bridge target
- `NSUserTrackingUsageDescription` can be set when needed
- iOS build-time defaults for `appId` and `tikTokAppId(s)` can be written into `Info.plist`
- Android build-time defaults for `tikTokAppId(s)` and optional `appId` overrides can be written into the app manifest

Recommended split:

- configure `iosAppId`, `iosTikTokAppIds`, and `androidTikTokAppIds` in the plugin because they are usually stable per build profile
- only set `androidAppId` in the plugin if you explicitly need to override the default package-name behavior
- leave `accessToken` at runtime
- use runtime `appId` or `tikTokAppId` only when you need to override the plugin defaults

Plugin changes require a rebuild or prebuild sync. Runtime initialization changes do not.

### Bare React Native projects

1. Install `react-native-nitro-modules`.
2. Install this package.
3. Add JitPack to the root Android repositories if your project does not already include it.
4. Add `use_modular_headers!` in your iOS Podfile target if it is not already present.
5. Run `cd ios && pod install`.

## Usage

```ts
import {
  TikTokAppEventsModule,
  TikTokStandardEventNames,
} from '@joeandthejuice/react-native-nitro-tiktok-business-sdk'

await TikTokAppEventsModule.initialize({
  accessToken: 'YOUR_ACCESS_TOKEN',
  trackingEnabled: false,
  logLevel: __DEV__ ? 'debug' : 'none',
})

TikTokAppEventsModule.identify({
  externalId: 'user-123',
  externalUserName: 'marc',
  email: 'marc@example.com',
})

TikTokAppEventsModule.startTracking()

TikTokAppEventsModule.trackStandardEvent(
  TikTokStandardEventNames.Registration
)

TikTokAppEventsModule.trackStandardEvent(
  TikTokStandardEventNames.Purchase,
  {
    currency: 'USD',
    value: 9.99,
    content_id: 'pro-monthly',
    content_type: 'subscription',
    contents: [
      {
        content_id: 'pro-monthly',
        content_name: 'Pro Monthly',
        price: '9.99',
        quantity: 1
      }
    ]
  },
  'purchase-evt-001'
)

const deferredUrl = await TikTokAppEventsModule.fetchDeferredDeepLink()

TikTokAppEventsModule.flush()
```

## API

### `initialize(options)`

Initializes the TikTok SDK with your access token, app ID, and TikTok App ID(s).

- `accessToken` is always required at runtime.
- `appId` is optional when:
  - iOS default `iosAppId` is configured in the Expo plugin, or
  - Android should use the application package name
- `tikTokAppId` is optional when platform defaults are configured in the Expo plugin
- runtime values override plugin defaults when both are provided

### `startTracking()`

Controls consent-gated tracking. If initialized with tracking disabled, calling this later flushes queued events.

### `identify(identity)` / `logout()`

Wraps TikTok advanced matching identity calls.

### `flush()`

Forces the TikTok SDK to flush queued events immediately. This is mainly useful for integration testing and rare operational cases where you do not want to wait for the normal batch interval.

### `trackEvent(event)`

Tracks a standard or custom event using a generic payload:

```ts
{
  name: 'Purchase',
  eventId: 'purchase-1',
  properties: {
    currency: 'USD',
    value: 9.99
  }
}
```

### `fetchDeferredDeepLink()`

Fetches a deferred deep link after SDK initialization.

## Notes

- `logLevel` controls SDK log verbosity.
- `debugModeEnabled` is a separate TikTok SDK mode. Leave it off for normal integration validation. On Android, TikTok's SDK can post the batch request and still count queued events as discarded when debug mode is enabled.
- Android automatic Google Play purchase tracking is not a focus of this package today. Manual purchase event tracking works, but Google Play Billing auto-IAP wiring is intentionally not included by default.

## License And Compliance

- This wrapper library is MIT-licensed.
- TikTok's Android SDK repository is also published under MIT, but TikTok documents that use of the App Events SDK is additionally governed by the TikTok For Business Commercial Terms of Service and the TikTok Business Products (Data) Terms.
- Do not treat the wrapper's MIT license as replacing TikTok's product terms for SDK usage or collected data.

## Releases

This repo uses conventional commits plus Release Please for release management.

- Releasable changes on `main` open or update a release PR with version and changelog updates.
- Merging the release PR creates the Git tag and GitHub release.
- The release workflow then publishes the package to npm via GitHub Actions.
