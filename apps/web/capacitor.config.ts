import { CapacitorConfig } from '@capacitor/cli'

// Platform-scoped bundle IDs:
//  - Android keeps the historical 'cm.skyplay.app' (already signed & published)
//  - iOS uses the new 'cloud.skyplay.app' (TestFlight / App Store)
// Switch via CAPACITOR_PLATFORM=ios|android when running `cap add` / `cap sync`.
const isIos = process.env.CAPACITOR_PLATFORM === 'ios'

const config: CapacitorConfig = {
  appId: isIos ? 'cloud.skyplay.app' : 'cm.skyplay.app',
  appName: 'SKY PLAY',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: isIos ? 'https://skyplay.cloud' : 'https://sky-play-platform.vercel.app',
    cleartext: !isIos,
  },
  android: {
    allowMixedContent: true,
  },
}

export default config
