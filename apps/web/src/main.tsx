import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/lexend';
import '@fontsource-variable/source-sans-3';
import { App } from './app/App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root element missing in index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
