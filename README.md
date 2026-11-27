# Mobile Recovery QA Portfolio

[![Mobile Recovery QA](https://github.com/EugeneM321/mobile-recovery-qa-portfolio/actions/workflows/qa.yml/badge.svg?branch=main)](https://github.com/EugeneM321/mobile-recovery-qa-portfolio/actions/workflows/qa.yml)

An independent mobile QA case study using synthetic data, inspired by the types of mobile risks I tested professionally on LifeTwig. The case study asks whether a community feed stays usable after a permission change, interrupted network request, or app relaunch.

**Flagship risk:** If v2 arrives before delayed v1, the app must retain v2 on screen and in its cache. The recorded Android emulator run verified the visible revision. The Node.js client-state regression verifies both states.

## Quick Review

| Evidence | Result |
| --- | --- |
| [Android manual run](docs/test-runs/2026-11-24-pixel3a-api34-local.md) | 12/12 Pass on local Pixel 3a, Android 14 / API 34. Ready for release on this target. |
| [API automation](tests/feed-api.test.mjs) | A01–A04 pass, covering baseline, 503 recovery, interruption, and out-of-order HTTP 200 responses. |
| [Client-state regression](tests/feed-state.test.mjs) and [recovery cases](tests/feed-recovery.test.mjs) | 9 host tests passed locally, including the stale-response regression. |
| [Mobile Recovery QA CI](https://github.com/EugeneM321/mobile-recovery-qa-portfolio/actions/workflows/qa.yml?query=branch%3Amain) | Passing on main. Node.js host checks run on push and pull request. |
| [MOB-R03 traceability](docs/risk-and-traceability.md#flagship-traceability) | Requirement → M11 on Pixel 3a → A04 ordering → client-state regression → CI. |
| [Controlled failure investigation](docs/failure-investigation.md) | Removing the revision guard rolled visible and cached state back to v1. The retest with the guard passed. |
| [Device matrix](docs/device-matrix.md) | iOS and physical-device execution remain Not Run. The [blocked workspace run](docs/test-runs/2026-11-24-android-v1.md) records the earlier virtualization limitation. |

See the [test strategy](docs/test-strategy.md) and [12 manual cases](docs/manual-test-cases.md) for the full QA scope.

## Quick start

**Host regression suite** (Node.js 24, no emulator required).

```sh
npm ci
npm test
```

Run the suites separately with `npm run test:api` and `npm run test:state`. The harness starts a fresh local server on ephemeral ports for each case. Host state tests use isolated storage adapters and a controlled timer. They cover stale-response ordering, fresh-controller restore, timeout and Retry, malformed or mismatched responses, corrupt cache, and storage errors. CI publishes separate API and state JUnit summaries. Android permissions, lifecycle, and assistive-technology behavior still require device or emulator evidence.

**Android demo** (requires Android SDK tooling and a running emulator). Start the API in one terminal, then build and launch the Expo / React Native app in another.

```sh
npm run api
```

```sh
npm run android
```

The emulator connects to `http://10.0.2.2:3000/feed`. See [native setup and diagnostic controls](docs/local-demo.md) for embedded-bundle builds for offline relaunch and the exact held-response sequence.

## Project boundaries

My LifeTwig work included functional and non-functional testing on iOS and Android, physical devices and emulators, AWS Device Farm, location, network, interruption and security-related testing, API validation with Postman and Charles Proxy, and crash-log investigation using ADB and Xcode/Console. The fictional app and its permission, lifecycle, and cache rules are original to this portfolio.

The app, API, fixtures, tests, logs, and evidence were created for this portfolio using synthetic data. The project excludes client source code, production endpoints, real user data, historical credentials, private logs, and proprietary assets.
