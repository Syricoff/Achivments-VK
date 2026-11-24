import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import bridge from '@vkontakte/vk-bridge';
import {
  Icon20CheckCircleOn,
  Icon20ClockOutline,
  Icon20QrCodeOutline,
  Icon24UploadOutline,
} from '@vkontakte/icons';
import { Task, Submission } from '../types';
import { api } from '../api';

interface TasksPanelProps {
  tasks: Task[];
  onTaskSubmitted: (taskId: number, sub: Submission) => void;
  onPointsAwarded: (points: number) => void;
}

export const TasksPanel: React.FC<TasksPanelProps> = ({ tasks, onTaskSubmitted, onPointsAwarded }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<'ALL' | 'DAILY' | 'ONCE' | 'MY'>('ALL');
  
  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [proofImage, setProofImage] = useState<string>('');
  const [proofComment, setProofComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // QR Modal
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrCodeInput, setQRCodeInput] = useState('');
  const [qrMessage, setQRMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filter === 'DAILY') return t.frequency === 'DAILY';
    if (filter === 'ONCE') return t.frequency === 'ONCE';
    if (filter === 'MY') return t.user_status === 'PENDING' || t.user_status === 'APPROVED' || t.user_status === 'REJECTED';
    return true;
  });

  const currentTask = filteredTasks[currentIndex] || filteredTasks[0] || tasks[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : filteredTasks.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < filteredTasks.length - 1 ? prev + 1 : 0));
  };

  const openSubmitModal = (task: Task) => {
    setSelectedTask(task);
    setProofImage('https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80');
    setProofComment('');
    setIsSubmitModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProof = async () => {
    if (!selectedTask) return;
    setIsUploading(true);
    try {
      const sub = await api.submitTask(selectedTask.id, proofImage, proofComment);
      onTaskSubmitted(selectedTask.id, sub);
      setIsSubmitModalOpen(false);
    } catch (e: any) {
      alert(e.message || 'Ошибка отправки отчета');
    } finally {
      setIsUploading(false);
    }
  };

  // Scan QR handler
  const handleOpenQRScanner = async (task: Task) => {
    setSelectedTask(task);
    setQRMessage(null);
    setQRCodeInput('');

    // Try VK Bridge Code Reader
    try {
      if (bridge.supports('VKWebAppOpenCodeReader')) {
        const result = await bridge.send('VKWebAppOpenCodeReader');
        if (result && result.code_data) {
          submitScannedCode(result.code_data);
          return;
        }
      }
    } catch (err) {
      console.log('VK Bridge Code Reader unavailable or canceled', err);
    }

    // Fallback to manual QR code entry modal
    setIsQRModalOpen(true);
  };

  const submitScannedCode = async (code: string) => {
    setIsScanning(true);
    setQRMessage(null);
    try {
      const res = await api.scanQRCode(code);
      setQRMessage({ text: res.message });
      onPointsAwarded(res.points);
      setTimeout(() => {
        setIsQRModalOpen(false);
      }, 1500);
    } catch (e: any) {
      setQRMessage({ text: e.message || 'Ошибка проверки QR-кода', isError: true });
    } finally {
      setIsScanning(false);
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
        marginBottom: '16px',
      }}>
        ЗАДАНИЯ
      </h1>

      {/* Filter Tabs */}
      <div className="chips-scroll-container">
        {[
          { id: 'ALL', label: 'Все' },
          { id: 'DAILY', label: 'Ежедневные' },
          { id: 'ONCE', label: 'Единоразовые' },
          { id: 'MY', label: 'Мои заявки' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className="chip-item"
            onClick={() => {
              setFilter(tab.id as any);
              setCurrentIndex(0);
            }}
            style={{
              backgroundColor: filter === tab.id ? '#FFFFFF' : 'rgba(255, 255, 255, 0.25)',
              color: filter === tab.id ? '#3F48F5' : '#FFFFFF',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Card Carousel Area */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        minHeight: '380px',
        margin: '8px 0',
      }}>
        {/* Left Arrow Button matching mockup Frame 365 */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Предыдущее задание"
          style={{
            position: 'absolute',
            left: '-6px',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            zIndex: 10,
            cursor: 'pointer',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F26B9A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Right Arrow Button matching mockup Frame 365 */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Следующее задание"
          style={{
            position: 'absolute',
            right: '-6px',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            zIndex: 10,
            cursor: 'pointer',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F26B9A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Pink Card Container */}
        <AnimatePresence mode="wait">
          {currentTask && (
            <motion.div
              key={currentTask.id}
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -20 }}
              transition={{ duration: 0.25 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 50) handlePrev();
                else if (info.offset.x < -50) handleNext();
              }}
              style={{
                width: '100%',
                maxWidth: '320px',
                minHeight: '380px',
                backgroundColor: 'var(--pink-accent)',
                borderRadius: '24px',
                padding: '22px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                textAlign: 'center',
                boxShadow: '0 12px 30px rgba(242, 107, 154, 0.45)',
                color: '#FFFFFF',
                userSelect: 'none',
              }}
            >
              {/* Card Top Title & Frequency */}
              <div>
                <h2 style={{
                  fontSize: '26px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  lineHeight: 1.15,
                  marginBottom: '10px',
                  letterSpacing: '0.5px',
                  wordBreak: 'break-word',
                }}>
                  {currentTask.title.replace(/[«»]/g, '')}
                </h2>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  opacity: 0.9,
                }}>
                  {currentTask.frequency === 'DAILY' ? 'ЕЖЕДНЕВНОЕ' : 'ЕДИНОРАЗОВОЕ'}
                </div>
              </div>

              {/* Card Middle Description */}
              <div style={{
                margin: '20px 0',
                fontSize: '14px',
                fontWeight: 600,
                lineHeight: 1.45,
                color: '#FFFFFF',
              }}>
                {currentTask.description}
              </div>

              {/* Action / Status Block */}
              <div style={{ marginBottom: '16px' }}>
                {currentTask.user_status === 'APPROVED' ? (
                  <div style={{
                    backgroundColor: 'rgba(39, 174, 96, 0.95)',
                    color: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '10px',
                    fontWeight: 800,
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}>
                    <span>ВЫПОЛНЕНО</span>
                    <Icon20CheckCircleOn width={18} height={18} />
                  </div>
                ) : currentTask.user_status === 'PENDING' ? (
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    color: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '10px',
                    fontWeight: 800,
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}>
                    <span>НА ПРОВЕРКЕ</span>
                    <Icon20ClockOutline width={18} height={18} />
                  </div>
                ) : currentTask.user_status === 'REJECTED' ? (
                  <div>
                    <div style={{
                      backgroundColor: 'rgba(235, 87, 87, 0.9)',
                      color: '#FFFFFF',
                      borderRadius: '12px',
                      padding: '8px',
                      fontWeight: 700,
                      fontSize: '12px',
                      marginBottom: '8px',
                    }}>
                      Отклонено: {currentTask.rejection_reason || 'Не принято'}
                    </div>
                    <button
                      onClick={() => openSubmitModal(currentTask)}
                      style={{
                        width: '100%',
                        backgroundColor: '#FFFFFF',
                        color: 'var(--blue-text)',
                        border: 'none',
                        borderRadius: '14px',
                        padding: '10px',
                        fontWeight: 900,
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      ОТПРАВИТЬ СНОВА
                    </button>
                  </div>
                ) : currentTask.task_type === 'QR' ? (
                  <button
                    onClick={() => handleOpenQRScanner(currentTask)}
                    style={{
                      width: '100%',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--blue-text)',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '12px',
                      fontWeight: 900,
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>СКАН ИЛИ ВВОД QR</span>
                    <Icon20QrCodeOutline width={20} height={20} />
                  </button>
                ) : currentTask.task_type === 'MANUAL' ? (
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    borderRadius: '14px',
                    padding: '10px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}>
                    Начисляется организатором лагеря
                  </div>
                ) : (
                  <button
                    onClick={() => openSubmitModal(currentTask)}
                    style={{
                      width: '100%',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--blue-text)',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '12px',
                      fontWeight: 900,
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>ЗАГРУЗИТЬ ПОДТВЕРЖДЕНИЕ</span>
                    <Icon24UploadOutline width={20} height={20} />
                  </button>
                )}
              </div>

              {/* Points at the bottom matching mockup */}
              <div style={{
                fontSize: '32px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#FFFFFF',
              }}>
                {currentTask.points} БАЛЛОВ
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination counter */}
      <div style={{
        textAlign: 'center',
        marginTop: '12px',
        fontSize: '13px',
        fontWeight: 700,
        color: 'rgba(255, 255, 255, 0.8)',
      }}>
        {currentIndex + 1} из {filteredTasks.length}
      </div>

      {/* Submission Modal */}
      {isSubmitModalOpen && selectedTask && (
        <div className="modal-overlay" onClick={() => setIsSubmitModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: 'var(--blue-text)',
              marginBottom: '12px',
            }}>
              {selectedTask.title}
            </h3>
            <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '16px' }}>
              Прикрепите скриншот или фото выполнения для модератора:
            </p>

            {/* Proof Preview */}
            <div style={{
              width: '100%',
              height: '160px',
              borderRadius: '16px',
              backgroundColor: '#F3F4F6',
              overflow: 'hidden',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed #D1D5DB',
            }}>
              {proofImage ? (
                <img src={proofImage} alt="Скриншот" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Нет фото</span>
              )}
            </div>

            <label style={{
              display: 'block',
              textAlign: 'center',
              padding: '10px',
              backgroundColor: '#EEF2FF',
              color: '#3F48F5',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              marginBottom: '14px',
            }}>
              Выбрать фото с устройства
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>

            <textarea
              placeholder="Комментарий или ссылка на пост/историю..."
              value={proofComment}
              onChange={(e) => setProofComment(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '12px',
                border: '1px solid #D1D5DB',
                fontSize: '13px',
                fontFamily: 'inherit',
                marginBottom: '16px',
                resize: 'none',
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
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
                onClick={handleSubmitProof}
                disabled={isUploading}
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
                {isUploading ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Scanner / Input Modal */}
      {isQRModalOpen && (
        <div className="modal-overlay" onClick={() => setIsQRModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: 'var(--blue-text)',
              marginBottom: '8px',
            }}>
              Задание «Сыщик»
            </h3>
            <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '16px' }}>
              Введите код или отсканируйте найденный QR-код организаторов:
            </p>

            <input
              type="text"
              placeholder="Например: LAMPA-QR-CAMP-001"
              value={qrCodeInput}
              onChange={(e) => setQRCodeInput(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '2px solid #E5E7EB',
                fontSize: '14px',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '12px',
                textAlign: 'center',
              }}
            />

            {/* Quick Demo buttons for testing */}
            <div style={{ marginBottom: '16px', fontSize: '12px', color: '#6B7280' }}>
              Тестовые коды для проверки:
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {['LAMPA-QR-CAMP-001', 'LAMPA-QR-CAMP-002'].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setQRCodeInput(code)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#F3F4F6',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            {qrMessage && (
              <div style={{
                padding: '10px',
                borderRadius: '10px',
                marginBottom: '14px',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: qrMessage.isError ? '#FEE2E2' : '#DCFCE7',
                color: qrMessage.isError ? '#DC2626' : '#16A34A',
                textAlign: 'center',
              }}>
                {qrMessage.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsQRModalOpen(false)}
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
                Закрыть
              </button>
              <button
                type="button"
                onClick={() => submitScannedCode(qrCodeInput)}
                disabled={!qrCodeInput.trim() || isScanning}
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
                {isScanning ? 'Проверка...' : 'Активировать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
