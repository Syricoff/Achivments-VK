import { User, Task, ShopItem, Order, QRCodeItem, LeaderboardUser, Submission } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Check if launch params or sign header is in URL
const searchParams = window.location.search;

// Initial Mock Seed Data
const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    order_num: 1,
    title: '«НА СВЯЗИ»',
    description: 'Подпишись на группы Профкома КГУ им. К.Э. Циолковского и Лагеря студенческого актива «Лампа» в ВК, не забудь прислать скриншоты для подтверждения',
    points: 10,
    frequency: 'ONCE',
    task_type: 'SCREENSHOT',
    is_active: true,
    user_status: 'AVAILABLE',
    can_submit: true,
  },
  {
    id: 2,
    order_num: 2,
    title: '«Я В ТРЕНДЕ»',
    description: 'Установи брендированную аватарку в ВК и пришли фото-подтверждение',
    points: 30,
    frequency: 'ONCE',
    task_type: 'SCREENSHOT',
    is_active: true,
    user_status: 'AVAILABLE',
    can_submit: true,
  },
  {
    id: 3,
    order_num: 3,
    title: '«ЗАФИКСИРОВАНО»',
    description: 'Выложи историю в ВК о лагере (1 день = 1 история)',
    points: 20,
    frequency: 'DAILY',
    task_type: 'SCREENSHOT',
    is_active: true,
    user_status: 'AVAILABLE',
    can_submit: true,
  },
  {
    id: 4,
    order_num: 4,
    title: '«СЫЩИК»',
    description: 'Найди QR-код от организаторов на территории лагеря (1 QR-код = 1 человек)',
    points: 10,
    frequency: 'DAILY',
    task_type: 'QR',
    is_active: true,
    user_status: 'AVAILABLE',
    can_submit: true,
  },
  {
    id: 5,
    order_num: 5,
    title: '«СЧАСТЛИВЧИК ДНЯ»',
    description: 'Пиши комментарии и ставь лайки в группах ВК (Профком и Лампа), случайным образом выберем 5 счастливчиков',
    points: 50,
    frequency: 'DAILY',
    task_type: 'MANUAL',
    daily_global_limit: 5,
    is_active: true,
    user_status: 'AVAILABLE',
    can_submit: true,
  },
  {
    id: 6,
    order_num: 6,
    title: '«САМЫЙ УМНЫЙ»',
    description: 'Будь активным на лекции и получи ачивку от лектора',
    points: 50,
    frequency: 'DAILY',
    task_type: 'MANUAL',
    is_active: true,
    user_status: 'AVAILABLE',
    can_submit: true,
  },
  {
    id: 7,
    order_num: 7,
    title: '«МЕМНЫЙ ЧЕЛ»',
    description: 'Сделай мем связанный с лагерем и пришли его в сообщения сообщества',
    points: 30,
    frequency: 'DAILY',
    task_type: 'SCREENSHOT',
    is_active: true,
    user_status: 'AVAILABLE',
    can_submit: true,
  },
  {
    id: 8,
    order_num: 8,
    title: '«GYM-БРО»',
    description: 'Приходи на зарядку первым и получи доп. балл (Получают первые 5 человек)',
    points: 10,
    frequency: 'DAILY',
    task_type: 'MANUAL',
    daily_global_limit: 5,
    is_active: true,
    user_status: 'AVAILABLE',
    can_submit: true,
  },
  {
    id: 9,
    order_num: 9,
    title: '«ЖИВЫЕ ЛЕГЕНДЫ»',
    description: 'Победи на вечернем мероприятии и все члены вашей команды получат баллы',
    points: 30,
    frequency: 'DAILY',
    task_type: 'MANUAL',
    is_active: true,
    user_status: 'AVAILABLE',
    can_submit: true,
  },
  {
    id: 10,
    order_num: 10,
    title: '«РАССКАЖИ ВСЕМ»',
    description: 'Выложи на своей странице пост о лагере с хештегом #Лампа_2026',
    points: 50,
    frequency: 'ONCE',
    task_type: 'SCREENSHOT',
    is_active: true,
    user_status: 'AVAILABLE',
    can_submit: true,
  },
  {
    id: 11,
    order_num: 11,
    title: '«МВП»',
    description: 'Сними вертикальное трендовое видео, связанное с лагерем и пришли в сообщения сообщества (1 день = 1 клип)',
    points: 80,
    frequency: 'DAILY',
    task_type: 'SCREENSHOT',
    is_active: true,
    user_status: 'AVAILABLE',
    can_submit: true,
  },
  {
    id: 12,
    order_num: 12,
    title: '«ФОТО СО ЗВЕЗДОЙ»',
    description: 'Сделай фото с организаторами и пришли в сообщения сообщества',
    points: 20,
    frequency: 'ONCE',
    task_type: 'SCREENSHOT',
    is_active: true,
    user_status: 'AVAILABLE',
    can_submit: true,
  },
];

