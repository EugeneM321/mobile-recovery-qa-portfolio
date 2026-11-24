# Manual test cases

Reset local fixtures, app state, and OS permission as indicated by each case. Revision v1 is the baseline and v2 is newer. Record the actual result and evidence for each run.

| Case | Requirement | Setup and actions | Expected result |
| --- | --- | --- | --- |
| M01 · Baseline feed | MOB-R01 | Clear cache, launch online with v1 seeded, then refresh. | Loading resolves to both seeded items with a last-updated indicator. |
| M02 · Permission granted | MOB-R02 | Begin with permission undecided. Tap “Use demo location” and grant foreground permission. | OS prompt follows the user action. Orchard Quarter appears and the feed remains usable. |
| M03 · Permission denied | MOB-R02 | Begin with permission undecided. Tap “Use demo location,” deny the request, and refresh. | The general feed stays usable and the region is absent. |
| M04 · Permission revoked | MOB-R02 | Grant permission and confirm the region. Revoke permission in OS Settings and return to the app. | The region clears on return. The general feed is still usable. |
| M05 · Background during refresh | MOB-R01, MOB-R06 | Load v1, hold a v2 refresh, background the app, and release v2 after resuming. | Existing content remains available while loading. The refresh resolves to v2 or offers a usable retry if the OS interrupted the request. |
| M06 · Offline with cache | MOB-R04 | Load v1 online, close the app normally, disconnect, and launch. | Cached v1 is visible and marked stale or offline. Its last-updated time is preserved. |
| M07 · Reconnect and retry | MOB-R04, MOB-R05 | Open with cached v1 while offline. Reconnect, select v2 in the harness, and tap Retry. | v2 appears with a successful update time. Offline and retry feedback clears. |
| M08 · Interrupted or timed-out refresh | MOB-R05 | Prime v1, hold a refresh until timeout or interrupt it in flight. Restore normal delivery and retry with v2. | The request exits loading, retains v1, and exposes a recovery action. The retry shows v2 and clears the failure. |
| M09 · Force-close and relaunch offline | MOB-R04, MOB-R06 | Prime v1, start a delayed refresh, force-close the process, go offline, and relaunch. | The app recovers the last-good v1 snapshot and offers Retry. No unfinished loading state is restored. |
| M10 · 503 recovery | MOB-R05 | Prime v1, make the next refresh return 503, then retry against a healthy v2 response. | Clear error and Retry appear while v1 remains visible. The successful retry shows v2 and clears the error. |
| M11 · Late older success | MOB-R03 | Hold a v1 response from refresh A. Background and resume. Start refresh B, deliver v2, record the screen and last-updated time, then release v1. Reopen offline to inspect the saved snapshot. | The visible feed and indicator stay at v2 after v1 arrives. Offline relaunch still shows cached v2 with its last successful update time. |
| M12 · Offline with no cache | MOB-R04, MOB-R05 | Clear app data, launch offline, then reconnect and tap Retry. | The app shows an understandable empty state and a usable Retry. The seeded feed appears after reconnecting. |

For M11, confirm in the logs that both responses succeeded and that the older response reached the client. If the OS cancels the first request, record that result and rerun with the controlled delivery sequence before declaring the stale-response requirement verified on that target.
