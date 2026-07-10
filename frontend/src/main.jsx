import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './styles/globals.css'

// Check if dark mode is saved
const isDarkMode = () => {
  const saved = localStorage.getItem('darkMode');
  return saved ? JSON.parse(saved) : false;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: isDarkMode() ? '#1f2937' : '#ffffff',
              color: isDarkMode() ? '#f3f4f6' : '#1e293b',
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
              boxShadow: isDarkMode() 
                ? '0 4px 20px rgba(0,0,0,0.5)' 
                : '0 4px 20px rgba(0,0,0,0.1)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: isDarkMode() ? '#064e3b' : '#f0fdf4',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: isDarkMode() ? '#7f1d1d' : '#fef2f2',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)