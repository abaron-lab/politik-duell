import { lazy, Suspense, useSyncExternalStore } from 'react'
import App from './App.tsx'

// Admin-Ansicht unter #/admin – eigenes Bundle, wird nur dort geladen.
const Admin = lazy(() => import('./admin/Admin.tsx').then((m) => ({ default: m.Admin })))

const useHash = () =>
  useSyncExternalStore(
    (f) => (addEventListener('hashchange', f), () => removeEventListener('hashchange', f)),
    () => location.hash,
  )

export function Wurzel() {
  return useHash().startsWith('#/admin') ? (
    <Suspense fallback={null}>
      <Admin />
    </Suspense>
  ) : (
    <App />
  )
}
