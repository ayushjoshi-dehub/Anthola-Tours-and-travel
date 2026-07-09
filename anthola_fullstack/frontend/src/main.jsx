import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { HeroUIProvider } from '@heroui/react';
import App from './App';
import { useTheme } from './lib/theme';
import './styles.css';

const queryClient = new QueryClient();

function Root() {
  const theme = useTheme((s) => s.theme);
  // HeroUI uses built-in light/dark; staging falls back to dark for its components.
  const herouiTheme = theme === 'staging' ? 'dark' : theme;
  return (
    <HeroUIProvider theme={herouiTheme} defaultTheme="dark">
      <App />
    </HeroUIProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Root />
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
