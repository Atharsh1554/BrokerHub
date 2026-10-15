import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { AppProvider } from './context/AppContext.tsx'
import { NotificationProvider } from './context/NotificationContext.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)

