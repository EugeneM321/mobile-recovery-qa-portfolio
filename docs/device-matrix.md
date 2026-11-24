# Device and OS matrix

| Target | OS and profile | Planned scope | Step 3 status |
| --- | --- | --- | --- |
| Android emulator | Harbor35, Android 15 (API 35), x86_64 | Primary run of all 12 cases and app-filtered ADB Logcat for M11. | Blocked — ADB remained offline and the emulator terminated before installation. |
| Older supported Android emulator | Harbor30, Android 11 (API 30), x86_64 | Fallback for execution, then targeted permission, lifecycle, offline recovery, and retry coverage. | Blocked — ADB did not confirm a booted, usable Android target. |
| Android physical device | Recent supported Android version | Permission changes, real network transitions, and relaunch smoke. | Not Run — no authorized physical Android device available. |
| iOS Simulator | Recent supported iOS runtime | Permission, lifecycle, offline recovery, relaunch, and M11. | Not Run — macOS/Xcode runtime unavailable in this workspace. |
| iPhone physical device | Recent supported iOS version | Permission changes, real network transitions, and relaunch smoke. | Not Run — no supported build/test path in this workspace. |
| Older supported iOS runtime | One older supported iOS version | Targeted permission, lifecycle, and recovery coverage. | Not Run — macOS/Xcode runtime unavailable in this workspace. |

See the [Step 3 Android run](test-runs/2026-11-24-android-v1.md) for the tested commit, boot and build diagnostics, and case results.

Record the exact device or virtual profile, OS version or API level, build commit, and execution evidence. **Verified** means the stated coverage was executed and its results recorded. **Blocked** means a required environment or prerequisite prevented execution. **Not Run** means execution has yet to begin. Keep physical-device and simulator results distinct.
