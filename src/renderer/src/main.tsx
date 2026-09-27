import './desktopBridge'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LanguageProvider } from './i18n'
import { hydrateAppStorage } from './storage'
import './styles/globals.scss'
import 'bootstrap-icons/font/bootstrap-icons.css'

const root = document.getElementById('root')
if (!root) throw new Error('Gorex root element is missing')

void hydrateAppStorage().catch(error => {
  console.error('[Gorex] Could not load preferences', error)
}).finally(() => {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </React.StrictMode>,
  )
})
