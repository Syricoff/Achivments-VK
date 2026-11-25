import { useState, useEffect } from 'react';
import bridge, { UserInfo } from '@vkontakte/vk-bridge';
import { useRouteNavigator, useActiveVkuiLocation } from '@vkontakte/vk-mini-apps-router';
import { View, Panel, SplitLayout, SplitCol, ScreenSpinner } from '@vkontakte/vkui';

import { Leaderboard, TasksPanel, ShopPanel, AdminPanel } from './panels';
import { BottomNav } from './components/BottomNav';
import { DEFAULT_VIEW_PANELS } from './routes';
import { api } from './api';
import { User, Task, ShopItem, Order, LeaderboardUser } from './types';
import './index.css';

export const App = () => {
  const { panel: locationPanel } = useActiveVkuiLocation();
  const routeNavigator = useRouteNavigator();

  const [activeTab, setActiveTab] = useState<'leaderboard' | 'tasks' | 'shop' | 'admin'>('leaderboard');
  const [isLoading, setIsLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState<User>({
    id: 0,
    vk_id: 0,
    first_name: '',
    last_name: '',
    role: 'USER',
    rating_points: 0,
    spendable_points: 0,
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);

  const refreshUserData = async () => {
    try {
      const user = await api.getMe();
      setCurrentUser(user);
      const [t, s, l, o] = await Promise.all([
        api.getTasks(),
        api.getShopItems(),
        api.getLeaderboard(),
        api.getMyOrders(),
      ]);
      setTasks(t);
      setShopItems(s);
      setLeaderboard(l);
      setMyOrders(o);
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  // Keep activeTab in sync with browser location if user navigates via browser back/forward or direct URL
  useEffect(() => {
    if (locationPanel && ['leaderboard', 'tasks', 'shop', 'admin'].includes(locationPanel)) {
      setActiveTab(locationPanel as any);
      refreshUserData();
    }
  }, [locationPanel]);

  const handleTabChange = (tab: 'leaderboard' | 'tasks' | 'shop' | 'admin') => {
    setActiveTab(tab);
    refreshUserData();
    try {
      if (tab === 'leaderboard') routeNavigator.push('/');
      else routeNavigator.push(`/${tab}`);
    } catch {
      // Fallback if router not initialized
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    async function initApp() {
      try {
        // Try to fetch real VK user info if inside VK environment (with timeout fallback for standalone browser)
        try {
          const fetchVkUser = bridge.send('VKWebAppGetUserInfo');
          const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('VKBridge timeout')), 5000));
          const vkUser: UserInfo = await Promise.race([fetchVkUser, timeout]);
          if (vkUser && vkUser.id) {
            await api.updateMe({
              vk_id: vkUser.id,
              first_name: vkUser.first_name,
              last_name: vkUser.last_name,
              avatar_url: vkUser.photo_200 || vkUser.photo_100,
            });
          }
        } catch (error) {
          console.warn('Could not fetch VK profile with VK Bridge', error);
          // Running in browser outside VK, gracefully fall back to mock
        }

        const user = await api.getMe();
        setCurrentUser(user);

        const [t, s, l, o] = await Promise.all([
          api.getTasks(),
          api.getShopItems(),
          api.getLeaderboard(),
          api.getMyOrders(),
        ]);

        setTasks(t);
        setShopItems(s);
        setLeaderboard(l);
        setMyOrders(o);
      } catch (e) {
        console.error('Failed to init app state', e);
      } finally {
        setIsLoading(false);
      }
    }

    initApp();
  }, []);


  return (
    <SplitLayout>
      <SplitCol>
        {isLoading ? (
          <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-gradient)',
          }}>
            <ScreenSpinner />
          </div>
        ) : (
          <>
            <View activePanel={activeTab}>
              <Panel id={DEFAULT_VIEW_PANELS.LEADERBOARD}>
                <Leaderboard
                  user={currentUser}
                  leaderboard={leaderboard}
                  onRefresh={refreshUserData}
                />
              </Panel>

              <Panel id={DEFAULT_VIEW_PANELS.TASKS}>
                <TasksPanel
                  tasks={tasks}
                  onTaskSubmitted={async () => {
                    await refreshUserData();
                  }}
                  onPointsAwarded={async () => {
                    await refreshUserData();
                  }}
                />
              </Panel>

              <Panel id={DEFAULT_VIEW_PANELS.SHOP}>
                <ShopPanel
                  user={currentUser}
                  items={shopItems}
                  myOrders={myOrders}
                  onItemPurchased={async () => {
                    await refreshUserData();
                  }}
                />
              </Panel>

              <Panel id={DEFAULT_VIEW_PANELS.ADMIN}>
                <AdminPanel
                  currentUser={currentUser}
                  onPointsChanged={refreshUserData}
                />
              </Panel>
            </View>

            {/* Fixed Bottom Navigation matching mockups */}
            <BottomNav
              activeTab={activeTab}
              onChangeTab={handleTabChange}
              userRole={currentUser.role}
            />
          </>
        )}
      </SplitCol>
    </SplitLayout>
  );
};
