import vkBridge, { parseURLSearchParamsForGetLaunchParams } from '@vkontakte/vk-bridge';
import { useAdaptivity, useAppearance, useInsets } from '@vkontakte/vk-bridge-react';
import { AdaptivityProvider, ConfigProvider, AppRoot } from '@vkontakte/vkui';
import { RouterProvider } from '@vkontakte/vk-mini-apps-router';
import type { CSSProperties } from 'react';
import '@vkontakte/vkui/dist/vkui.css';

import { transformVKBridgeAdaptivity } from './utils';
import { router } from './routes';
import { App } from './App';

export const AppConfig = () => {
  const vkBridgeAppearance = useAppearance() || undefined;
  const vkBridgeInsets = useInsets() || undefined;
  const adaptivity = transformVKBridgeAdaptivity(useAdaptivity());
  const { vk_platform } = parseURLSearchParamsForGetLaunchParams(window.location.search);
  const safeAreaStyle = {
    '--vk-safe-area-top': `${vkBridgeInsets?.top ?? 0}px`,
    '--vk-safe-area-right': `${vkBridgeInsets?.right ?? 0}px`,
    '--vk-safe-area-bottom': `${vkBridgeInsets?.bottom ?? 0}px`,
    '--vk-safe-area-left': `${vkBridgeInsets?.left ?? 0}px`,
  } as CSSProperties;

  return (
    <ConfigProvider
      colorScheme={vkBridgeAppearance}
      platform={vk_platform === 'desktop_web' ? 'vkcom' : undefined}
      isWebView={vkBridge.isWebView()}
      hasCustomPanelHeaderAfter={true}
    >
      <AdaptivityProvider {...adaptivity}>
        <AppRoot mode="full" safeAreaInsets={vkBridgeInsets}>
          <div className="vk-safe-area-root" style={safeAreaStyle}>
            <RouterProvider router={router}>
              <App />
            </RouterProvider>
          </div>
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  );
};
