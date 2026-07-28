export interface WarehouseItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  rack: string;
  stock: number;
  initialStock?: number;
}

export interface StockMutation {
  id: string;
  itemId: string;
  itemName: string;
  type: 'masuk' | 'keluar';
  quantity: number;
  pic: string;
  time: string; // e.g. "09:12" or complete ISO string
  date: string; // "2026-06-04" etc.
}

export interface ReceivingHistory {
  id: string;
  date: string;
  qty: number;
}

export interface PreOrder {
  id: string;
  itemId: string;
  itemName: string;
  poCode: string;
  orderDate: string;
  totalQty: number;
  receivedQty: number;
  status: 'Pending' | 'Partial' | 'Complete';
  receivingHistory: ReceivingHistory[];
  vendor?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  time: string;
  isRead: boolean;
  linkToTab?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  role: string;
  avatar: string;
  message: string;
  time: string;
  isMe: boolean;
}

export interface UserSession {
  username: string;
  name: string;
  role: 'admin' | 'user';
  avatarUrl?: string;
}


