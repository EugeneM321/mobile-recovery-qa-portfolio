# Risk and traceability

## Release risks and gate

| Risk | Requirement | Evidence required |
| --- | --- | --- |
| Stale data replaces a newer feed | MOB-R03 | M11 shows v2 remains on screen and in cache when v1 arrives late. |
| Permission denial or revocation makes the feed unusable | MOB-R02 | M03 and M04 show that the general feed continues to work without permission. |
| Connectivity failure loses the last-good feed | MOB-R04 | M06 and M09 show that the last-good snapshot and its timestamp survive an offline launch. |
| An error state is unclear or unrecoverable | MOB-R05 | M07, M08, M10, and M12 show usable retry and a clear transition to a healthy feed. |
| Background/resume or relaunch prevents recovery | MOB-R06 | M05 and M09 show the feed recovers or presents a usable next action. |

Block release if a listed risk is reproduced or if the evidence required for the declared release targets is missing or inconclusive. Document unverified platforms and never extend the release decision to them.

## Flagship traceability

**MOB-R03 → M11 → planned A04 → planned client-state regression → planned device/network evidence → planned CI/device retest**

| Layer | Intended evidence |
| --- | --- |
| MOB-R03 | When a newer response v2 is already applied, a delayed successful response v1 cannot roll back visible content, the cached revision, or the last-updated indicator. |
| M11 | Hold refresh A carrying v1, background and resume, then apply refresh B carrying v2. Release A and verify no rollback. Relaunch offline to verify cached v2. |
| Planned A04 | Reproduce deterministic out-of-order delivery and verify two successful responses, distinct request IDs, and v2 arriving before v1. |
| Planned client-state regression | Apply v2 and then deliver v1. Verify v1 is ignored and the visible and persisted state remain v2. |
| Planned device/network evidence | Correlate screen captures with request IDs and revisions in sanitized network records and device logs. Capture which revision the client applied or discarded. |
| Planned CI/device retest | Link the API and client-state CI result and the separate device retest on the corrected build. Record the build and device or OS. |

A future controlled failing build may apply every successful response in arrival order. Document it as a deliberately introduced app defect in the synthetic demo and capture an equivalent retest after correcting the stale response handling.
