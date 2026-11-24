# Planned device and OS matrix

| Target | OS selection | Planned scope | Status |
| --- | --- | --- | --- |
| Android emulator | Recent supported Android API level | Primary run of all 12 cases. Capture app-filtered ADB Logcat for M11. | Not Run |
| Android physical device | Recent supported Android version on an available phone | Permission changes, real network transitions, and relaunch smoke. | Not Run |
| iOS Simulator | Recent supported iOS runtime on a Mac with Xcode | Permission, app lifecycle, offline and relaunch checks, and M11 if the environment is available. Capture Xcode or Console logs. | Not Run |
| iPhone physical device | Recent supported iOS version on an available iPhone | Permission changes, real network transitions, and relaunch smoke. | Not Run |
| Older supported OS coverage | One older supported Android API level and one older supported iOS runtime, where available | Targeted permission, lifecycle, offline recovery, and retry coverage. Record results per OS. | Not Run |

Record the exact model or virtual profile, OS version or API level, build commit, and execution evidence once a run starts. **Verified** means the stated coverage was executed and its results recorded. **Blocked** means a required environment or prerequisite prevented execution. **Not Run** means execution has yet to begin. Keep physical-device and simulator results distinct. List any iOS environment limitations in the eventual run summary.
