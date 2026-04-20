import React, { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Loader2, AlertCircle, X, ChevronDown } from 'lucide-react'
import { clsx } from '../../utils'

// ── Spinner ──────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size]
  return <Loader2 className={`animate-spin text-chocolate-600 ${s} ${className}`} />
}

// ── Loading page ─────────────────────────────────────────
export function LoadingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Spinner size="lg" />
      <span className="text-mocha-500 text-sm">Carregando...</span>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-cream-100 flex items-center justify-center text-3xl">🎂</div>
      <div>
        <p className="font-display font-semibold text-mocha-800 text-lg">{title}</p>
        {description && <p className="text-mocha-500 text-sm mt-1">{description}</p>}
      </div>
      {action && action}
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; icon?: ReactNode; hint?: string
}
export function Input({ label, error, icon, hint, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mocha-400">{icon}</span>}
        <input
className={clsx(
  'input',
  icon ? 'pl-10' : undefined,
  error ? 'border-red-400 focus:ring-red-300' : undefined,
  typeof className === 'string' ? className : undefined
)}          {...props}
        />
      </div>
      {hint && !error && <p className="text-xs text-mocha-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string; options: { value: string | number; label: string }[]
}
export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <div className="relative">
        <select className={clsx('input appearance-none pr-10', error && 'border-red-400', className)} {...props}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-mocha-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// ── Textarea ─────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; error?: string
}
export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <textarea className={clsx('input resize-none', error && 'border-red-400', className)} rows={3} {...props} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// ── Button ────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
}
export function Button({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...props }: ButtonProps) {
  const variants = {
    primary: 'btn-primary', secondary: 'btn-secondary', danger: 'btn-danger', ghost: 'btn-ghost'
  }
  const sizes = { sm: 'text-xs px-3 py-1.5', md: 'text-sm px-4 py-2', lg: 'text-base px-6 py-3' }
  return (
    <button className={clsx(variants[variant], sizes[size], 'flex items-center gap-2 font-medium rounded-xl transition-all duration-200', className)} disabled={disabled || loading} {...props}>
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </button>
  )
}

// ── Modal ────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose(): void; title: string; children: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-mocha-900/40 backdrop-blur-sm animate-fade-in" />
      <div className={clsx('relative bg-white rounded-2xl shadow-warm-lg w-full animate-slide-up flex flex-col max-h-[90vh]', sizes[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-100">
          <h2 className="font-display font-semibold text-mocha-900 text-lg">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-cream-100 text-mocha-500 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────
export function Badge({ children, variant = 'default' }: { children: ReactNode; variant?: string }) {
  const variants: Record<string, string> = {
    default: 'bg-cream-100 text-mocha-700',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    chocolate: 'bg-chocolate-100 text-chocolate-800',
    purple: 'bg-purple-100 text-purple-800',
  }
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant] || variants.default)}>
      {children}
    </span>
  )
}

// ── Card ──────────────────────────────────────────────────
export function Card({ children, className = '', hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return <div className={clsx('card', hover && 'card-hover cursor-pointer', className)}>{children}</div>
}

// ── Confirm dialog ────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }: {
  open: boolean; onClose(): void; onConfirm(): void; title: string; message: string; loading?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-mocha-600 text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>Excluir</Button>
      </div>
    </Modal>
  )
}

// ── Table ─────────────────────────────────────────────────
export function Table({ headers, children, empty }: { headers: string[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-cream-100">
      <table className="w-full">
        <thead className="bg-cream-50 border-b border-cream-100">
          <tr>{headers.map(h => <th key={h} className="table-th">{h}</th>)}</tr>
        </thead>
        <tbody className="bg-white divide-y divide-cream-50">{children}</tbody>
      </table>
    </div>
  )
}

// ── Stats Card ────────────────────────────────────────────
export function StatsCard({ title, value, sub, icon, color = 'chocolate', trend }: {
  title: string; value: string | number; sub?: string; icon: ReactNode
  color?: 'chocolate' | 'sage' | 'cream' | 'blue' | 'purple'
  trend?: { value: number; label: string }
}) {
  const colors = {
    chocolate: 'bg-chocolate-50 text-chocolate-700 border-chocolate-100',
    sage: 'bg-sage-50 text-sage-700 border-sage-100',
    cream: 'bg-cream-50 text-cream-700 border-cream-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  }
  return (
    <div className="kpi-card flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-mocha-500 mb-1">{title}</p>
        <p className="font-display text-2xl font-bold text-mocha-900 truncate">{value}</p>
        {sub && <p className="text-xs text-mocha-400 mt-1">{sub}</p>}
        {trend && (
          <p className={clsx('text-xs mt-2 font-medium', trend.value >= 0 ? 'text-green-600' : 'text-red-500')}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
      <div className={clsx('flex-shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center text-xl', colors[color])}>
        {icon}
      </div>
    </div>
  )
}
