import React from 'react';
import { UserRole } from '../types';

interface BottomNavProps {
  activeTab: 'leaderboard' | 'tasks' | 'shop' | 'admin';
  onChangeTab: (tab: 'leaderboard' | 'tasks' | 'shop' | 'admin') => void;
  userRole: UserRole;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, userRole }) => {
  return (
    <div className="bottom-nav-wrapper">
      <nav className="bottom-nav-container" aria-label="Нижнее меню навигации">
        <button
          type="button"
          className={`bottom-nav-button ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => onChangeTab('leaderboard')}
        >
          РЕЙТИНГ
        </button>
        <button
          type="button"
          className={`bottom-nav-button ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => onChangeTab('tasks')}
        >
          ЗАДАНИЯ
        </button>
        <button
          type="button"
          className={`bottom-nav-button ${activeTab === 'shop' ? 'active' : ''}`}
          onClick={() => onChangeTab('shop')}
        >
          МАГАЗИН
        </button>
        {userRole === 'ADMIN' && (
          <button
            type="button"
            className={`bottom-nav-button admin-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => onChangeTab('admin')}
          >
            АДМИН
          </button>
        )}
      </nav>
    </div>
  );
};
