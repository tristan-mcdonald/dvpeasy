import App from './App.tsx';
import { createRoot } from 'react-dom/client';
import { injectHeadElements } from './config/head';
import { StrictMode } from 'react';

injectHeadElements();

import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
