import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(15, 23, 42, 0.96)',
              color: 'var(--color-neutral-0)',
              fontSize: 'var(--font-size-sm)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
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