const INITIAL_SHOP_ITEMS: ShopItem[] = [
  {
    id: 1,
    title: 'СЮРПРИЗ ОТ ОРГАНИЗАТОРОВ',
    price: 700,
    stock: 1,
    max_per_user: null,
    is_active: true,
  },
  {
    id: 2,
    title: 'ШОППЕР',
    price: 600,
    stock: 10,
    max_per_user: null,
    is_active: true,
  },
  {
    id: 3,
    title: 'СТИКЕРЫ',
    price: 500,
    stock: 10,
    max_per_user: null,
    is_active: true,
  },
  {
    id: 4,
    title: 'ЗАПАС ЕДЫ',
    price: 400,
    stock: 30,
    max_per_user: null,
    is_active: true,
  },
  {
    id: 5,
    title: 'VIP-БЕЙДЖ',
    price: 300,
    stock: 50,
    max_per_user: 1,
    is_active: true,
  },
];

const INITIAL_USER: User = {
  id: 1,
  vk_id: 10001,
  first_name: 'Алексей',
  last_name: 'Иванов',
  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  role: 'ADMIN',
  rating_points: 900,
  spendable_points: 900,
  team_name: 'Отряд 1',
};

const INITIAL_LEADERBOARD: LeaderboardUser[] = [
  {
    id: 2,
    vk_id: 10002,
    first_name: 'ЕКАТЕРИНА',
    last_name: 'СМИРНОВА',
    rating_points: 1000,
    rank: 1,
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    team_name: 'Отряд 2',
  },
  {
    id: 1,
    vk_id: 10001,
    first_name: 'АЛЕКСЕЙ',
    last_name: 'ИВАНОВ',
    rating_points: 900,
    rank: 2,
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    team_name: 'Отряд 1',
  },
  {
    id: 3,
    vk_id: 10003,
    first_name: 'ДМИТРИЙ',
    last_name: 'СОКОЛОВ',
    rating_points: 800,
    rank: 3,
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    team_name: 'Отряд 1',
  },
  { id: 4, vk_id: 10004, first_name: 'АННА', last_name: 'КУЗНЕЦОВА', rating_points: 150, rank: 4 },
  { id: 5, vk_id: 10005, first_name: 'МИХАИЛ', last_name: 'ПОПОВ', rating_points: 150, rank: 5 },
  { id: 6, vk_id: 10006, first_name: 'ПОЛИНА', last_name: 'ВАСИЛЬЕВА', rating_points: 150, rank: 6 },
  { id: 7, vk_id: 10007, first_name: 'ИВАН', last_name: 'ПЕТРОВ', rating_points: 150, rank: 7 },
  { id: 8, vk_id: 10008, first_name: 'СОФИЯ', last_name: 'НОВИКОВА', rating_points: 150, rank: 8 },
  { id: 9, vk_id: 10009, first_name: 'АРТЕМ', last_name: 'ФЕДОРОВ', rating_points: 150, rank: 9 },
  { id: 10, vk_id: 10010, first_name: 'МАРИЯ', last_name: 'МОРОЗОВА', rating_points: 150, rank: 10 },
  { id: 11, vk_id: 10011, first_name: 'НИКИТА', last_name: 'ВОЛКОВ', rating_points: 150, rank: 11 },
  { id: 12, vk_id: 10012, first_name: 'ДАРЬЯ', last_name: 'АЛЕКСЕЕВА', rating_points: 150, rank: 12 },
];

// Local storage helpers for mock engine
const STORAGE_KEYS = {
  USER: 'lampa_user_state',
  TASKS: 'lampa_tasks_state',
  SHOP: 'lampa_shop_state',
  ORDERS: 'lampa_orders_state',
  SUBMISSIONS: 'lampa_submissions_state',
  QR: 'lampa_qr_state',
  LEADERBOARD: 'lampa_leaderboard_state',
};

