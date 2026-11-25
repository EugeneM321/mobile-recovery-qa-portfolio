# Mobile Recovery QA Portfolio

An independent mobile QA case study using synthetic data, inspired by the types of mobile risks I tested professionally on LifeTwig. The case study asks whether a community feed stays usable after a permission change, interrupted network request, or app relaunch.

My LifeTwig work included functional and non-functional testing on iOS and Android, physical devices and emulators, AWS Device Farm, location, network, interruption and security-related testing, API validation with Postman and Charles Proxy, and crash-log investigation using ADB and Xcode/Console. The fictional app and its permission, lifecycle, and cache rules are original to this portfolio.

A delayed older feed response must never replace newer content on screen or in the cache. Start with [MOB-R03 and its traceability chain](docs/risk-and-traceability.md#flagship-traceability), then review the [12 manual cases](docs/manual-test-cases.md), [test strategy](docs/test-strategy.md), and [device matrix](docs/device-matrix.md).

**Status** — The synthetic app and local API are implemented. The [local Pixel 3a Android 14 / API 34 manual run](docs/test-runs/2026-11-24-pixel3a-api34-local.md) recorded **12 Pass, 0 Fail, 0 Blocked** and is **Ready for Release** on that emulator target. Physical Android and iOS remain Not Run. See [local setup and diagnostic controls](docs/local-demo.md).

All app and API code, fixtures, tests, logs, and evidence will be created specifically for this portfolio. The project uses synthetic data only and excludes client source code, production endpoints, real user data, historical credentials, private logs, and proprietary assets.
