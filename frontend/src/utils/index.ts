import { OrderStatus } from '../types'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(date: string): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(date: string): string {
  if (!date) return '—'
  return new Date(date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  in_production: 'Em Produção',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  in_production: 'badge-production',
  ready: 'badge-ready',
  delivered: 'badge-delivered',
  cancelled: 'badge-cancelled',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Dinheiro', pix: 'PIX', credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito', transfer: 'Transferência',
}

export function clsx(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
