import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/nunito'
import './index.css'
import { Wurzel } from './Wurzel.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Wurzel />
  </StrictMode>,
)
