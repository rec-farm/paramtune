import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { createRouter } from '@/client/router'
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/figtree'
import '@fontsource-variable/geist-mono'
import './globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><RouterProvider router={createRouter()} /></StrictMode>
)
