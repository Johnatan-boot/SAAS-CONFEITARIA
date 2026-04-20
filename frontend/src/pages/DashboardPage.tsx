import React, { useEffect, useState } from 'react'
import { ShoppingBag, Users, Package, TrendingUp, Clock, AlertTriangle, Star, Calendar } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts'
import api from '../services/api'
import { KPIs, RevenueDay, TopProduct, Order, OrderStatus } from '../types'
import { formatCurrency, formatDate, formatDateTime, ORDER_STATUS_BADGE, ORDER_STATUS_LABELS } from '../utils'
import { LoadingPage, StatsCard, EmptyState } from '../components/ui'
import { clsx } from '../utils'

const PIE_COLORS = ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#6F4F37', '#EF4444']

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#F59E0B',
  in_production: '#8B5CF6',
  confirmed: '#3B82F6',
  ready: '#10B981',
  delivered: '#6F4F37',
  cancelled: '#EF4444',
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-mocha-900 text-cream-50 px-3 py-2 rounded-xl text-xs shadow-warm-lg">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' && p.value > 100 ? formatCurrency(p.value) : p.value}</p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [revenue, setRevenue] = useState<RevenueDay[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [ordersByStatus, setOrdersByStatus] = useState<{ status: OrderStatus; count: number }[]>([])
  const [upcoming, setUpcoming] = useState<Order[]>([])
  const [topClients, setTopClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/kpis'),
      api.get('/dashboard/revenue?days=14'),
      api.get('/dashboard/top-products'),
      api.get('/dashboard/orders-by-status'),
      api.get('/dashboard/upcoming-deliveries'),
      api.get('/dashboard/top-clients'),
    ]).then(([k, r, tp, obs, ud, tc]) => {
      setKpis(k.data.data)
      setRevenue(r.data.data)
      setTopProducts(tp.data.data)
      setOrdersByStatus(obs.data.data)
      setUpcoming(ud.data.data)
      setTopClients(tc.data.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingPage />

  const revenueFormatted = revenue.map(r => ({
    ...r,
    date: new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    revenue: Number(r.revenue)
  }))

  const statusData = ordersByStatus.map(s => ({
    name: ORDER_STATUS_LABELS[s.status] || s.status,
    color: STATUS_COLORS[s.status] || '#6F4F37',
    value: s.count,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-mocha-900">Dashboard</h2>
          <p className="text-mocha-500 text-sm mt-0.5">Visão geral do seu negócio hoje</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-mocha-400">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Receita do Mês"
          value={formatCurrency(kpis?.revenue?.month || 0)}
          sub="pedidos entregues"
          icon={<TrendingUp size={22} />}
          color="sage"
        />
        <StatsCard
          title="Pedidos este Mês"
          value={kpis?.orders?.total || 0}
          sub={`${kpis?.orders?.pending || 0} pendentes`}
          icon={<ShoppingBag size={22} />}
          color="chocolate"
        />
        <StatsCard
          title="Total de Clientes"
          value={kpis?.clients?.total || 0}
          sub="cadastrados"
          icon={<Users size={22} />}
          color="blue"
        />
        <StatsCard
          title="Produtos"
          value={kpis?.products?.total || 0}
          sub={kpis?.products?.low_stock ? `⚠️ ${kpis.products.low_stock} com estoque baixo` : 'todos ok'}
          icon={<Package size={22} />}
          color={kpis?.products?.low_stock ? 'cream' : 'purple'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-mocha-900">Receita — últimos 14 dias</h3>
            <span className="text-xs text-mocha-400 bg-cream-100 px-2.5 py-1 rounded-full">Entregues</span>
          </div>
          {revenueFormatted.length === 0 ? (
            <EmptyState title="Sem dados ainda" description="Conclua pedidos para ver o gráfico" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueFormatted}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e8dc" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9a7e5a' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9a7e5a' }} tickFormatter={v => `R$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="revenue" stroke="#6F4F37" strokeWidth={2.5} dot={{ r: 3, fill: '#6F4F37' }} name="Receita" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders by status pie */}
        <div className="card">
          <h3 className="font-display font-semibold text-mocha-900 mb-6">Pedidos por Status</h3>
          {statusData.length === 0 ? (
            <EmptyState title="Sem pedidos" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                    {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {statusData.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-mocha-600">{s.name}</span>
                    </div>
                    <span className="font-semibold text-mocha-800">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top products + Upcoming + Top clients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top products */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Star size={16} className="text-cream-600" />
            <h3 className="font-display font-semibold text-mocha-900">Top Produtos</h3>
          </div>
          {topProducts.length === 0 ? (
            <EmptyState title="Sem dados" description="Pedidos entregues aparecerão aqui" />
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.product_name} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-cream-100 flex items-center justify-center text-xs font-bold text-mocha-600 flex-shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-mocha-800 truncate">{p.product_name}</p>
                    <p className="text-xs text-mocha-400">{p.total_qty} vendidos</p>
                  </div>
                  <span className="text-sm font-semibold text-chocolate-700 flex-shrink-0">{formatCurrency(Number(p.total_revenue))}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming deliveries */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Calendar size={16} className="text-blue-500" />
            <h3 className="font-display font-semibold text-mocha-900">Próximas Entregas</h3>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState title="Nenhuma entrega" description="Sem entregas agendadas" />
          ) : (
            <div className="space-y-3">
              {upcoming.map(o => (
                <div key={o.id} className="flex items-start gap-3 p-3 bg-cream-50 rounded-xl">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Clock size={14} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-mocha-800 truncate">{o.client_name || 'Cliente'}</p>
                    <p className="text-xs text-mocha-400">{o.code}</p>
                    <p className="text-xs text-blue-600 font-medium mt-0.5">{formatDateTime(o.delivery_date!)}</p>
                  </div>
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium mt-0.5', ORDER_STATUS_BADGE[o.status])}>
                    {ORDER_STATUS_LABELS[o.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top clients */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Users size={16} className="text-sage-600" />
            <h3 className="font-display font-semibold text-mocha-900">Melhores Clientes</h3>
          </div>
          {topClients.length === 0 ? (
            <EmptyState title="Sem clientes" />
          ) : (
            <div className="space-y-3">
              {topClients.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-chocolate-800 flex items-center justify-center text-cream-50 text-sm font-semibold flex-shrink-0">
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-mocha-800 truncate">{c.name}</p>
                    <p className="text-xs text-mocha-400">{c.total_orders} pedidos</p>
                  </div>
                  <span className="text-sm font-bold text-sage-700">{formatCurrency(Number(c.total_spent))}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low stock alert */}
      {(kpis?.products?.low_stock || 0) > 0 && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4 animate-fade-in">
          <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">Estoque baixo</p>
            <p className="text-xs text-yellow-700">{kpis?.products?.low_stock} produto(s) abaixo do estoque mínimo. Verifique a página de Produtos.</p>
          </div>
        </div>
      )}
    </div>
  )
}
