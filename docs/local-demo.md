# Run the local demo

Use Node.js 24 and the native build tools for your target. From the repository root:

```sh
npm ci
npm run api
```

In another terminal, start an Android emulator and build and install the app:

```sh
npm run android
```

The emulator uses `http://10.0.2.2:3000/feed` to reach the host. On a physical Android device connected by ADB, use `adb reverse tcp:3000 tcp:3000` and prefix the build command with `EXPO_PUBLIC_FEED_URL=http://127.0.0.1:3000/feed`. On a Mac with Xcode and an iOS Simulator, use `npm run ios`. The Simulator uses `http://localhost:3000/feed`. Keep the feed server on the same host as the emulator or simulator.

Use an embedded-bundle build for offline cold launch and relaunch. This lets the app start when Metro is unreachable. Rebuild with the appropriate feed URL if you changed it:

```sh
npm run android -- --variant release
# On macOS with Xcode
npm run ios -- --configuration Release
```

The feed binds to loopback by default. For a physical device that cannot use USB forwarding, use an isolated test network, set `DEMO_FEED_HOST` to the host's test-network address, and set `EXPO_PUBLIC_FEED_URL` to that address and port 3000 before building. This demo uses local HTTP and synthetic data only.

## Local test controls

The read-only mobile endpoint is `GET /feed` on port 3000. The development harness listens separately on loopback port 3001. Its settings affect new requests. A delayed or held request retains the revision selected when it started.

```sh
# Inspect the plan and held requests.
curl -s http://127.0.0.1:3001/control

# Select normal, 503, delay, or hold and fixture v1 or v2.
curl -s http://127.0.0.1:3001/control -H 'Content-Type: application/json' \
  -d '{"mode":"normal","revision":"v1"}'

# Release one held request by ID.
curl -s http://127.0.0.1:3001/control/release -H 'Content-Type: application/json' \
  -d '{"requestId":"ID_FROM_CONTROL_STATUS"}'
```

For `delay`, include `"delayMs":3000`. To observe a client timeout, use a delay greater than 45,000 ms and no more than 55,000 ms. Restarting the API resets the response plan to normal v1 and clears held requests. Clear the app's data or reinstall to start with an empty device cache.

## MOB-R03 spot-check sequence

1. Start online and load the seeded feed. Set the harness to `hold` with revision `v1`.
2. Tap Refresh to start A and note its ID in the control status. Background and resume the app.
3. Switch the harness to `normal` with revision `v2`. Tap Refresh to start B. Observe v2 and record its last-updated value.
4. Release A by ID before the client timeout. Confirm both requests report 200 and the older response is discarded. The displayed revision and last-updated value should stay at v2.
5. Go offline, force-close, and reopen the embedded-bundle build. Verify cached v2 and its update time remain visible.

## Diagnostics

The app and server emit one JSON line per event. Look for `at`, `source`, `event`, and, where applicable, `requestId`, `requestedRevision`, `responseRevision`, `status`, and `action`. The app requests the latest revision. The harness logs the fixture revision it assigned to the same ID. The app logs lifecycle, retry, cache, and response decisions. Use Metro for development console output, or inspect Android Logcat or macOS Console on an installed build. The logs exclude coordinates and feed payloads.

## Step 2 spot checks

On the Linux host, the Android JavaScript bundle exported and Expo generated the Android project. Using the running API and the app's feed logic with an in-memory stand-in for device storage, manual spot checks observed the two seeded items, revision change, 503 recovery, preserved offline content, retry, and snapshot restoration. The controlled v2-before-v1 sequence produced two 200 responses. The client applied v2, discarded v1, and preserved the v2 snapshot and timestamp.

Native execution was blocked. The Android 15 (API 35) x86_64 emulator attempt could not complete startup in the workspace, and no physical Android device was attached. iOS was not run because the workspace has no macOS/Xcode runtime. These observations do not establish native permission, background/resume, or process relaunch results.