function getStorage<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage error:', e);
  }
}

// Check backend availability
let backendAvailable: boolean | null = null;
async function isBackendAlive(): Promise<boolean> {
  if (backendAvailable !== null) return backendAvailable;
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, { method: 'GET', signal: AbortSignal.timeout(1200) });
    backendAvailable = res.ok;
  } catch {
    backendAvailable = false;
  }
  return backendAvailable;
}

export const api = {
  // Current user
  async getMe(): Promise<User> {
    if (await isBackendAlive()) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${searchParams}` },
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Backend getMe failed, using storage', e);
      }
    }
    return getStorage<User>(STORAGE_KEYS.USER, INITIAL_USER);
  },

  async updateMe(data: Partial<User>): Promise<User> {
    const user = await this.getMe();
    const updated = { ...user, ...data };
    setStorage(STORAGE_KEYS.USER, updated);

    if (await isBackendAlive()) {
      const profile = new URLSearchParams();
      if (data.first_name !== undefined) profile.set('first_name', data.first_name);
      if (data.last_name !== undefined) profile.set('last_name', data.last_name);
      if (data.avatar_url !== undefined && data.avatar_url !== null) profile.set('avatar_url', data.avatar_url);

      try {
        const res = await fetch(`${API_BASE_URL}/api/users/me?${profile.toString()}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${searchParams}` },
        });
        if (res.ok) {
          const savedUser = await res.json();
          setStorage(STORAGE_KEYS.USER, savedUser);
          return savedUser;
        }
        console.warn('Backend profile update failed with status', res.status);
      } catch (e) {
        console.warn('Backend profile update failed, using storage', e);
      }
    }

    return updated;
  },

  // Leaderboard
  async getLeaderboard(): Promise<LeaderboardUser[]> {
    if (await isBackendAlive()) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/leaderboard`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Backend leaderboard failed, fallback to mock', e);
      }
    }
    const current = getStorage<LeaderboardUser[]>(STORAGE_KEYS.LEADERBOARD, INITIAL_LEADERBOARD);
    const user = await this.getMe();
    // Update user's score in the leaderboard
    const updated = current.map((u) => (u.id === user.id ? { ...u, rating_points: user.rating_points } : u));
    updated.sort((a, b) => b.rating_points - a.rating_points);
    return updated.map((u, i) => ({ ...u, rank: i + 1 }));
  },

  // Tasks
  async getTasks(): Promise<Task[]> {
    if (await isBackendAlive()) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tasks`, {
          headers: { Authorization: `Bearer ${searchParams}` },
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Backend getTasks failed, fallback', e);
      }
    }

    const currentTasks = getStorage<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    const currentUser = await this.getMe();
    const subs = getStorage<Submission[]>(STORAGE_KEYS.SUBMISSIONS, []);

    // Synchronize tasks with user's submissions
    const syncedTasks = currentTasks.map((task) => {
      // Find latest submission for this task by current user
      const userSub = subs.find(
        (s) => s.task_id === task.id && (s.user_id === currentUser.id || s.user_id === currentUser.vk_id)
      );

      if (userSub) {
        if (userSub.status === 'APPROVED') {
          return {
            ...task,
            user_status: 'APPROVED' as const,
            can_submit: false,
            user_submission_id: userSub.id,
            rejection_reason: undefined,
          };
        } else if (userSub.status === 'PENDING') {
          return {
            ...task,
            user_status: 'PENDING' as const,
            can_submit: false,
            user_submission_id: userSub.id,
            rejection_reason: undefined,
          };
        } else if (userSub.status === 'REJECTED') {
          return {
            ...task,
            user_status: 'REJECTED' as const,
            can_submit: true,
            user_submission_id: userSub.id,
            rejection_reason: userSub.admin_comment,
          };
        }
      }

      // Preserve previously approved status (e.g. from QR scan) or set AVAILABLE
      const isApproved = task.user_status === 'APPROVED';
      return {
        ...task,
        user_status: isApproved ? ('APPROVED' as const) : ('AVAILABLE' as const),
        can_submit: !isApproved,
      };
    });

    setStorage(STORAGE_KEYS.TASKS, syncedTasks);
    return syncedTasks;
  },

  // Submit task proof
  async submitTask(taskId: number, proofImages: string[], comment?: string): Promise<Submission> {
    if (await isBackendAlive()) {
      try {
        const proofUrls = await Promise.all(proofImages.map(async (proofImage, index) => {
          if (!proofImage.startsWith('data:')) return proofImage;

          const imageBlob = await fetch(proofImage).then((response) => response.blob());
          const extension = imageBlob.type.split('/')[1] || 'jpg';
          const formData = new FormData();
          formData.append('file', imageBlob, `proof-${index + 1}.${extension}`);

          const uploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${searchParams}` },
            body: formData,
          });
          if (!uploadResponse.ok) {
            throw new Error('Не удалось загрузить одно из изображений');
          }
          const uploadResult: { url: string } = await uploadResponse.json();
          return uploadResult.url;
        }));

        const res = await fetch(`${API_BASE_URL}/api/tasks/submissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${searchParams}`,
          },
          body: JSON.stringify({ task_id: taskId, proof_image_urls: proofUrls, comment }),
        });
        if (res.ok) return await res.json();
        const error = await res.json().catch(() => null);
        throw new Error(error?.detail || 'Не удалось отправить подтверждение');
      } catch (e) {
        console.warn('Backend submitTask failed', e);
        throw e;
      }
    }

    const tasks = await this.getTasks();
    const task = tasks.find((t) => t.id === taskId);
    const user = await this.getMe();

    const newSub: Submission = {
      id: Date.now(),
      user_id: user.id,
      task_id: taskId,
      proof_image_urls: proofImages,
      comment: comment || '',
      status: 'PENDING',
      created_at: new Date().toISOString(),
      task,
      user,
    };

    // Update submissions list
    const subs = getStorage<Submission[]>(STORAGE_KEYS.SUBMISSIONS, []);
    subs.unshift(newSub);
    setStorage(STORAGE_KEYS.SUBMISSIONS, subs);

    // Update task state in UI
    const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, user_status: 'PENDING' as const, can_submit: false } : t));
    setStorage(STORAGE_KEYS.TASKS, updatedTasks);

    return newSub;
  },

  // QR Code scan
  async scanQRCode(code: string): Promise<{ success: boolean; message: string; points: number }> {
    if (await isBackendAlive()) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/qr/scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${searchParams}`,
          },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (res.ok) {
          return { success: true, message: data.message, points: data.points_earned };
        } else {
          throw new Error(data.detail || 'Ошибка сканирования');
        }
      } catch (e: any) {
        if (!e.message?.includes('Failed to fetch')) throw e;
      }
    }

    const qrList = getStorage<QRCodeItem[]>(STORAGE_KEYS.QR, [
      { id: 1, code_hash: 'LAMPA-QR-CAMP-001', points: 10, is_used: false, created_at: new Date().toISOString() },
      { id: 2, code_hash: 'LAMPA-QR-CAMP-002', points: 10, is_used: false, created_at: new Date().toISOString() },
    ]);

    const qr = qrList.find((q) => q.code_hash.toLowerCase() === code.trim().toLowerCase());
    if (!qr) {
      throw new Error('Недействительный QR-код лагеря');
    }
    if (qr.is_used) {
      throw new Error('Этот QR-код уже активирован другим участником');
    }

    // Mark as used
    qr.is_used = true;
    qr.used_at = new Date().toISOString();
    setStorage(STORAGE_KEYS.QR, qrList);

    // Award points
    const user = await this.getMe();
    user.rating_points += qr.points;
    user.spendable_points += qr.points;
    setStorage(STORAGE_KEYS.USER, user);

    // Mark task #4 as completed
    const tasks = await this.getTasks();
    const updatedTasks = tasks.map((t) => (t.id === 4 ? { ...t, user_status: 'APPROVED' as const, can_submit: false } : t));
    setStorage(STORAGE_KEYS.TASKS, updatedTasks);

    return {
      success: true,
      message: `Поздравляем! QR-код найден! Начислено +${qr.points} баллов!`,
      points: qr.points,
    };
  },

  // Shop
  async getShopItems(): Promise<ShopItem[]> {
    if (await isBackendAlive()) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/shop/items`, {
          headers: { Authorization: `Bearer ${searchParams}` },
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Backend getShopItems failed, fallback', e);
      }
    }
    const items = getStorage<ShopItem[]>(STORAGE_KEYS.SHOP, INITIAL_SHOP_ITEMS);
    const user = await this.getMe();
    const orders = getStorage<Order[]>(STORAGE_KEYS.ORDERS, []);

    return items.map((item) => {
      const userPurchases = orders.filter((o) => o.item_id === item.id && o.status !== 'CANCELLED').length;
      let can_buy = true;
      if (item.stock <= 0) can_buy = false;
      else if (user.spendable_points < item.price) can_buy = false;
      else if (item.max_per_user && userPurchases >= item.max_per_user) can_buy = false;

      return {
        ...item,
        already_purchased_count: userPurchases,
        can_buy,
      };
    });
  },

  async purchaseItem(itemId: number): Promise<Order> {
    if (await isBackendAlive()) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/shop/purchase`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${searchParams}`,
          },
          body: JSON.stringify({ item_id: itemId }),
        });
        const data = await res.json();
        if (res.ok) return data;
        throw new Error(data.detail || 'Ошибка покупки');
      } catch (e: any) {
        if (!e.message?.includes('Failed to fetch')) throw e;
      }
    }

    const items = await this.getShopItems();
    const item = items.find((i) => i.id === itemId);
    if (!item) throw new Error('Товар не найден');

    if (item.stock <= 0) throw new Error('Данный товар закончился на складе');

    const user = await this.getMe();
    if (user.spendable_points < item.price) {
      throw new Error(`Недостаточно баллов. Требуется: ${item.price}, доступно: ${user.spendable_points}`);
    }

    const orders = getStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    if (item.max_per_user) {
      const count = orders.filter((o) => o.item_id === item.id && o.status !== 'CANCELLED').length;
      if (count >= item.max_per_user) {
        throw new Error(`Лимит на данный товар: ${item.max_per_user} шт. на человека`);
      }
    }

    // Deduct stock and spendable points ONLY (rating points stay untouched!)
    item.stock -= 1;
    setStorage(STORAGE_KEYS.SHOP, items);

    user.spendable_points -= item.price;
    setStorage(STORAGE_KEYS.USER, user);

    const pickupCode = `LMP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newOrder: Order = {
      id: Date.now(),
      user_id: user.id,
      item_id: item.id,
      price_paid: item.price,
      pickup_code: pickupCode,
      status: 'PENDING_PICKUP',
      created_at: new Date().toISOString(),
      item,
      user,
    };

    orders.unshift(newOrder);
    setStorage(STORAGE_KEYS.ORDERS, orders);

    return newOrder;
  },

  async getMyOrders(): Promise<Order[]> {
    if (await isBackendAlive()) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/shop/my-orders`, {
          headers: { Authorization: `Bearer ${searchParams}` },
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Backend getMyOrders failed, fallback', e);
      }
    }
    return getStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
  },

  // Admin APIs
  async getAdminSubmissions(filter?: string): Promise<Submission[]> {
    if (await isBackendAlive()) {
      try {
        const url = filter ? `${API_BASE_URL}/api/admin/submissions?status_filter=${filter}` : `${API_BASE_URL}/api/admin/submissions`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${searchParams}` } });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Backend getAdminSubmissions failed', e);
      }
    }

    const subs = getStorage<Submission[]>(STORAGE_KEYS.SUBMISSIONS, [
      {
        id: 101,
        user_id: 4,
        task_id: 7,
        proof_image_urls: ['https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80'],
        comment: 'Вот мем про утреннюю зарядку и лекции!',
        status: 'PENDING',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        user: { id: 4, vk_id: 10004, first_name: 'Анна', last_name: 'Кузнецова', role: 'USER', rating_points: 150, spendable_points: 150 },
        task: {
          id: 7,
          title: '«МЕМНЫЙ ЧЕЛ»',
          description: 'Сделай мем связанный с лагерем',
          points: 30,
          frequency: 'DAILY',
          task_type: 'SCREENSHOT',
          is_active: true,
          order_num: 7,
          user_status: 'PENDING',
          can_submit: false,
        },
      },
    ]);

    if (filter) {
      return subs.filter((s) => s.status === filter);
    }
    return subs;
  },

  async reviewSubmission(submissionId: number, status: 'APPROVED' | 'REJECTED', adminComment?: string): Promise<void> {
    if (await isBackendAlive()) {
      try {
        await fetch(`${API_BASE_URL}/api/admin/submissions/${submissionId}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${searchParams}` },
          body: JSON.stringify({ status, admin_comment: adminComment }),
        });
        return;
      } catch (e) {
        console.warn('Backend review failed', e);
      }
    }

    const subs = getStorage<Submission[]>(STORAGE_KEYS.SUBMISSIONS, []);
    const sub = subs.find((s) => s.id === submissionId);
    if (sub) {
      sub.status = status;
      sub.admin_comment = adminComment || (status === 'APPROVED' ? 'Одобрено' : 'Отклонено');
      setStorage(STORAGE_KEYS.SUBMISSIONS, subs);

      // If approved, add points to both rating and spendable
      const user = await this.getMe();
      if (status === 'APPROVED' && sub.task) {
        if (sub.user_id === user.id || sub.user_id === user.vk_id) {
          user.rating_points += sub.task.points;
          user.spendable_points += sub.task.points;
          setStorage(STORAGE_KEYS.USER, user);
        }
      }

      // Re-synchronize tasks state with the newly updated submission
      await this.getTasks();
    }
  },

  async grantPoints(userId: number, points: number, reason: string): Promise<void> {
    if (await isBackendAlive()) {
      try {
        await fetch(`${API_BASE_URL}/api/admin/points/grant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${searchParams}` },
          body: JSON.stringify({ user_id: userId, points, reason }),
        });
        return;
      } catch (e) {
        console.warn('Backend grant failed', e);
      }
    }

    const user = await this.getMe();
    user.rating_points += points;
    user.spendable_points += points;
    setStorage(STORAGE_KEYS.USER, user);
  },

  async pickLuckyRandom(): Promise<string[]> {
    if (await isBackendAlive()) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/points/random-lucky`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${searchParams}` },
        });
        if (res.ok) {
          const data = await res.json();
          return data.winners;
        }
      } catch (e) {
        console.warn('Backend random lucky failed', e);
      }
    }

    // Mock 5 random lucky winners
    const winners = ['Анна Кузнецова', 'Михаил Попов', 'Полина Васильева', 'Иван Петров', 'София Новикова'];
    const user = await this.getMe();
    user.rating_points += 50;
    user.spendable_points += 50;
    setStorage(STORAGE_KEYS.USER, user);
    return winners;
  },

  async generateQRCodes(count: number = 1): Promise<QRCodeItem[]> {
    if (await isBackendAlive()) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/qr/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${searchParams}` },
          body: JSON.stringify({ points: 10, count }),
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Backend QR generate failed', e);
      }
    }

    const qrList = getStorage<QRCodeItem[]>(STORAGE_KEYS.QR, []);
    const newQRs: QRCodeItem[] = [];
    for (let i = 0; i < count; i++) {
      const code = `LAMPA-QR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      newQRs.push({
        id: Date.now() + i,
        code_hash: code,
        points: 10,
        is_used: false,
        created_at: new Date().toISOString(),
      });
    }
    const combined = [...newQRs, ...qrList];
    setStorage(STORAGE_KEYS.QR, combined);
    return combined;
  },

  async getAdminQRCodes(): Promise<QRCodeItem[]> {
    return getStorage<QRCodeItem[]>(STORAGE_KEYS.QR, [
      { id: 1, code_hash: 'LAMPA-QR-CAMP-001', points: 10, is_used: false, created_at: new Date().toISOString() },
      { id: 2, code_hash: 'LAMPA-QR-CAMP-002', points: 10, is_used: false, created_at: new Date().toISOString() },
    ]);
  },

  async getAdminOrders(): Promise<Order[]> {
    return getStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
  },

  async deliverOrder(orderId: number): Promise<void> {
    const orders = getStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    const o = orders.find((ord) => ord.id === orderId);
    if (o) {
      o.status = 'DELIVERED';
      setStorage(STORAGE_KEYS.ORDERS, orders);
    }
  },

  async updateShopStock(itemId: number, stock: number): Promise<void> {
    const items = getStorage<ShopItem[]>(STORAGE_KEYS.SHOP, INITIAL_SHOP_ITEMS);
    const item = items.find((i) => i.id === itemId);
    if (item) {
      item.stock = stock;
      setStorage(STORAGE_KEYS.SHOP, items);
    }
  },

  async updateTask(task: Task): Promise<void> {
    const tasks = getStorage<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    const idx = tasks.findIndex((t) => t.id === task.id);
    if (idx !== -1) {
      tasks[idx] = task;
      setStorage(STORAGE_KEYS.TASKS, tasks);
    }
  },
};
