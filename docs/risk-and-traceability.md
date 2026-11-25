# Risk and traceability

## Release risks and gate

| Risk | Requirement | Evidence required |
| --- | --- | --- |
| Stale data replaces a newer feed | MOB-R03 | M11 verifies the screen and the client regression verifies visible and cached snapshots after late v1. |
| Permission denial or revocation makes the feed unusable | MOB-R02 | M03 and M04 show that the general feed continues to work without permission. |
| Connectivity failure loses the last-good feed | MOB-R04 | M06 and M09 show that the last-good snapshot and its timestamp survive an offline launch. |
| An error state is unclear or unrecoverable | MOB-R05 | M07, M08, M10, and M12 show usable retry and a clear transition to a healthy feed. |
| Background/resume or relaunch prevents recovery | MOB-R06 | M05 and M09 show the feed recovers or presents a usable next action. |

Block release if a listed risk is reproduced or if the evidence required for the declared release targets is missing or inconclusive. Document unverified platforms and never extend the release decision to them.

## Flagship traceability

**MOB-R03 → M11 manual Pixel 3a run → A04 API ordering → client-state stale-response regression → CI evidence**

| Layer | Evidence |
| --- | --- |
| MOB-R03 | Late v1 must not replace the visible or cached v2 snapshot or its last-updated value. |
| M11 | The [manual Pixel 3a API 34 run](test-runs/2026-11-24-pixel3a-api34-local.md#mob-r03-evidence) showed no screen rollback after releasing held v1. |
| A04 | The [API test](../tests/feed-api.test.mjs) proves both requests return valid HTTP 200 responses, with v2 completing before held v1. |
| Client-state regression | The [state test](../tests/feed-state.test.mjs) drives the real feed logic with the synthetic API and in-memory storage. It proves that late v1 is discarded and both visible and cached snapshots retain v2 and its timestamp. |
| CI evidence | [Mobile Recovery QA runs on main](https://github.com/EugeneM321/mobile-recovery-qa-portfolio/actions/workflows/qa.yml?query=branch%3Amain) show both automated checks. |

See the [controlled failure investigation](failure-investigation.md) for the client rollback and passing retest.
