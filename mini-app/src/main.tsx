import { createRoot } from 'react-dom/client';
import vkBridge from '@vkontakte/vk-bridge';
import { AppConfig } from './AppConfig.tsx';

const root = createRoot(document.getElementById('root')!);

vkBridge.send('VKWebAppInit')
  .catch((error) => console.warn('VK Bridge initialization failed', error))
  .finally(() => root.render(<AppConfig />));

if (import.meta.env.MODE === 'development') {
  import('./eruda.ts');
}
