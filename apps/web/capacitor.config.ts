import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'cm.skyplay.app',
  appName: 'SKY PLAY',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: 'https://sky-play-platform.vercel.app',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
}

export default config
