# Test strategy

The main quality question is whether a read-only mobile feed stays truthful and usable when permissions, app lifecycle, or connectivity change. Prioritize the transitions where device state and network timing interact, especially foregrounding during a pending request and reopening offline.

## Execution plan

- Run baseline, permission, lifecycle, network, and cache coverage on the primary Android emulator. Run corresponding release-critical checks on any available iOS target and targeted checks on physical devices and older OS targets per the [device matrix](device-matrix.md).
- Reset app storage, permissions, and the response harness to each case's preconditions. Use OS Settings, the app switcher, and a real process relaunch for lifecycle and permission cases. Use controlled response delivery for timing-sensitive checks.
- Record the build commit, target model or emulator profile, OS/API version, result, observed behavior, and evidence or defect reference. Record device and network observations separately, then correlate request IDs, revisions, timestamps, and lifecycle events.
- Keep native prompts, OS Settings, backgrounding, and relaunch manual in Version 1. Plan API checks for the response contract and failure/recovery conditions. Plan a client-state regression for a late older revision. Future CI covers these deterministic automated checks, with native execution recorded separately.
- Apply the [release gate](risk-and-traceability.md#release-risks-and-gate) using actual results. Record any device coverage gaps alongside the decision.

Future evidence will use app-filtered ADB or Xcode/Console output and sanitized local request/response records. Evidence must come from the synthetic demo. Inspect exception and termination records before classifying a crash. Document deliberate force-closes as test actions.
