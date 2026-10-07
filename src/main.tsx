import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Boot } from './Boot.tsx'
import { registerServiceWorker } from './pwa.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Boot />
  </StrictMode>,
)

registerServiceWorker()
