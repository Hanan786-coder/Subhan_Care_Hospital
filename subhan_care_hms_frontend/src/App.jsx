import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { useTheme } from './context/ThemeContext';

function App() {
  const { isDark } = useTheme();

  return (
    <BrowserRouter>
      <AuthProvider>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <div id="main-content" tabIndex="-1">
          <AppRoutes />
        </div>
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 4000,
            style: {
              background: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.95)',
              color: isDark ? 'var(--color-neutral-0)' : 'var(--color-neutral-900)',
              fontSize: 'var(--font-size-sm)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            },
            success: {
              iconTheme: {
                primary: 'var(--color-secondary-500)',
                secondary: 'var(--color-neutral-0)',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--color-danger-500)',
                secondary: 'var(--color-neutral-0)',
              },
            },
          }} 
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
