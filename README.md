# Mobile Recovery QA Portfolio

[![Mobile Recovery QA](https://github.com/EugeneM321/mobile-recovery-qa-portfolio/actions/workflows/qa.yml/badge.svg?branch=main)](https://github.com/EugeneM321/mobile-recovery-qa-portfolio/actions/workflows/qa.yml)

An independent mobile QA case study using synthetic data, inspired by the types of mobile risks I tested professionally on LifeTwig. The case study asks whether a community feed stays usable after a permission change, interrupted network request, or app relaunch.

My LifeTwig work included functional and non-functional testing on iOS and Android, physical devices and emulators, AWS Device Farm, location, network, interruption and security-related testing, API validation with Postman and Charles Proxy, and crash-log investigation using ADB and Xcode/Console. The fictional app and its permission, lifecycle, and cache rules are original to this portfolio.

A delayed older feed response must never replace newer content on screen or in the cache. Start with [MOB-R03 and its traceability chain](docs/risk-and-traceability.md#flagship-traceability), then review the [12 manual cases](docs/manual-test-cases.md), [test strategy](docs/test-strategy.md), and [device matrix](docs/device-matrix.md).

## Quick Review

| Evidence | Result |
| --- | --- |
| [Android manual run](docs/test-runs/2026-11-24-pixel3a-api34-local.md) | 12/12 Pass on local Pixel 3a, Android 14 / API 34. Ready for release on this target. |
| [API automation](tests/feed-api.test.mjs) | A01–A04 pass, covering baseline, 503 recovery, interruption, and out-of-order HTTP 200 responses. |
| [Client-state regression](tests/feed-state.test.mjs) | Pass. Late v1 leaves the visible and cached v2 snapshots intact. |
| [Mobile Recovery QA CI](https://github.com/EugeneM321/mobile-recovery-qa-portfolio/actions/workflows/qa.yml?query=branch%3Amain) | Passing on main. Node.js host checks run on push and pull request. |
| [MOB-R03 traceability](docs/risk-and-traceability.md#flagship-traceability) | Requirement → M11 on Pixel 3a → A04 ordering → client-state regression → CI. |
| [Controlled failure investigation](docs/failure-investigation.md) | Removing the revision guard rolled visible and cached state back to v1. The retest with the guard passed. |
| Other platforms | iOS and physical-device execution remain Not Run. The [blocked workspace run](docs/test-runs/2026-11-24-android-v1.md) records the earlier virtualization limitation. |

Run `npm ci` and `npm test` with Node.js 24. Each test starts a fresh local API/control process on ephemeral ports. The state regression uses in-memory storage. See [local setup and diagnostic controls](docs/local-demo.md) for the native app.

All app and API code, fixtures, tests, logs, and evidence will be created specifically for this portfolio. The project uses synthetic data only and excludes client source code, production endpoints, real user data, historical credentials, private logs, and proprietary assets.
