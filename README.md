# @joejuice/react-native-nitro-tiktok-business-sdk

[![npm version](https://img.shields.io/npm/v/%40joejuice%2Freact-native-nitro-tiktok-business-sdk?style=flat-square)](https://www.npmjs.com/package/@joejuice/react-native-nitro-tiktok-business-sdk)
[![CI](https://github.com/joeandthejuice/react-native-nitro-tiktok-business-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/joeandthejuice/react-native-nitro-tiktok-business-sdk/actions/workflows/ci.yml)
[![Release](https://github.com/joeandthejuice/react-native-nitro-tiktok-business-sdk/actions/workflows/release.yml/badge.svg)](https://github.com/joeandthejuice/react-native-nitro-tiktok-business-sdk/actions/workflows/release.yml)
[![license](https://img.shields.io/npm/l/%40joejuice%2Freact-native-nitro-tiktok-business-sdk?style=flat-square)](./LICENSE)

Nitro-based React Native bridge for the TikTok Business App Events SDK on iOS and Android.

This package focuses on TikTok App Events. It provides a small typed API for SDK initialization, consent-gated tracking, advanced matching identity, standard/custom events, manual flushing, and deferred deep links.

## Highlights

- Built with [Nitro Modules](https://nitro.margelo.com/) for a small typed native bridge.
- Supports Expo config plugin defaults for stable native App ID / TikTok App ID setup.
- Keeps `accessToken` runtime-only by design.
- Supports nested event payloads through Nitro `AnyMap`.
- Exposes consent-gated initialization via `initialize({ trackingEnabled: false })` and `startTracking()`.
- Includes an Expo example app for iOS and Android validation.

## Scope

This package does not try to cover every TikTok Business surface.

- Included: TikTok App Events SDK integration.
- Not included: TikTok Login Kit, OpenSDK auth flows, Pangle monetization, or other unrelated TikTok Business products.

SemVer in this repo applies to the documented App Events API exposed by this package.

## Requirements

- React Native: tested with `0.81.5`
- Expo: tested with SDK `54`
- iOS: minimum target follows `min_ios_version_supported` from the installed React Native toolchain
- Android: `minSdk 23`, `targetSdk 36`, `compileSdk 36`
- Nitro runtime: `react-native-nitro-modules ^0.35.2`

## Installation

Install the package and Nitro runtime:

```sh
yarn add @joejuice/react-native-nitro-tiktok-business-sdk react-native-nitro-modules
```

or:

```sh
npm install @joejuice/react-native-nitro-tiktok-business-sdk react-native-nitro-modules
```

You also need TikTok Events Manager credentials:

- `accessToken`: TikTok App Secret
- `appId`: iOS App Store ID or Android package name
- `tikTokAppId`: TikTok App ID from Events Manager

`accessToken` stays runtime-only in this library. `appId` and `tikTokAppId` can be provided either at runtime or as native defaults through the Expo plugin.

## Expo Config Plugin

Add the plugin in `app.config.ts` or `app.json`:

```ts
plugins: [
  [
    '@joejuice/react-native-nitro-tiktok-business-sdk',
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

### Plugin options

| Option | Platform | Required | Purpose |
| --- | --- | --- | --- |
| `iosAppId` | iOS | no | Writes the default iOS App Store ID into `Info.plist`. |
| `iosTikTokAppIds` | iOS | no | Writes one or more default TikTok App IDs into `Info.plist`. |
| `androidTikTokAppIds` | Android | no | Writes one or more default TikTok App IDs into the Android manifest. |
| `androidAppId` | Android | no | Overrides the default Android package-name behavior when needed. |
| `iosUserTrackingUsageDescription` | iOS | no | Sets `NSUserTrackingUsageDescription` if your app does not already define it. |

### What the plugin configures

- adds JitPack to Android repositories when needed
- adds `use_modular_headers!` to the iOS `Podfile` target when needed
- writes iOS default `appId` and `tikTokAppId(s)` into `Info.plist`
- writes Android default `tikTokAppId(s)` and optional `appId` into the manifest
- optionally sets `NSUserTrackingUsageDescription`

Recommended split:

- configure `iosAppId`, `iosTikTokAppIds`, and `androidTikTokAppIds` in the plugin
- only set `androidAppId` if you need to override the package-name default
- keep `accessToken` at runtime
- only pass runtime `appId` or `tikTokAppId` when you intentionally want to override plugin defaults

Plugin changes require a rebuild or prebuild sync.

## Bare React Native Setup

If you are not using Expo config plugins:

1. Install `react-native-nitro-modules`.
2. Install this package.
3. Add JitPack to your Android repositories if it is not already present.
4. Add `use_modular_headers!` inside the relevant iOS `Podfile` target if it is not already present.
5. Run:

```sh
cd ios && pod install
```

## Quick Start

```ts
import {
  TikTokAppEventsModule,
  TikTokStandardEventNames,
} from '@joejuice/react-native-nitro-tiktok-business-sdk'

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
        quantity: 1,
      },
    ],
  },
  'purchase-evt-001'
)

const deferredUrl = await TikTokAppEventsModule.fetchDeferredDeepLink()

TikTokAppEventsModule.flush()
```

## API Overview

| API | Description |
| --- | --- |
| `initialize(options)` | Initializes the TikTok SDK. `accessToken` is always required at runtime. |
| `startTracking()` | Starts tracking after consent when initialized with tracking disabled. |
| `identify(identity)` | Sends advanced matching identity fields. |
| `logout()` | Clears advanced matching identity data. |
| `trackEvent(event)` | Tracks a generic event payload. |
| `trackStandardEvent(name, properties?, eventId?)` | Tracks a standard TikTok event. |
| `trackCustomEvent(name, properties?, eventId?)` | Tracks a custom event. |
| `flush()` | Forces a manual event flush. Useful for integration testing. |
| `fetchDeferredDeepLink()` | Requests a deferred deep link after initialization. |

### `initialize(options)`

Initialization supports plugin defaults and runtime overrides:

- `accessToken` is always required.
- `appId` is optional when:
  - iOS default `iosAppId` is configured in the Expo plugin, or
  - Android should use the application package name.
- `tikTokAppId` is optional when platform defaults are configured in the Expo plugin.
- Runtime values override plugin defaults.

## Example App

The repo includes an Expo example app in [`example/`](./example) for validating the integration on iOS and Android.

Run it with:

```sh
yarn
yarn example start
```

The example app includes flows for:

- standard initialization
- delayed tracking initialization
- advanced matching identify / logout
- standard events
- custom events
- deferred deep links

## Troubleshooting

### iOS delayed-tracking caveat

TikTok's iOS SDK treats `disableTracking()` as "not initialized" even after native configuration completes. This package normalizes that callback so delayed-tracking init does not surface as a false failure, but TikTok still keeps its internal `initialized` flag false on iOS in that mode.

Practical effect:

- event tracking works after `startTracking()`
- deferred deep links remain unavailable on iOS if the SDK was initialized with tracking disabled

If you need to validate deferred deep links on iOS, initialize with tracking enabled.

### Android debug mode and flush logs

`debugModeEnabled` is a TikTok SDK mode, not general logging. Leave it off for normal validation. On Android, TikTok can accept a batch request while still counting queued events as discarded when debug mode is enabled.

Use `logLevel` for SDK log verbosity during integration testing.

### Plugin changes do not apply over OTA updates

Expo plugin changes affect native configuration. Rebuild or rerun prebuild when you change plugin values such as `iosAppId`, `androidTikTokAppIds`, or `iosUserTrackingUsageDescription`.

## Notes

- The Android combined TikTok App Events + Pangle SDK is not wired in this package.
- Automatic Google Play Billing-based purchase detection is not included by default. Manual purchase event tracking works.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for local development, validation, hooks, and release workflow details.

## License and Compliance

- This wrapper library is MIT-licensed.
- TikTok's Android SDK repository is also published under MIT.
- TikTok documents that SDK use is additionally governed by TikTok For Business commercial and data terms.

Do not treat the wrapper's MIT license as replacing TikTok's product terms for SDK usage or collected data.
