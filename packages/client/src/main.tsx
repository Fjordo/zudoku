import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { I18nProvider } from './i18n';
import { publishDevicePixelRatio } from './lib/devicePixel';
import '@fontsource-variable/bricolage-grotesque/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import './styles/global.css';

publishDevicePixelRatio();

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing');

createRoot(container).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);
