# Local Pixel 3a Android manual run — 2026-11-24

**Result** — 12 Pass, 0 Fail, 0 Blocked. **PASS / READY FOR RELEASE** for the tested Pixel 3a API 34 emulator target.

## Environment and build

- Windows 11 host, local Android Studio emulator, Pixel 3a, Android 14, API 34, x86_64, Google APIs image.
- Package `dev.qaportfolio.harborcircle`, APK `harbor-circle-qa-android-x86_64.apk`. Release-variant QA build, debug-signed, with embedded Hermes bundle and source baseline `b015e80`.
- Synthetic API on the Windows host via `http://10.0.2.2:3000/feed`. No client or proprietary data was used.
- Results are based on the tester's reported observations from the local emulator.

## Manual case results

| Case | Result | Observed behavior |
| --- | --- | --- |
| M01 | Pass | Revision v1 loaded with both seeded items and the last-updated indicator. Refresh worked. |
| M02 | Pass | Granting foreground location showed “Orchard Quarter (demo region).” The feed remained usable. |
| M03 | Pass | Denying location kept the demo region hidden. General feed, v1, and both items remained usable. |
| M04 | Pass | Location was granted and then revoked in Android Settings. On return, the demo region disappeared and General feed returned. Revision v1 and both items remained usable. |
| M05 | Pass | Started refresh, pressed Android Home, and resumed. The refresh completed and the feed remained usable. |
| M06 | Pass | Cold launch with Wi-Fi and mobile data disabled restored cached v1, both items, stale/offline feedback, and Retry. |
| M07 | Pass | Reconnected and selected Retry. Stale/offline feedback cleared, the last-updated indicator refreshed, and the feed returned to its online state. |
| M08 | Pass | The v1 response delayed by 55,000 ms timed out. The last-good feed remained visible with stale feedback and Retry. Restoring normal v1 and retrying recovered the feed. |
| M09 | Pass | Force-stopped during a delayed refresh, disabled Wi-Fi and mobile data, then cold-launched. Cached v1, both items, stale/offline feedback, and Retry were restored. |
| M10 | Pass | Simulated HTTP 503 for v1 preserved the last-good feed and offered Retry. After restoring normal v1, Retry cleared the error, refreshed the timestamp, and restored the online state with both items. |
| M11 / MOB-R03 | Pass | Applied v2 before releasing held v1 request `mobile-mwvfpmgj-11`. The screen remained on v2 with both v2 items. |
| M12 | Pass | Cleared app data with `pm clear`, disabled Wi-Fi and mobile data, and cold-launched. No old items appeared. “Offline. No saved feed is available.” and Retry were shown. The app remained stable. |

## MOB-R03 evidence

1. Set the control server to hold v1 and started refresh A. The held request ID was `mobile-mwvfpmgj-11`.
2. Switched new requests to normal v2 and started refresh B. The app showed Revision v2, “Workshop starts at 11,” and “Tool swap on Friday.”
3. Released refresh A. The control server accepted the release and the app stayed on Revision v2 with the same items.

**Traceability:** MOB-R03 → M11 → local Pixel 3a API 34 run → v2 applied before held v1 request `mobile-mwvfpmgj-11` was released → the visible feed stayed on Revision v2 with no rollback.

## Release scope and limitations

The decision applies only to this APK on the tested local Pixel 3a emulator. Physical Android and iOS remain Not Run. M11 establishes the visible revision result. Its report does not include a separate post-release cache read, offline relaunch for that sequence, timestamp comparison, response-arrival logs, or a background/resume transition during M11 itself. Cache restoration and background/resume were observed in the other cases above. M12 established the offline empty state and availability of Retry. Reconnection and successful Retry were observed in M07.

The [earlier blocked workspace run](2026-11-24-android-v1.md) remains a separate record of the workspace virtualization limitation. No automation or CI was added for this run.
