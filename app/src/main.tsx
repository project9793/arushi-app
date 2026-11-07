import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { installAndroidShim } from './native/androidShim';
import './index.css';

// Must run before any action can be requested: it defines window.ArushiNative
// when the app is inside the Android shell, and does nothing in a browser.
installAndroidShim();

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root is missing from index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
