import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Add error logging
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error:', { message, source, lineno, colno, error })
  // You might want to log this to a file or send it to a logging service
  return false
}

// Add unhandled promise rejection logging
window.onunhandledrejection = function(event) {
  console.error('Unhandled promise rejection:', event.reason)
  // You might want to log this to a file or send it to a logging service
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
