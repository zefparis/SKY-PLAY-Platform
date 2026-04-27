// Periodically pings the API `/health` endpoint to keep the Railway dyno
// warm. Returns a cleanup function that clears the interval.
export function startKeepAlive(): () => void {
  if (typeof window === 'undefined') return () => {}

  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) return () => {}

  const ping = async () => {
    try {
      await fetch(`${url}/health`, { cache: 'no-store' })
    } catch {
      // silent — we don't want to spam the console if the API is briefly down
    }
  }

  // Fire one immediately so the first render also hits a warm dyno.
  ping()

  const id = setInterval(ping, 5 * 60 * 1000) // 5 minutes
  return () => clearInterval(id)
}
