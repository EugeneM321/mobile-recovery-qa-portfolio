import { useEffect, useMemo, useRef, useState } from 'react'
import { AppState, Button, Platform, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import { getForegroundPermissionsAsync, requestForegroundPermissionsAsync } from 'expo-location'
import { createFeed } from './feed.mjs'

const endpoint = process.env.EXPO_PUBLIC_FEED_URL ?? (Platform.OS === 'android'
  ? 'http://10.0.2.2:3000/feed'
  : 'http://localhost:3000/feed')

// The demo needs local link state, even on a network without Internet access.
NetInfo.configure({ reachabilityShouldRun: () => false })

function log(event, details) {
  console.info(JSON.stringify({ at: new Date().toISOString(), source: 'harbor-circle', event, ...details }))
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [state, setState] = useState({ snapshot: null, problem: null, offline: false, loading: false })
  const [regionVisible, setRegionVisible] = useState(false)
  const [permissionMessage, setPermissionMessage] = useState(null)
  const permissionCheck = useRef(0)
  const feed = useMemo(() => createFeed({ url: endpoint, storage: AsyncStorage, publish: setState, log }), [])

  async function checkPermission(ask = false) {
    const check = ++permissionCheck.current
    try {
      const permission = await (ask ? requestForegroundPermissionsAsync() : getForegroundPermissionsAsync())
      if (check !== permissionCheck.current) return
      setRegionVisible(permission.granted)
      if (permission.granted) setPermissionMessage(null)
      else if (ask) {
        setPermissionMessage(permission.canAskAgain
          ? 'Location is off. You can still use the general feed.'
          : 'Location is off. You can enable it in OS Settings.')
      }
      log('permission.checked', { granted: permission.granted, userRequested: ask })
    } catch {
      if (check !== permissionCheck.current) return
      setRegionVisible(false)
      setPermissionMessage('Location permission is unavailable. The general feed still works.')
      log('permission.check_failed')
    }
  }

  useEffect(() => {
    let live = true
    let previous = AppState.currentState
    function updateNetwork(network) {
      feed.setOffline(network.isConnected === false)
    }
    const networkSubscription = NetInfo.addEventListener(updateNetwork)
    const lifecycle = AppState.addEventListener('change', next => {
      log('lifecycle.changed', { from: previous, to: next })
      previous = next
      if (next === 'active') {
        setRegionVisible(false)
        void checkPermission()
        void NetInfo.refresh().then(network => {
          if (live) updateNetwork(network)
        }).catch(() => log('network.check_failed'))
      }
    })

    async function launch() {
      log('lifecycle.launch', { state: previous })
      await feed.restore()
      if (!live) return
      void checkPermission()
      try {
        const network = await NetInfo.fetch()
        if (!live) return
        updateNetwork(network)
      } catch {
        log('network.check_failed')
      }
      if (!live) return
      setReady(true)
      void feed.refresh('launch')
    }

    void launch()
    return () => {
      live = false
      permissionCheck.current++
      networkSubscription()
      lifecycle.remove()
    }
  }, [feed])

  const { snapshot, problem, offline, loading } = state
  const showRetry = Boolean(offline || problem)
  return (
    <SafeAreaView style={styles.screen}>
      <Text accessibilityRole="header" style={styles.title}>Harbor Circle</Text>
      <Text>{regionVisible ? 'Orchard Quarter (demo region)' : 'General feed'}</Text>
      <View style={styles.controls}>
        <Button title="Use demo location" onPress={() => { void checkPermission(true) }} />
        {permissionMessage && <Text accessibilityLiveRegion="polite">{permissionMessage}</Text>}
      </View>
      <View style={styles.feed}>
        {snapshot && <>
          <Text>Revision: {snapshot.revision}</Text>
          <Text>Last updated: {new Date(snapshot.updatedAt).toISOString()}</Text>
          {snapshot.items.map((item, index) => <Text key={index} style={styles.item}>{item}</Text>)}
        </>}
        <View accessibilityLiveRegion="polite" style={styles.status}>
          {(!ready || loading) && !offline && <Text>{snapshot ? 'Refreshing feed…' : 'Loading feed…'}</Text>}
          {offline && <Text>{snapshot ? 'Offline. Showing saved feed (stale).' : 'Offline. No saved feed is available.'}</Text>}
          {!offline && problem && <Text>{problem}{snapshot ? ' Showing saved feed (stale).' : ''}</Text>}
        </View>
        <Button title="Refresh" disabled={!ready} onPress={() => { void feed.refresh('refresh') }} />
        {showRetry && <Button title="Retry" disabled={!ready} onPress={() => { void feed.refresh('retry') }} />}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: '#f3f7f7' },
  title: { fontSize: 27, fontWeight: '700', color: '#173b3c' },
  controls: { marginVertical: 18, alignItems: 'flex-start', gap: 6 },
  feed: { backgroundColor: '#fff', borderRadius: 10, padding: 16, gap: 10 },
  item: { color: '#173b3c', fontSize: 17, paddingVertical: 8 },
  status: { gap: 4 },
})
