# Version 1 scope and requirements

The fictional Harbor Circle community feed has one screen and two seeded items. Revision v1 contains “Workshop starts at 10” and “Tool swap on Friday.” Revision v2 changes the workshop time to 11 and keeps the other item. A refresh can request the feed again. The screen shows a last-updated indicator and communicates loading, offline, retry, and error states. The only persisted feed is the last good snapshot with its revision and last successful update time.

“Use demo location” requests foreground location permission through the OS. If granted, the app can display the fixed fictional region “Orchard Quarter.” The general feed is always available. The demo uses synthetic fixtures and never collects real coordinates or real user data.

The local read-only `GET /feed` API serves deterministic fixture revisions and identifies each request with a request ID. A local test harness will control a 503, delayed replies, and the order in which held replies are delivered. The harness controls response timing and fixture selection independently of the user's read-only feed action.

| ID | Requirement |
| --- | --- |
| MOB-R01 | On a fresh online launch or refresh, display the two items from the successful response and its last successful update time. While fetching, show loading and retain any visible last-good content. |
| MOB-R02 | Request foreground permission only upon tapping “Use demo location.” Show the fictional region after a grant. On denial or revocation, retain the general feed and omit the region. Recheck permission when returning from OS Settings. |
| MOB-R03 | After background and resume, once a newer revision is applied, a delayed older successful response must never replace visible or cached content or change the last-updated indicator. |
| MOB-R04 | Retain the last-good snapshot across connectivity failure and process relaunch. When offline, label cached content as stale and keep its last successful update time. With an empty cache, explain that content is unavailable and show Retry. |
| MOB-R05 | After an interruption, timeout, or 503, show a clear recoverable state and preserve any last-good content. A successful retry displays the current revision and clears the failure state. |
| MOB-R06 | Resume during refresh and relaunch after force-close with a usable feed or a clear recovery action. A request interrupted by the lifecycle must not leave the screen loading indefinitely. |
