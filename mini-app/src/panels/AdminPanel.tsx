import React, { useState, useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';
import { QRCodeSVG } from 'qrcode.react';
import {
  Icon20SparkleOutline,
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
  const [participants, setParticipants] = useState<User[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [grantPoints, setGrantPoints] = useState<number>(50);
  const [pointsAction, setPointsAction] = useState<'GRANT' | 'DEDUCT'>('GRANT');
  const [grantReason, setGrantReason] = useState<string>('Активность на лекции («Самый умный»)');
  const [grantMessage, setGrantMessage] = useState<string | null>(null);
  const [luckyWinners, setLuckyWinners] = useState<string[]>([]);

  // QR state
  const [qrList, setQrList] = useState<QRCodeItem[]>([]);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [pickupCodes, setPickupCodes] = useState<Record<number, string>>({});
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);

  // Tasks CRUD state
  const [tasksList, setTasksList] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [taskSaveError, setTaskSaveError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab, subFilter]);

  useEffect(() => {
    if (activeTab !== 'ORDERS') return;

    const intervalId = window.setInterval(() => {
      api.getAdminOrders().then(setOrders).catch((error) => {
        console.error('Error refreshing admin orders', error);
      });
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'MODERATION') {
        const subs = await api.getAdminSubmissions(subFilter === 'PENDING' ? 'PENDING' : undefined);
        setSubmissions(subs);
      } else if (activeTab === 'MANUAL') {
        setParticipantsError(null);
        const users = await api.getAdminUsers();
        setParticipants(users);
        setSelectedUserId((selectedId) => users.some((user) => user.id === selectedId)
          ? selectedId
          : users.find((user) => user.id === currentUser.id)?.id ?? users[0]?.id ?? null);
      } else if (activeTab === 'QR') {
        const qrs = await api.getAdminQRCodes();
        setQrList(qrs);
      } else if (activeTab === 'ORDERS') {
        const ords = await api.getAdminOrders();
        setOrders(ords);
        const items = await api.getShopItems();
        setShopItems(items);
      } else if (activeTab === 'TASKS') {
        const tasks = await api.getAdminTasks();
        setTasksList(tasks);
      }
    } catch (e) {
      console.error('Error loading admin data', e);
      if (activeTab === 'MANUAL') {
        setParticipantsError(e instanceof Error ? e.message : 'Не удалось загрузить список участников');
      }
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
    if (selectedUserId === null) {
      setGrantMessage('Ошибка: выберите участника');
      return;
    }

    try {
      const result = pointsAction === 'GRANT'
        ? await api.grantPoints(selectedUserId, grantPoints, grantReason)
        : await api.deductPoints(selectedUserId, grantPoints, grantReason);
      setGrantMessage(result.message);
      onPointsChanged();
      try {
        setParticipants(await api.getAdminUsers());
      } catch (refreshError) {
        console.warn('Could not refresh participant balances', refreshError);
      }
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
      await api.generateQRCodes(1);
      setQrList(await api.getAdminQRCodes());
    } catch (e: any) {
      alert(e.message || 'Ошибка создания QR');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleDownloadQR = async (qr: QRCodeItem) => {
    const svg = document.getElementById(`qr-code-${qr.id}`);
    if (!(svg instanceof SVGSVGElement)) return;

    const downloadableSvg = svg.cloneNode(true) as SVGSVGElement;
    downloadableSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const svgMarkup = new XMLSerializer().serializeToString(downloadableSvg);
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    if (bridge.supports('VKWebAppDownloadFile')) {
      try {
        await bridge.send('VKWebAppDownloadFile', { url, filename: `${qr.code_hash}.svg` });
        window.setTimeout(() => URL.revokeObjectURL(url), 30000);
        return;
      } catch (e) {
        console.warn('VK Bridge QR download failed, using browser download', e);
      }
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = `${qr.code_hash}.svg`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const handleDeleteQR = async (qr: QRCodeItem) => {
    if (!window.confirm(`Удалить QR-код ${qr.code_hash}?`)) return;

    try {
      await api.deleteQRCode(qr.id);
      setQrList((current) => current.filter((item) => item.id !== qr.id));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Не удалось удалить QR-код');
    }
  };

  // Deliver order
  const handleDeliver = async (order: Order) => {
    const pickupCode = pickupCodes[order.id]?.trim();
    if (!pickupCode) {
      alert('Введите код, который назвал участник');
      return;
    }

    try {
      await api.deliverOrder(order.id, pickupCode);
      setPickupCodes((current) => ({ ...current, [order.id]: '' }));
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Не удалось подтвердить выдачу');
    }
  };

  const handleRejectOrder = async (order: Order) => {
    if (!window.confirm(`Отклонить заказ ${order.item?.title ?? ''}? Баллы будут возвращены участнику.`)) return;

    try {
      await api.rejectOrder(order.id);
      await loadData();
      onPointsChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Не удалось отклонить заказ');
    }
  };

  // Stock edit
  const handleStockChange = async (item: ShopItem, delta: number) => {
    const newStock = Math.max(0, item.stock + delta);
    try {
      await api.updateShopStock(item.id, newStock);
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Не удалось изменить остаток товара');
    }
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
                  {sub.proof_image_urls.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                      {sub.proof_image_urls.map((imageUrl, imageIndex) => (
                        <button
                          key={imageUrl}
                          type="button"
                          onClick={() => setPreviewImage(imageUrl)}
                          aria-label={`Открыть подтверждение ${imageIndex + 1}`}
                          style={{ height: '96px', padding: 0, border: 0, borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', backgroundColor: '#F3F4F6', position: 'relative' }}
                        >
                          <img src={imageUrl} alt={`Подтверждение ${imageIndex + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <span style={{ position: 'absolute', bottom: '4px', right: '4px', backgroundColor: 'rgba(0,0,0,0.65)', color: '#FFFFFF', fontSize: '10px', padding: '2px 5px', borderRadius: '4px' }}>
                            {imageIndex + 1} / {sub.proof_image_urls.length}
                          </span>
                        </button>
                      ))}
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
                Управление баллами участника
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '14px' }}>
              Используется для заданий лекторов («Самый умный»), зарядки («GYM-бро»), вечерних мероприятий («Живые легенды»).
            </p>

            <div role="group" aria-label="Действие с баллами" style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {[
                { id: 'GRANT', label: 'Начислить' },
                { id: 'DEDUCT', label: 'Снять' },
              ].map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => setPointsAction(action.id as 'GRANT' | 'DEDUCT')}
                  aria-pressed={pointsAction === action.id}
                  style={{
                    flex: 1,
                    padding: '9px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: pointsAction === action.id ? (action.id === 'DEDUCT' ? '#DC2626' : 'var(--blue-text)') : '#F3F4F6',
                    color: pointsAction === action.id ? '#FFFFFF' : '#374151',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label htmlFor="participant-search" style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Найти участника по имени или VK ID:
              </label>
              <input
                id="participant-search"
                type="search"
                value={participantSearch}
                onChange={(e) => {
                  setParticipantSearch(e.target.value);
                  setSelectedUserId(null);
                }}
                placeholder="Имя или VK ID"
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '13px', marginBottom: '8px' }}
              />
              <select
                value={selectedUserId ?? ''}
                onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '13px' }}
              >
                <option value="">Выберите зарегистрированного участника</option>
                {participants
                  .filter((participant) => `${participant.first_name} ${participant.last_name} ${participant.vk_id}`.toLowerCase().includes(participantSearch.trim().toLowerCase()))
                  .map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {`${participant.last_name} ${participant.first_name}`.trim() || 'Без имени'} · VK ID ${participant.vk_id} · ${participant.rating_points} б.
                    </option>
                  ))}
              </select>
              {participantsError && (
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#DC2626' }}>
                  {participantsError}
                </div>
              )}
              {!participantsError && participants.length === 0 && (
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#6B7280' }}>
                  Пока нет зарегистрированных участников.
                </div>
              )}
            </div>

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
                    disabled={pointsAction === 'DEDUCT' && pts > (participants.find((participant) => participant.id === selectedUserId)?.rating_points ?? 0)}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: grantPoints === pts ? (pointsAction === 'DEDUCT' ? '#DC2626' : 'var(--pink-accent)') : '#F3F4F6',
                      color: grantPoints === pts ? '#FFFFFF' : '#374151',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: pointsAction === 'DEDUCT' && pts > (participants.find((participant) => participant.id === selectedUserId)?.rating_points ?? 0) ? 'not-allowed' : 'pointer',
                      opacity: pointsAction === 'DEDUCT' && pts > (participants.find((participant) => participant.id === selectedUserId)?.rating_points ?? 0) ? 0.45 : 1,
                    }}
                  >
                    {pointsAction === 'DEDUCT' ? `-${pts}` : `+${pts}`}
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
              disabled={selectedUserId === null || (pointsAction === 'DEDUCT' && grantPoints > (participants.find((participant) => participant.id === selectedUserId)?.rating_points ?? 0))}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: pointsAction === 'DEDUCT' ? '#DC2626' : 'var(--blue-text)',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '13px',
                textTransform: 'uppercase',
                cursor: selectedUserId === null || (pointsAction === 'DEDUCT' && grantPoints > (participants.find((participant) => participant.id === selectedUserId)?.rating_points ?? 0)) ? 'not-allowed' : 'pointer',
                opacity: selectedUserId === null || (pointsAction === 'DEDUCT' && grantPoints > (participants.find((participant) => participant.id === selectedUserId)?.rating_points ?? 0)) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>{pointsAction === 'DEDUCT' ? 'СНЯТЬ БАЛЛЫ' : 'НАЧИСЛИТЬ БАЛЛЫ'}</span>
              <Icon20SendOutline width={18} height={18} />
            </button>

            {grantMessage && (
              <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: 700, color: grantMessage.startsWith('Ошибка:') ? '#DC2626' : '#059669', textAlign: 'center' }}>
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
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ minWidth: 0, flex: '1 1 140px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--blue-text)', overflowWrap: 'anywhere' }}>
                    {qr.code_hash}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>
                    Награда: {qr.points} баллов
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadQR(qr)}
                    style={{
                      marginTop: '8px',
                      padding: '7px 10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--blue-text)',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Скачать QR
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteQR(qr)}
                    style={{
                      marginTop: '8px',
                      marginLeft: '6px',
                      padding: '7px 10px',
                      border: '1px solid #FECACA',
                      borderRadius: '8px',
                      backgroundColor: '#FEF2F2',
                      color: '#B91C1C',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Удалить
                  </button>
                </div>
                <div style={{ flexShrink: 0, backgroundColor: '#FFFFFF', padding: '4px' }}>
                  <QRCodeSVG id={`qr-code-${qr.id}`} value={qr.code_hash} size={88} level="M" marginSize={4} title={`QR-код ${qr.code_hash}`} />
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
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800 }}>{o.item?.title || 'Товар'}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px' }}>
                        Участник: {`${o.user?.first_name ?? ''} ${o.user?.last_name ?? ''}`.trim() || `ID ${o.user_id}`}
                        {o.user?.vk_id ? ` · VK ID ${o.user.vk_id}` : ''}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                      {o.price_paid} б.
                    </span>
                  </div>
                  {o.status === 'PENDING_PICKUP' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                      <input
                        type="text"
                        value={pickupCodes[o.id] ?? ''}
                        onChange={(event) => setPickupCodes((current) => ({ ...current, [o.id]: event.target.value.toUpperCase() }))}
                        placeholder="Введите код, названный участником"
                        aria-label={`Код выдачи заказа ${o.id}`}
                        autoCapitalize="characters"
                        style={{ width: '100%', padding: '9px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px' }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleDeliver(o)}
                          disabled={!pickupCodes[o.id]?.trim()}
                          style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', backgroundColor: '#16A34A', color: '#FFFFFF', fontSize: '11px', fontWeight: 800, cursor: pickupCodes[o.id]?.trim() ? 'pointer' : 'not-allowed', opacity: pickupCodes[o.id]?.trim() ? 1 : 0.6 }}
                        >
                          Подтвердить выдачу
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectOrder(o)}
                          style={{ padding: '8px 12px', border: '1px solid #FECACA', borderRadius: '8px', backgroundColor: '#FEF2F2', color: '#B91C1C', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                        >
                          Отклонить
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', fontWeight: 800, color: o.status === 'DELIVERED' ? '#16A34A' : '#B91C1C', marginTop: '8px' }}>
                      {o.status === 'DELIVERED' ? 'Выдача подтверждена' : 'Заказ отклонён, баллы возвращены'}
                    </div>
                  )}
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
                onClick={() => {
                  setTaskSaveError(null);
                  setEditingTask(t);
                }}
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
              disabled={isSavingTask}
              onClick={async () => {
                setIsSavingTask(true);
                setTaskSaveError(null);
                try {
                  await api.updateTask(editingTask);
                  setEditingTask(null);
                  await loadData();
                } catch (e) {
                  setTaskSaveError(e instanceof Error ? e.message : 'Не удалось сохранить задание');
                } finally {
                  setIsSavingTask(false);
                }
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: isSavingTask ? '#9CA3AF' : 'var(--pink-accent)',
                color: '#FFFFFF',
                fontWeight: 900,
                cursor: isSavingTask ? 'wait' : 'pointer',
              }}
            >
              {isSavingTask ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            {taskSaveError && (
              <div role="alert" style={{ marginTop: '10px', color: '#DC2626', fontSize: '12px', fontWeight: 700 }}>
                {taskSaveError}
              </div>
            )}
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
