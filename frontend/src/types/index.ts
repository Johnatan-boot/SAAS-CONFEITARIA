export interface Tenant {
  id: number; name: string; slug: string; email: string
  plan: 'free' | 'pro' | 'enterprise'; plan_status: string
  logo_url?: string; phone?: string; address?: string
  created_at: string
}

export interface User {
  id: number; tenant_id: number; name: string; email: string
  role: 'admin' | 'manager' | 'staff'; is_active: boolean
  last_login?: string; created_at: string
}

export interface Client {
  id: number; tenant_id: number; name: string; email?: string
  phone?: string; birthday?: string; address?: string; notes?: string
  total_orders: number; total_spent: number; created_at: string
}

export interface Product {
  id: number; tenant_id: number; name: string; description?: string
  price: number; cost_price?: number; unit: string; stock: number
  min_stock: number; category_id?: number; category_name?: string
  image_url?: string; is_active: boolean; created_at: string
}

export interface OrderItem {
  id: number; order_id: number; product_id?: number; product_name: string
  quantity: number; unit_price: number; total_price: number; notes?: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'cancelled'

export interface Order {
  id: number; tenant_id: number; client_id?: number; user_id?: number
  code: string; status: OrderStatus; delivery_date?: string
  delivery_type: 'pickup' | 'delivery'; delivery_address?: string
  subtotal: number; discount: number; total: number; notes?: string
  internal_notes?: string; paid_at?: string
  client_name?: string; user_name?: string; items?: OrderItem[]
  created_at: string; updated_at: string
}

export interface Payment {
  id: number; tenant_id: number; order_id: number; amount: number
  method: 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'transfer'
  status: 'pending' | 'paid' | 'refunded' | 'failed'
  order_code?: string; client_name?: string; paid_at?: string; created_at: string
}

export interface KPIs {
  revenue: { total: number; month: number }
  orders: { total: number; pending: number; in_production: number; delivered: number; cancelled: number }
  clients: { total: number }
  products: { total: number; low_stock: number }
}

export interface RevenueDay { date: string; revenue: number; orders: number }
export interface TopProduct { product_name: string; total_qty: number; total_revenue: number }
