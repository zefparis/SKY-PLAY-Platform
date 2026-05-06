export default function manifest() {
  return {
    name: 'SkyPlay Africa',
    short_name: 'SkyPlay',
    display: 'standalone',
    background_color: '#00165F',
    theme_color: '#00165F',
    icons: [
      { src: '/skyplay_africa_400.png', sizes: '400x400', type: 'image/png' },
      { src: '/skyplay_africa_120.png', sizes: '120x120', type: 'image/png' },
    ],
  }
}
