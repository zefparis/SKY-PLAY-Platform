import { Suspense } from 'react'
import ChatPageClient from './ChatPageClient'

// The chat page uses `useSearchParams()` for deep-link handling, which forces
// Next.js to bail out of static prerendering unless the consuming component
// tree is wrapped in a Suspense boundary. We therefore keep this file as a
// thin server component that provides the boundary.
export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageClient />
    </Suspense>
  )
}
