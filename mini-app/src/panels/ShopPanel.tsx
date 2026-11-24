import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Icon28ShoppingCartOutline,
  Icon16CheckCircle,
  Icon16ClockOutline,
  Icon20LightbulbStarOutline,
  Icon24CheckCircleFillGreen,
} from '@vkontakte/icons';
import { ShopItem, User, Order } from '../types';
import { api } from '../api';

interface ShopPanelProps {
  user: User;
  items: ShopItem[];
  myOrders: Order[];
  onItemPurchased: (order: Order) => void;
}

export const ShopPanel: React.FC<ShopPanelProps> = ({ user, items, myOrders, onItemPurchased }) => {
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'ORDERS'>('ITEMS');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handleOpenConfirm = (item: ShopItem) => {
    setErrorMsg(null);
    setSelectedItem(item);
    setIsConfirmOpen(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedItem) return;
    setIsPurchasing(true);
    setErrorMsg(null);
    try {
      const order = await api.purchaseItem(selectedItem.id);
      setIsConfirmOpen(false);
      setCompletedOrder(order);
      onItemPurchased(order);

      // Fire celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e: any) {
      setErrorMsg(e.message || 'Ошибка при покупке');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="screen-container">
      {/* Title */}
      <h1 style={{
        fontSize: '32px',
        fontWeight: 900,
        textTransform: 'uppercase',
        textAlign: 'center',
        letterSpacing: '1px',
        color: '#FFFFFF',
        marginTop: '8px',
        marginBottom: '10px',
      }}>
        МАГАЗИН
      </h1>

      {/* Spendable Balance Banner */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        backdropFilter: 'blur(4px)',
      }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.9 }}>
            Доступно для покупок:
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#FFFFFF' }}>
            {user.spendable_points} БАЛЛОВ
          </div>
        </div>

        {/* View Switcher */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('ITEMS')}
            style={{
              padding: '6px 12px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: activeTab === 'ITEMS' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'ITEMS' ? 'var(--blue-text)' : '#FFFFFF',
              fontWeight: 800,
              fontSize: '11px',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Витрина
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ORDERS')}
            style={{
              padding: '6px 12px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: activeTab === 'ORDERS' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'ORDERS' ? 'var(--blue-text)' : '#FFFFFF',
              fontWeight: 800,
              fontSize: '11px',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Мои заказы ({myOrders.length})
          </button>
        </div>
      </div>

      {activeTab === 'ITEMS' ? (
        /* Items List matching Frame 366 */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {items.map((item) => {
            const isOutOfStock = item.stock <= 0;
            const canAfford = user.spendable_points >= item.price;
            const hasPurchasedLimit = item.max_per_user && (item.already_purchased_count || 0) >= item.max_per_user;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (!isOutOfStock && canAfford && !hasPurchasedLimit) {
                    handleOpenConfirm(item);
                  }
                }}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
                  cursor: isOutOfStock || !canAfford || hasPurchasedLimit ? 'not-allowed' : 'pointer',
                  opacity: isOutOfStock || hasPurchasedLimit ? 0.6 : !canAfford ? 0.8 : 1,
                  transition: 'transform 0.15s ease',
                }}
              >
                {/* Left side: Blue Title & Remaining Stock */}
                <div style={{ paddingRight: '12px', flex: 1 }}>
                  <div style={{
                    fontSize: '17px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    color: 'var(--blue-text)',
                    lineHeight: 1.2,
                    marginBottom: '4px',
                    letterSpacing: '0.2px',
                  }}>
                    {item.title}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isOutOfStock ? '#EF4444' : '#6B7280',
                  }}>
                    {isOutOfStock
                      ? 'Закончился на складе'
                      : hasPurchasedLimit
                      ? 'Куплен максимальный лимит'
                      : `Осталось: ${item.stock} шт.${item.max_per_user ? ' (1 на чел.)' : ''}`}
                  </div>
                  {!canAfford && !isOutOfStock && (
                    <div style={{ fontSize: '11px', color: '#F26B9A', fontWeight: 700, marginTop: '2px' }}>
                      Не хватает {item.price - user.spendable_points} б.
                    </div>
                  )}
                </div>

                {/* Right side: Pink Badge matching Frame 366 */}
                <div style={{
                  backgroundColor: 'var(--pink-accent)',
                  borderRadius: '14px',
                  padding: '8px 16px',
                  minWidth: '92px',
                  textAlign: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(242, 107, 154, 0.3)',
                }}>
                  <div style={{
                    fontSize: '26px',
                    fontWeight: 900,
                    lineHeight: 1,
                    color: '#FFFFFF',
                    fontFamily: 'inherit',
                  }}>
                    {item.price}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#FFFFFF',
                    marginTop: '2px',
                    letterSpacing: '0.5px',
                  }}>
                    БАЛЛОВ
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* My Orders View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {myOrders.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '20px',
            }}>
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                <Icon28ShoppingCartOutline width={44} height={44} style={{ color: 'rgba(255, 255, 255, 0.85)' }} />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800 }}>Вы пока ничего не приобрели</div>
              <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>
                Выполняйте задания, копите баллы и обменивайте их на крутой мерч!
              </div>
            </div>
          ) : (
            myOrders.map((order) => (
              <div
                key={order.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '16px',
                  color: '#1F2937',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      color: 'var(--blue-text)',
                    }}>
                      {order.item?.title || 'Товар'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                      Списано: {order.price_paid} баллов
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: order.status === 'DELIVERED' ? '#DCFCE7' : '#FEF3C7',
                    color: order.status === 'DELIVERED' ? '#16A34A' : '#D97706',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                  }}>
                    {order.status === 'DELIVERED' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Выдано <Icon16CheckCircle fill="#16A34A" />
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Ожидает выдачи <Icon16ClockOutline fill="#D97706" />
                      </span>
                    )}
                  </div>
                </div>

                <div style={{
                  marginTop: '12px',
                  padding: '10px',
                  backgroundColor: '#F3F4F6',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '12px', color: '#4B5563', fontWeight: 600 }}>
                    Код получения у организаторов:
                  </span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 900,
                    color: 'var(--pink-accent)',
                    letterSpacing: '1px',
                  }}>
                    {order.pickup_code}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmOpen && selectedItem && (
        <div className="modal-overlay" onClick={() => setIsConfirmOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: 'var(--blue-text)',
              marginBottom: '12px',
            }}>
              Подтверждение покупки
            </h3>

            <div style={{
              padding: '16px',
              backgroundColor: '#F9FAFB',
              borderRadius: '16px',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
                {selectedItem.title}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4B5563', marginBottom: '4px' }}>
                <span>Стоимость:</span>
                <strong>{selectedItem.price} баллов</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4B5563', marginBottom: '4px' }}>
                <span>Ваш баланс покупок:</span>
                <span>{user.spendable_points} баллов</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#16A34A', fontWeight: 700, paddingTop: '6px', borderTop: '1px solid #E5E7EB' }}>
                <span>Останется:</span>
                <span>{user.spendable_points - selectedItem.price} баллов</span>
              </div>
            </div>

            <div style={{
              fontSize: '11px',
              color: '#6B7280',
              lineHeight: 1.4,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              textAlign: 'center',
            }}>
              <Icon20LightbulbStarOutline width={18} height={18} style={{ color: '#F59E0B', flexShrink: 0 }} />
              <span>Покупка товара списывает доступные баллы, но не снижает вашу позицию в общем рейтинге!</span>
            </div>

            {errorMsg && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '14px',
              }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: '#F3F4F6',
                  color: '#4B5563',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={isPurchasing}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: 'var(--pink-accent)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {isPurchasing ? 'Оформление...' : 'Купить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Modal with Pickup Code */}
      {completedOrder && (
        <div className="modal-overlay" onClick={() => setCompletedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
              <Icon24CheckCircleFillGreen width={52} height={52} />
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: 'var(--blue-text)',
              marginBottom: '6px',
            }}>
              Успешная покупка!
            </h3>
            <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '16px' }}>
              Вы приобрели <strong>{completedOrder.item?.title}</strong>
            </p>

            <div style={{
              backgroundColor: '#EFF6FF',
              border: '2px dashed #93C5FD',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '12px', color: '#1E40AF', fontWeight: 700, marginBottom: '4px' }}>
                ВАШ КОД ПОЛУЧЕНИЯ МЕРЧА:
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: 900,
                color: 'var(--pink-accent)',
                letterSpacing: '2px',
              }}>
                {completedOrder.pickup_code}
              </div>
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px' }}>
                Покажите этот код организаторам лагеря для выдачи
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCompletedOrder(null)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: 'var(--blue-text)',
                color: '#FFFFFF',
                fontWeight: 900,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Отлично!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
