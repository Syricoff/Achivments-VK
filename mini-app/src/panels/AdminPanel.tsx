import React, { useState, useEffect } from 'react';
import {
  Icon20SparkleOutline,
  Icon16ViewOutline,
  Icon20CheckCircleOn,
  Icon20Cancel,
  Icon24Dice5Outline,
  Icon24Flash,
  Icon20SendOutline,
  Icon16Cancel,
  Icon16Done,
} from '@vkontakte/icons';
import { Submission, QRCodeItem, Order, ShopItem, Task, User } from '../types';
import { api } from '../api';

interface AdminPanelProps {
  currentUser: User;
  onPointsChanged: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onPointsChanged }) => {
  const [activeTab, setActiveTab] = useState<'MODERATION' | 'MANUAL' | 'QR' | 'ORDERS' | 'TASKS'>('MODERATION');

  // Moderation state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subFilter, setSubFilter] = useState<'PENDING' | 'ALL'>('PENDING');
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Manual Grant state
  const [grantTarget, setGrantTarget] = useState<'USER' | 'TEAM'>('USER');
  const [selectedUserId, setSelectedUserId] = useState<number>(currentUser.id);
  const [selectedTeam, setSelectedTeam] = useState<string>('Отряд 1');
  const [grantPoints, setGrantPoints] = useState<number>(50);
  const [grantReason, setGrantReason] = useState<string>('Активность на лекции («Самый умный»)');
  const [grantMessage, setGrantMessage] = useState<string | null>(null);
  const [luckyWinners, setLuckyWinners] = useState<string[]>([]);

  // QR state
  const [qrList, setQrList] = useState<QRCodeItem[]>([]);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);

  // Tasks CRUD state
  const [tasksList, setTasksList] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab, subFilter]);

  const loadData = async () => {
    try {
      if (activeTab === 'MODERATION') {
        const subs = await api.getAdminSubmissions(subFilter === 'PENDING' ? 'PENDING' : undefined);
        setSubmissions(subs);
      } else if (activeTab === 'QR') {
        const qrs = await api.getAdminQRCodes();
        setQrList(qrs);
      } else if (activeTab === 'ORDERS') {
        const ords = await api.getAdminOrders();
        setOrders(ords);
        const items = await api.getShopItems();
        setShopItems(items);
      } else if (activeTab === 'TASKS') {
        const tasks = await api.getTasks();
        setTasksList(tasks);
      }
    } catch (e) {
      console.error('Error loading admin data', e);
    }
  };

  // Moderation actions
  const handleApprove = async (sub: Submission) => {
    await api.reviewSubmission(sub.id, 'APPROVED', 'Одобрено организатором');
    onPointsChanged();
    loadData();
  };

  const handleOpenReject = (sub: Submission) => {
    setSelectedSub(sub);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedSub) return;
    await api.reviewSubmission(selectedSub.id, 'REJECTED', rejectReason || 'Не соответствует условиям задания');
    setIsRejectModalOpen(false);
    onPointsChanged();
    loadData();
  };

  // Manual points grant
  const handleGrant = async () => {
    setGrantMessage(null);
    try {
      await api.grantPoints(selectedUserId, grantPoints, grantReason);
      setGrantMessage(`Успешно начислено +${grantPoints} баллов!`);
      onPointsChanged();
    } catch (e: any) {
      setGrantMessage(`Ошибка: ${e.message}`);
    }
  };

  // Lucky 5 of the day
  const handlePickLucky = async () => {
    try {
      const winners = await api.pickLuckyRandom();
      setLuckyWinners(winners);
      onPointsChanged();
    } catch (e: any) {
      alert(e.message || 'Ошибка выбора счастливчиков');
    }
  };

  // QR Code Generation
  const handleGenerateQR = async () => {
    setIsGeneratingQR(true);
    try {
      const created = await api.generateQRCodes(1);
      setQrList(created);
    } catch (e: any) {
      alert(e.message || 'Ошибка создания QR');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Deliver order
  const handleDeliver = async (orderId: number) => {
    await api.deliverOrder(orderId);
    loadData();
  };

  // Stock edit
  const handleStockChange = async (item: ShopItem, delta: number) => {
    const newStock = Math.max(0, item.stock + delta);
    await api.updateShopStock(item.id, newStock);
    loadData();
  };

  return (
    <div className="screen-container">
      {/* Title */}
      <h1 style={{
        fontSize: '28px',
        fontWeight: 900,
        textTransform: 'uppercase',
        textAlign: 'center',
        letterSpacing: '1px',
        color: '#FFFFFF',
        marginTop: '8px',
        marginBottom: '14px',
      }}>
        ПАНЕЛЬ АДМИНА
      </h1>

      {/* Tabs navigation */}
      <div className="chips-scroll-container">
        {[
          { id: 'MODERATION', label: 'Модерация' },
          { id: 'MANUAL', label: 'Начисление' },
          { id: 'QR', label: 'QR-коды' },
          { id: 'ORDERS', label: 'Магазин' },
          { id: 'TASKS', label: 'Задания' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className="chip-item"
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              backgroundColor: activeTab === tab.id ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)',
              color: activeTab === tab.id ? 'var(--blue-text)' : '#FFFFFF',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Moderation Queue */}
      {activeTab === 'MODERATION' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <button
              onClick={() => setSubFilter('PENDING')}
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: subFilter === 'PENDING' ? 'var(--pink-accent)' : 'rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Ожидают проверки ({submissions.filter((s) => s.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setSubFilter('ALL')}
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: subFilter === 'ALL' ? 'var(--pink-accent)' : 'rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Все заявки
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {submissions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '30px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}>
                <span>Заявок на проверку пока нет</span>
                <Icon20SparkleOutline width={18} height={18} />
              </div>
            ) : (
              submissions.map((sub) => (
                <div
                  key={sub.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '16px',
                    color: '#1F2937',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#E5E7EB',
                        overflow: 'hidden',
                      }}>
                        {sub.user?.avatar_url && (
                          <img src={sub.user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800 }}>
                          {sub.user?.first_name} {sub.user?.last_name}
                        </div>
                        {sub.user?.vk_id && (
                          <a
                            href={`https://vk.com/id${sub.user.vk_id}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '11px', color: 'var(--blue-text)', textDecoration: 'none' }}
                          >
                            Профиль ВК ↗
                          </a>
                        )}
                      </div>
                    </div>
                    <span style={{
                      backgroundColor: sub.status === 'APPROVED' ? '#DCFCE7' : sub.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7',
                      color: sub.status === 'APPROVED' ? '#16A34A' : sub.status === 'REJECTED' ? '#DC2626' : '#D97706',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '10px',
                      fontWeight: 800,
                    }}>
                      {sub.status === 'APPROVED' ? 'Одобрено' : sub.status === 'REJECTED' ? 'Отклонено' : 'На проверке'}
                    </span>
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--blue-text)', marginBottom: '4px' }}>
                    {sub.task?.title} (+{sub.task?.points} б.)
                  </div>

                  {sub.comment && (
                    <div style={{ fontSize: '12px', color: '#4B5563', backgroundColor: '#F9FAFB', padding: '6px 10px', borderRadius: '8px', marginBottom: '8px' }}>
                      «{sub.comment}»
                    </div>
                  )}

                  {/* Screenshot thumbnail */}
                  {sub.proof_image_url && (
                    <div
                      onClick={() => setPreviewImage(sub.proof_image_url)}
                      style={{
                        width: '100%',
                        height: '120px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        marginBottom: '10px',
                        backgroundColor: '#F3F4F6',
                        position: 'relative',
                      }}
                    >
                      <img src={sub.proof_image_url} alt="Подтверждение" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        right: '4px',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: '#FFFFFF',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <span>Нажмите для просмотра</span>
                        <Icon16ViewOutline width={14} height={14} />
                      </div>
                    </div>
                  )}

                  {/* Moderation Buttons */}
                  {sub.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleApprove(sub)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '12px',
                          border: 'none',
                          backgroundColor: '#10B981',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <Icon20CheckCircleOn width={18} height={18} />
                        <span>Одобрить (+{sub.task?.points})</span>
                      </button>
                      <button
                        onClick={() => handleOpenReject(sub)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '12px',
                          border: 'none',
                          backgroundColor: '#EF4444',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <Icon20Cancel width={18} height={18} />
                        <span>Отклонить</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Manual Points & Lucky 5 */}
      {activeTab === 'MANUAL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Lucky 5 of the day widget */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '16px',
            color: '#1F2937',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Icon24Dice5Outline width={20} height={20} style={{ color: 'var(--blue-text)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--blue-text)' }}>
                Задание «Счастливчик дня»
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>
              Случайным образом выберите 5 участников и автоматически начислите каждому по 50 баллов!
            </p>
            <button
              onClick={handlePickLucky}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: 'var(--pink-accent)',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '13px',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              ВЫБРАТЬ 5 СЧАСТЛИВЧИКОВ (+50 Б.)
            </button>

            {luckyWinners.length > 0 && (
              <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#ECFDF5', borderRadius: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#047857', marginBottom: '4px' }}>
                  Выбранные победители:
                </div>
                {luckyWinners.map((w, idx) => (
                  <div key={idx} style={{ fontSize: '12px', color: '#065F46' }}>
                    {idx + 1}. {w} (+50 баллов)
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Direct Manual Points Grant */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '16px',
            color: '#1F2937',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Icon24Flash width={20} height={20} style={{ color: '#F59E0B' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--blue-text)' }}>
                Прямое начисление баллов
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '14px' }}>
              Используется для заданий лекторов («Самый умный»), зарядки («GYM-бро»), вечерних мероприятий («Живые легенды»).
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => setGrantTarget('USER')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: grantTarget === 'USER' ? 'var(--blue-text)' : '#F3F4F6',
                  color: grantTarget === 'USER' ? '#FFFFFF' : '#4B5563',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Одному участнику
              </button>
              <button
                type="button"
                onClick={() => setGrantTarget('TEAM')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: grantTarget === 'TEAM' ? 'var(--blue-text)' : '#F3F4F6',
                  color: grantTarget === 'TEAM' ? '#FFFFFF' : '#4B5563',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Всему отряду
              </button>
            </div>

            {grantTarget === 'USER' ? (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Участник:
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #D1D5DB',
                    fontSize: '13px',
                  }}
                >
                  <option value={1}>Алексей Иванов (Отряд 1)</option>
                  <option value={2}>Екатерина Смирнова (Отряд 2)</option>
                  <option value={3}>Дмитрий Соколов (Отряд 1)</option>
                  <option value={4}>Анна Кузнецова (Отряд 3)</option>
                </select>
              </div>
            ) : (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Отряд / Команда:
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #D1D5DB',
                    fontSize: '13px',
                  }}
                >
                  <option value="Отряд 1">Отряд 1</option>
                  <option value="Отряд 2">Отряд 2</option>
                  <option value="Отряд 3">Отряд 3</option>
                  <option value="Отряд 4">Отряд 4</option>
                </select>
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Баллы:
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[10, 20, 30, 50, 80].map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => setGrantPoints(pts)}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: grantPoints === pts ? 'var(--pink-accent)' : '#F3F4F6',
                      color: grantPoints === pts ? '#FFFFFF' : '#374151',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    +{pts}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Основание / Причина:
              </label>
              <input
                type="text"
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid #D1D5DB',
                  fontSize: '13px',
                }}
              />
            </div>

            <button
              onClick={handleGrant}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: 'var(--blue-text)',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '13px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>НАЧИСЛИТЬ БАЛЛЫ</span>
              <Icon20SendOutline width={18} height={18} />
            </button>

            {grantMessage && (
              <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: 700, color: '#059669', textAlign: 'center' }}>
                {grantMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: QR Generator */}
      {activeTab === 'QR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '16px',
            color: '#1F2937',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--blue-text)', marginBottom: '4px' }}>
              Генератор QR-кодов («Сыщик»)
            </h3>
            <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>
              Создавайте одноразовые QR-коды на 10 баллов. Каждый код может быть активирован ровно 1 раз.
            </p>
            <button
              onClick={handleGenerateQR}
              disabled={isGeneratingQR}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: 'var(--pink-accent)',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '13px',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {isGeneratingQR ? 'Генерация...' : '+ Сгенерировать новый QR-код (10 б.)'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {qrList.map((qr) => (
              <div
                key={qr.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '14px',
                  color: '#1F2937',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--blue-text)' }}>
                    {qr.code_hash}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>
                    Награда: {qr.points} баллов
                  </div>
                </div>
                <span style={{
                  backgroundColor: qr.is_used ? '#E5E7EB' : '#DCFCE7',
                  color: qr.is_used ? '#6B7280' : '#16A34A',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  {qr.is_used ? (
                    <>
                      <span>Использован</span>
                      <Icon16Cancel width={12} height={12} />
                    </>
                  ) : (
                    <>
                      <span>Активен</span>
                      <Icon16Done width={12} height={12} />
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Orders & Shop Management */}
      {activeTab === 'ORDERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Inventory stock edit */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '16px',
            color: '#1F2937',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--blue-text)', marginBottom: '12px' }}>
              Остатки на складе мерча
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {shopItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{item.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => handleStockChange(item, -1)}
                      style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', cursor: 'pointer', fontWeight: 800 }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>
                      {item.stock}
                    </span>
                    <button
                      onClick={() => handleStockChange(item, 1)}
                      style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', cursor: 'pointer', fontWeight: 800 }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Orders list */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '16px',
            color: '#1F2937',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--blue-text)', marginBottom: '12px' }}>
              Выдача заказов участникам
            </h3>
            {orders.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '12px' }}>
                Заказов пока не поступало
              </div>
            ) : (
              orders.map((o) => (
                <div
                  key={o.id}
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    backgroundColor: '#F9FAFB',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800 }}>{o.item?.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--pink-accent)', fontWeight: 800 }}>
                      Код: {o.pickup_code}
                    </div>
                  </div>
                  <div>
                    {o.status === 'DELIVERED' ? (
                      <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <span>Выдано</span>
                        <Icon16Done width={12} height={12} />
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDeliver(o.id)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: 'var(--pink-accent)',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        Выдать заказ
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Tasks CRUD */}
      {activeTab === 'TASKS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tasksList.map((t) => (
            <div
              key={t.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                padding: '14px',
                color: '#1F2937',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1, paddingRight: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--blue-text)' }}>
                  {t.order_num}. {t.title}
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>
                  {t.frequency === 'DAILY' ? 'Ежедневно' : 'Единоразово'} • {t.points} баллов
                </div>
              </div>
              <button
                onClick={() => setEditingTask(t)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Изменить
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {isRejectModalOpen && selectedSub && (
        <div className="modal-overlay" onClick={() => setIsRejectModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#EF4444', marginBottom: '8px' }}>
              Отклонение заявки
            </h3>
            <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '12px' }}>
              Укажите причину, чтобы участник мог исправить ошибку и отправить скриншот повторно:
            </p>
            <textarea
              rows={3}
              placeholder="Например: На скриншоте не видно подписки на группу..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid #D1D5DB',
                fontSize: '13px',
                fontFamily: 'inherit',
                marginBottom: '14px',
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#F3F4F6', fontWeight: 800 }}
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmReject}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#EF4444', color: '#FFFFFF', fontWeight: 800 }}
              >
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Edit Modal */}
      {editingTask && (
        <div className="modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--blue-text)', marginBottom: '12px' }}>
              Редактирование задания
            </h3>
            <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Название:</label>
            <input
              type="text"
              value={editingTask.title}
              onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #D1D5DB', marginBottom: '10px' }}
            />
            <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Баллы:</label>
            <input
              type="number"
              value={editingTask.points}
              onChange={(e) => setEditingTask({ ...editingTask, points: Number(e.target.value) })}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #D1D5DB', marginBottom: '10px' }}
            />
            <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Описание:</label>
            <textarea
              rows={3}
              value={editingTask.description}
              onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #D1D5DB', marginBottom: '14px' }}
            />
            <button
              onClick={async () => {
                await api.updateTask(editingTask);
                setEditingTask(null);
                loadData();
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: 'var(--pink-accent)',
                color: '#FFFFFF',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              Сохранить изменения
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Preview Modal */}
      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <div style={{ maxWidth: '90vw', maxHeight: '90vh', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <img src={previewImage} alt="Скриншот" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '16px' }} />
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '10px',
                backgroundColor: '#FFFFFF',
                color: '#111827',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Закрыть просмотр
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
