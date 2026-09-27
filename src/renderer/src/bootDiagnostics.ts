function showFailure(message: string): void {
  const root = document.getElementById('root')
  if (!root || root.childElementCount > 0) return
  const error = document.createElement('pre')
  error.style.cssText = 'padding:24px;color:#fca5a5;white-space:pre-wrap;font:14px system-ui'
  error.textContent = `Gorex не смог запуститься: ${message}`
  root.replaceChildren(error)
}

window.addEventListener('error', event => showFailure(event.message))
window.addEventListener('unhandledrejection', event => showFailure(String(event.reason)))
