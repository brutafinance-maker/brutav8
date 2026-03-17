export type TransactionType = 'entrada' | 'saida';

export type PaymentMethod = 'pix' | 'dinheiro' | 'transferencia' | 'cartao';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string;
}

export interface Transaction {
  id: string;
  value: number;
  type: TransactionType;
  category: string;
  subcategory?: string;
  description: string;
  responsible: string;
  date: string;
  paymentMethod: PaymentMethod;
  eventId?: string;
  productId?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  estimatedCost: number;
  realCost: number;
  ticketsSold: number;
  ticketPrice: number;
  totalRevenue: number;
  status: 'planejado' | 'realizado' | 'cancelado';
}

export interface Product {
  id: string;
  name: string;
  productionCost: number;
  salePrice: number;
  quantityProduced: number;
  quantitySold: number;
}

export interface Sponsor {
  id: string;
  name: string;
  contact: string;
  value: number;
  date: string;
  type: string;
  eventId?: string;
}

export interface AccessLog {
  id: string;
  page: string;
  timestamp: string;
  action: string;
  user: string;
}

export interface AppState {
  transactions: Transaction[];
  events: Event[];
  products: Product[];
  sponsors: Sponsor[];
  categories: Category[];
  logs: AccessLog[];
  initialBalance: number;
}
