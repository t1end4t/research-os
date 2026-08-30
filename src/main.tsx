import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {
  GuidanceProvider,
  TooltipPortalRenderer,
  ExplainerPortalRenderer,
} from './guidance';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GuidanceProvider>
      <App />
      <TooltipPortalRenderer />
      <ExplainerPortalRenderer />
    </GuidanceProvider>
  </StrictMode>,
);
