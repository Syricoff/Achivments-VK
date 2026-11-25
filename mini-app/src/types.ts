export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: number;
  vk_id: number;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  role: UserRole;
  rating_points: number;
  spendable_points: number;
}

export type TaskFrequency = 'ONCE' | 'DAILY';
export type TaskType = 'SCREENSHOT' | 'QR' | 'MANUAL';
export type TaskStatus = 'AVAILABLE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Task {
  id: number;
  title: string;
  description: string;
  points: number;
  frequency: TaskFrequency;
  daily_global_limit?: number | null;
  task_type: TaskType;
  is_active: boolean;
  order_num: number;
  user_status: TaskStatus;
  user_submission_id?: number | null;
  rejection_reason?: string | null;
  today_submissions_count?: number;
  can_submit: boolean;
}

export interface Submission {
  id: number;
  user_id: number;
  task_id: number;
  proof_image_urls: string[];
  comment?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_comment?: string | null;
  created_at: string;
  user?: User;
  task?: Task;
}

export interface ShopItem {
  id: number;
  title: string;
  price: number;
  stock: number;
  max_per_user?: number | null;
  is_active: boolean;
  already_purchased_count?: number;
  can_buy?: boolean;
}

export interface Order {
  id: number;
  user_id: number;
  item_id: number;
  price_paid: number;
  pickup_code: string;
  status: 'PENDING_PICKUP' | 'DELIVERED' | 'CANCELLED';
  created_at: string;
  item?: ShopItem;
  user?: User;
}

export interface QRCodeItem {
  id: number;
  code_hash: string;
  points: number;
  is_used: boolean;
  used_at?: string | null;
  used_by_user_id?: number | null;
  created_at: string;
}

export interface LeaderboardUser {
  id: number;
  vk_id: number;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  rating_points: number;
  rank: number;
}
