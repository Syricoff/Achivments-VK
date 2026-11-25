import React from 'react';
import { Icon16Favorite } from '@vkontakte/icons';
import { User, LeaderboardUser } from '../types';

interface LeaderboardProps {
  user: User;
  leaderboard: LeaderboardUser[];
  onRefresh?: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ user, leaderboard }) => {
  // Extract top 3 participants
  const top1 = leaderboard.find((u) => u.rank === 1) || {
    id: -1,
    vk_id: 0,
    first_name: '',
    last_name: '',
    rating_points: 0,
    rank: 1,
  };

  const top2 = leaderboard.find((u) => u.rank === 2) || {
    id: -2,
    vk_id: 0,
    first_name: '',
    last_name: '',
    rating_points: 0,
    rank: 2,
  };

  const top3 = leaderboard.find((u) => u.rank === 3) || {
    id: -3,
    vk_id: 0,
    first_name: '',
    last_name: '',
    rating_points: 0,
    rank: 3,
  };

  const restUsers = leaderboard.filter((u) => leaderboard.length < 3 || u.rank > 3);

  return (
    <div className="screen-container">
      {/* Top Balance & Clipboard Section */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        paddingTop: '8px',
      }}>
        <div>
          <div style={{
            fontSize: '15px',
            fontWeight: 800,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            color: '#FFFFFF',
            marginBottom: '4px',
          }}>
            ВСЕГО БАЛЛОВ
          </div>
          <div style={{
            fontSize: '48px',
            fontWeight: 900,
            lineHeight: 1,
            color: '#FFFFFF',
            fontFamily: 'inherit',
          }}>
            {user.rating_points}
          </div>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.85)',
            marginTop: '6px',
          }}>
            Доступно для покупок: <strong style={{ color: '#FFFFFF' }}>{user.spendable_points}</strong> б.
          </div>
        </div>

        {/* Official Sticker Illustration from Figma Mockup */}
        <div style={{ position: 'relative' }}>
          <img
            src="/assets/clipboard.png"
            alt="Лампа 2026 Чеклист"
            style={{
              width: '104px',
              height: '104px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.15))',
            }}
          />
        </div>
      </header>

      {/* Podium Section */}
      <section style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '22px',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: '#FFFFFF',
          marginBottom: '20px',
        }}>
          РЕЙТИНГ
        </h2>

        {/* 3 Pedestal Circles */}
        {leaderboard.length >= 3 && <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap: '12px',
          paddingBottom: '8px',
        }}>
          {/* 2nd Place (Left) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '92px',
            textAlign: 'center',
          }}>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <div style={{
                position: 'absolute',
                top: '-4px',
                left: '-4px',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: 'var(--silver-badge)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                zIndex: 2,
              }}>
                2
              </div>
              <div style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: '#D1D5DB',
                overflow: 'hidden',
                border: '3px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}>
                {top2.avatar_url ? (
                  <img src={top2.avatar_url} alt={top2.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#D9D9D9' }} />
                )}
              </div>
            </div>
            <div style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: '#FFFFFF',
              lineHeight: 1.2,
              marginBottom: '2px',
              wordBreak: 'break-word',
            }}>
              {top2.last_name} {top2.first_name}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 900, color: '#FFFFFF' }}>
              {top2.rating_points}
            </div>
          </div>

          {/* 1st Place (Center - Elevated & Bigger) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '106px',
            textAlign: 'center',
            marginBottom: '16px',
          }}>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <div style={{
                position: 'absolute',
                top: '-4px',
                left: '-4px',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: 'var(--gold-badge)',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
                zIndex: 2,
              }}>
                1
              </div>
              <div style={{
                width: '94px',
                height: '94px',
                borderRadius: '50%',
                backgroundColor: '#E5E7EB',
                overflow: 'hidden',
                border: '4px solid #FFFFFF',
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
              }}>
                {top1.avatar_url ? (
                  <img src={top1.avatar_url} alt={top1.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#D9D9D9' }} />
                )}
              </div>
            </div>
            <div style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: '#FFFFFF',
              lineHeight: 1.2,
              marginBottom: '2px',
              wordBreak: 'break-word',
            }}>
              {top1.last_name} {top1.first_name}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#FFFFFF' }}>
              {top1.rating_points}
            </div>
          </div>

          {/* 3rd Place (Right) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '92px',
            textAlign: 'center',
          }}>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <div style={{
                position: 'absolute',
                top: '-4px',
                left: '-4px',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: 'var(--bronze-badge)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                zIndex: 2,
              }}>
                3
              </div>
              <div style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: '#D1D5DB',
                overflow: 'hidden',
                border: '3px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}>
                {top3.avatar_url ? (
                  <img src={top3.avatar_url} alt={top3.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#D9D9D9' }} />
                )}
              </div>
            </div>
            <div style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: '#FFFFFF',
              lineHeight: 1.2,
              marginBottom: '2px',
              wordBreak: 'break-word',
            }}>
              {top3.last_name} {top3.first_name}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 900, color: '#FFFFFF' }}>
              {top3.rating_points}
            </div>
          </div>
        </div>}
      </section>

      {/* Participants List (4th Place and below) */}
      <section style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        paddingTop: '6px',
      }}>
        {leaderboard.length === 0 && (
          <div style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: 700 }}>
            Зарегистрированных участников пока нет
          </div>
        )}
        {restUsers.map((item) => {
          const isCurrentUser = item.vk_id === user.vk_id || item.id === user.id;
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: isCurrentUser ? '8px 12px' : '4px 0',
                backgroundColor: isCurrentUser ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                borderRadius: '12px',
                backdropFilter: isCurrentUser ? 'blur(4px)' : 'none',
              }}
            >
              <div style={{
                fontSize: '15px',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: '#FFFFFF',
                letterSpacing: '0.2px',
              }}>
                {item.rank}. {item.last_name} {item.first_name}
                {isCurrentUser && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginLeft: '6px', color: '#FFD147' }}>
                    <Icon16Favorite width={14} height={14} /> (ВЫ)
                  </span>
                )}
              </div>
              <div style={{
                fontSize: '15px',
                fontWeight: 900,
                color: '#FFFFFF',
              }}>
                {item.rating_points}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
