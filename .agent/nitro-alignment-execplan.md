# Align Nitro TikTok Business SDK With Nitro Best Practices

This ExecPlan is a living document. Keep `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` up to date as work proceeds.

This plan follows `.agent/PLANS.md`.

## Purpose / Big Picture

This package already works, but it should better reflect Nitro's current recommended structure and the strongest lessons from competing TikTok Business wrappers. The goal is to keep the Nitro-based architecture, tighten the package around the current best practices from the Nitro repo/docs, and add the highest-value missing capabilities without bloating the API.

Success looks like this:

- the package still builds and autolinks cleanly on iOS and Android
- the public API is slightly stronger where the underlying TikTok SDK already supports it
- generated Nitro files are treated the way Nitro recommends
- the package has basic wrapper-level test coverage and CI exercises it
- the README reflects the final supported behavior clearly

## Progress

- [x] (2026-03-30 15:02Z) Reviewed Nitro docs for `nitro.json`, autolinking, default-constructible Hybrid Objects, and generated-file handling.
- [x] (2026-03-30 15:07Z) Compared our package against `mtebele/react-native-tiktok-business-sdk` and identified reusable improvements.
- [x] (2026-03-30 15:28Z) Implemented the selected alignment changes in the standalone repo: enabled Nitro's generated-file flag, added `flush()`, tightened JS-side event validation, added wrapper tests, updated CI, and refreshed the docs/example app.
- [x] (2026-03-30 15:37Z) Ran targeted validation for lint, typecheck, codegen, tests, and native example builds on both Android and iOS.

## Surprises & Discoveries

- Observation: Nitro's docs recommend `gitAttributesGeneratedFlag: true`, but this repo currently has it disabled in `nitro.json`.
  Evidence: `nitro.margelo.com/docs/getting-started/configuration-nitro-json` and `nitro.json`.

- Observation: The TikTok iOS SDK we already ship exposes `explicitlyFlush`, and the Android 1.6.0 SDK exposes `flush()`.
  Evidence: `example/ios/Pods/TikTokBusinessSDK/TikTokBusinessSDK/TikTokBusiness.h` and `javap` output for `com.tiktok.TikTokBusinessSdk`.

- Observation: This repo currently has CI for lint/typecheck/builds but no library test suite of its own.
  Evidence: `.github/workflows/ci.yml` and absence of repo-local `*.test.*` files outside `node_modules`.

- Observation: Running `lint` in parallel with `prepare` can produce false negatives because Builder Bob cleans and regenerates the `nitrogen/` directory during prepare.
  Evidence: transient `ENOENT .../nitrogen` failures disappeared when `yarn lint` was rerun after `yarn prepare` completed.

## Decision Log

- Decision: Do not add Google Play Billing just for parity with another wrapper.
  Rationale: Billing is only needed for automatic Google Play purchase tracking. This package should not add runtime baggage for a feature we do not currently need or clearly promise.
  Date/Author: 2026-03-30 / Codex

- Decision: Keep the Nitro architecture and improve around it instead of porting legacy React Native bridge patterns.
  Rationale: Our typed Nitro surface is cleaner than the classic `NativeModules` approach and already matches Nitro's recommended model.
  Date/Author: 2026-03-30 / Codex

- Decision: Prioritize `flush()`, generated-file handling, wrapper-level tests, and doc/CI cleanup.
  Rationale: These are low-risk, high-value changes supported by the underlying SDKs and Nitro docs.
  Date/Author: 2026-03-30 / Codex

## Outcomes & Retrospective

Implemented and validated:

- `nitro.json` now enables Nitro's `gitAttributesGeneratedFlag`, which better matches Nitro's current generated-file guidance.
- The package now exposes `flush()` across JS, Kotlin, and iOS, backed by the existing TikTok SDK capabilities on both platforms.
- The JS wrapper has its own Jest coverage now, including initialization normalization, identity normalization, helper routing, deferred deep link passthrough, `flush()`, and custom-event validation.
- CI now exercises the wrapper test suite instead of only lint/type/native builds.
- The README and example app now document and demonstrate `flush()` and explicitly note that Google Play Billing auto-IAP support is intentionally not bundled.

Validation completed successfully:

- `yarn install`
- `yarn nitrogen`
- `yarn prepare`
- `yarn lint`
- `yarn typecheck`
- `yarn test`
- `yarn example expo prebuild --platform android --clean`
- `./gradlew app:assembleDebug`
- `yarn example expo prebuild --platform ios --clean`
- `xcodebuild -workspace TikTokBusinessSDKExample.xcworkspace -scheme TikTokBusinessSDKExample -configuration Debug -destination id=A36FAD28-B71E-48E4-9BFF-2457F8660D49 build`

Retrospective:

- The highest-value improvements were small and operational, not architectural. Nitro alignment mainly meant tightening generated-file handling and protecting the JS contract with tests, not rewriting the native layer.
- Billing support remains a deliberate non-goal until the package actually needs automatic Google Play purchase tracking.

## Context and Orientation

The package root is `/Users/dmorales/Code/Joe/react-native-nitro-tiktok-business-sdk`.

