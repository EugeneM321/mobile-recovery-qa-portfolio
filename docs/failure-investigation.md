# MOB-R03 controlled failure investigation

This exercise deliberately introduced a client defect in a temporary copy of the synthetic project. The manual Pixel 3a run used the original implementation.

1. Removed the revision guard from `mobile/feed.mjs` in the temporary copy. Left all assertions intact.
2. Ran `npm test`. A01–A04 passed. The client-state regression failed after refresh A (`mobile-mwvgqj87-1`, held v1) arrived after refresh B (`mobile-mwvgqj87-2`, v2).
3. The trace showed `v2 applied → v1 applied; final visible=v1; final cache=v1`. Both API responses were valid, but arrival-order writes let the older snapshot overwrite the newer screen state and cache.
4. Reran against the original implementation, where the client compares incoming and current revisions before updating state or scheduling a cache write. All five tests passed. The retest trace showed `v2 applied → v1 discarded; final visible=v2; final cache=v2`.

The regression also compares both final snapshots against the v2 snapshot, including the last-updated value. This controlled defect was never committed or pushed. See the [full traceability chain](risk-and-traceability.md#flagship-traceability).