Key files:

- `nitro.json`: Nitro/Nitrogen configuration for namespaces, autolinking, and generated-file behavior.
- `src/specs/TikTokAppEvents.nitro.ts`: the typed public native contract.
- `src/index.ts`: public JavaScript wrapper and convenience API.
- `ios/HybridTikTokAppEvents.mm` and `ios/TikTokAppEventsIosFacade.m`: iOS bridge and SDK integration.
- `android/src/main/java/com/margelo/nitro/tiktokappevents/HybridTikTokAppEvents.kt`: Android bridge and SDK integration.
- `README.md`: public install/usage docs.
- `.github/workflows/ci.yml`: CI checks for this library.

Terms used here:

- Nitro: the runtime and architecture for Hybrid Objects used by `react-native-nitro-modules`.
- Nitrogen: the code generator that reads `*.nitro.ts` specs and emits native bindings/autolinking files.
- Hybrid Object: a typed object constructible from JavaScript and implemented in C++, Swift, or Kotlin.
- Autolinking: Nitro's generated constructor registration for default-constructible Hybrid Objects.

## Plan of Work

First, update the Nitro configuration to match current Nitro guidance where doing so is safe and beneficial, especially around generated-file handling. Then extend the public API with a small missing capability, `flush()`, because the shipped TikTok SDKs already support it and it helps testing and operational control.

After that, add a focused wrapper-level test suite for `src/index.ts` so the JavaScript contract is validated independently of native builds. Keep the tests small and deterministic by mocking `react-native-nitro-modules`. Finally, update CI and README so the package's stated behavior matches the implemented surface.

## Concrete Steps

1. In `/Users/dmorales/Code/Joe/react-native-nitro-tiktok-business-sdk`, update `nitro.json` to enable Nitro's generated-file flag behavior, then run `yarn nitrogen`.
2. Add `flush()` to:
   - `src/specs/TikTokAppEvents.nitro.ts`
   - `src/index.ts`
   - `ios/TikTokAppEventsIosFacade.m`
   - `ios/HybridTikTokAppEvents.mm`
   - `android/src/main/java/com/margelo/nitro/tiktokappevents/HybridTikTokAppEvents.kt`
3. Add a wrapper-level test setup under `src/__tests__/` and wire a `test` script in `package.json`.
4. Update `.github/workflows/ci.yml` to run the tests.
5. Update `README.md` to document `flush()` and the clarified package behavior.
6. Run targeted validation:
   - `yarn nitrogen`
   - `yarn lint`
   - `yarn typecheck`
   - `yarn test`
   - `yarn prepare`
   - `yarn example expo prebuild --platform android --clean`
   - `./gradlew app:assembleDebug` from `example/android`
   - `yarn example expo prebuild --platform ios --clean`
   - `xcodebuild -workspace TikTokBusinessSDKExample.xcworkspace -scheme TikTokBusinessSDKExample -configuration Debug -destination id=A36FAD28-B71E-48E4-9BFF-2457F8660D49 build` from `example/ios`

## Validation and Acceptance

The work is complete when:

- `yarn nitrogen`, `yarn lint`, `yarn typecheck`, `yarn test`, and `yarn prepare` all pass from the package root.
- The Android example assembles after a clean Expo prebuild.
- The iOS example builds after a clean Expo prebuild.
- The README documents the `flush()` API and does not overstate unsupported features.
- Generated Nitro files are marked as generated via Nitro's recommended mechanism.

## Idempotence and Recovery

All changes are additive or configuration-local.

- Re-running `yarn nitrogen` should be safe and should only refresh generated files.
- Re-running Expo prebuild with `--clean` should regenerate the example apps deterministically.
- If native builds fail after adding `flush()`, revert only the new `flush()` wiring and confirm whether the failure is platform-specific.
- If the test setup causes tooling conflicts, keep the API changes and fall back to a lighter runner while preserving the same assertions.

## Artifacts and Notes

Current evidence collected before implementation:

- Nitro docs say autolinked Hybrid Objects must be default-constructible and Kotlin classes should use `@DoNotStrip`.
- Our Android Hybrid Object already follows those requirements.
- Competing wrapper has stronger wrapper-level tests and exposes `flush()`.
- Competing wrapper also has correctness issues we should not copy, including looser threading discipline and a hardcoded USD currency path on iOS.

## Interfaces and Dependencies

Important interfaces:

- `TikTokAppEvents` in `src/specs/TikTokAppEvents.nitro.ts`
- `TikTokInitializeOptions`, `TikTokIdentity`, and `TikTokEvent`
- `TikTokBusinessSdk` on Android
- `TikTokBusiness` / `TikTokConfig` on iOS

Important dependencies:

- `react-native-nitro-modules`
- `nitrogen`
- `TikTokBusinessSDK` iOS pod `1.6.0`
- `com.github.tiktok:tiktok-business-android-sdk:1.6.0`

Revision note: created this plan after reviewing Nitro docs plus a competing TikTok Business wrapper to identify concrete improvements that preserve the current Nitro architecture.
