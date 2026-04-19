import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { formatCurrency, formatDate, formatDateTime } from '../utils'
import { LoadingPage, EmptyState, Badge } from '../components/ui'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

// ── Reports ────────────────────────────────────────────────────────────────
export function ReportsPage() {
  const [revenue, setRevenue] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/dashboard/revenue?days=30'), api.get('/dashboard/top-products')])
      .then(([r, tp]) => { setRevenue(r.data.data); setTopProducts(tp.data.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingPage />

  const totalRevenue = revenue.reduce((a, r) => a + Number(r.revenue), 0)
  const totalOrders = revenue.reduce((a, r) => a + Number(r.orders), 0)

  const chartData = revenue.map(r => ({
    ...r,
    date: new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    revenue: Number(r.revenue),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-mocha-900">Relatórios</h2>
        <p className="text-mocha-500 text-sm">Últimos 30 dias</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Receita Total', value: formatCurrency(totalRevenue), icon: '💰' },
          { label: 'Pedidos Entregues', value: totalOrders, icon: '📦' },
          { label: 'Ticket Médio', value: totalOrders > 0 ? formatCurrency(totalRevenue / totalOrders) : 'R$ 0,00', icon: '🎯' },
        ].map(k => (
          <div key={k.label} className="card text-center">
            <div className="text-3xl mb-2">{k.icon}</div>
            <p className="font-display text-2xl font-bold text-mocha-900">{k.value}</p>
            <p className="text-sm text-mocha-400 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="font-display font-semibold text-mocha-900 mb-5">Receita Diária — 30 dias</h3>
        {chartData.length === 0 ? <EmptyState title="Sem dados" /> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e8dc" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9a7e5a' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9a7e5a' }} tickFormatter={v => `R$${v}`} />
              <Tooltip contentStyle={{ background: '#2c1c12', color: '#fdf6f0', border: 'none', borderRadius: 12 }} formatter={(v: any) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#6F4F37" radius={[4, 4, 0, 0]} name="Receita" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <h3 className="font-display font-semibold text-mocha-900 mb-5">Produtos mais vendidos</h3>
        {topProducts.length === 0 ? <EmptyState title="Sem dados ainda" /> : (
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-lg w-6 text-center">{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i] || `${i + 1}`}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-mocha-800">{p.product_name}</span>
                    <span className="text-sm font-bold text-chocolate-700">{formatCurrency(Number(p.total_revenue))}</span>
                  </div>
                  <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
                    <div className="h-full bg-chocolate-600 rounded-full" style={{ width: `${(Number(p.total_revenue) / Number(topProducts[0].total_revenue)) * 100}%` }} />
                  </div>
                  <p className="text-xs text-mocha-400 mt-0.5">{p.total_qty} unidades</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Audit ─────────────────────────────────────────────────────────────────
export function AuditPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/audit').then(r => setLogs(r.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingPage />

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-mocha-900">Auditoria</h2>
        <p className="text-mocha-500 text-sm">Registro de todas as ações no sistema</p>
      </div>
      {logs.length === 0 ? <EmptyState title="Nenhum log" description="As ações aparecerão aqui" /> : (
        <div className="card p-0 overflow-hidden">
          <div className="divide-y divide-cream-50">
            {logs.map(l => (
              <div key={l.id} className="flex items-start gap-4 px-5 py-3 hover:bg-cream-50 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-chocolate-100 flex items-center justify-center text-chocolate-700 text-xs font-bold flex-shrink-0 mt-0.5">
                  {l.user_name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-mocha-800">{l.user_name || 'Sistema'}</span>
                    <Badge variant="info">{l.action}</Badge>
                    {l.entity && <span className="text-xs text-mocha-400">{l.entity} #{l.entity_id}</span>}
                  </div>
                  <p className="text-xs text-mocha-400 mt-0.5">{formatDateTime(l.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Settings ──────────────────────────────────────────────────────────────
export function SettingsPage() {
  const [tenant, setTenant] = useState<any>(null)
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    api.get('/tenants/profile').then(r => {
      setTenant(r.data.data)
      setForm({ name: r.data.data.name, phone: r.data.data.phone || '', address: r.data.data.address || '' })
    })
    setLoadingUsers(true)
    api.get('/users').then(r => setUsers(r.data.data)).finally(() => setLoadingUsers(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/tenants/profile', form)
      const { toast } = await import('react-hot-toast')
      toast.success('Configurações salvas!')
    } catch { const { toast } = await import('react-hot-toast'); toast.error('Erro ao salvar') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-mocha-900">Configurações</h2>
        <p className="text-mocha-500 text-sm">Gerencie sua confeitaria</p>
      </div>

      {tenant && (
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-chocolate-800 flex items-center justify-center text-cream-50 font-bold">🎂</div>
            <div>
              <p className="font-semibold text-mocha-900">{tenant.name}</p>
              <p className="text-xs text-mocha-400">Slug: {tenant.slug}</p>
            </div>
            <div className="ml-auto">
              <Badge variant={tenant.plan === 'pro' ? 'success' : 'default'}>{tenant.plan?.toUpperCase()}</Badge>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="font-display font-semibold text-mocha-900 mb-4">Dados da Confeitaria</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Nome da confeitaria</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Telefone</label>
              <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 9 9999-9999" />
            </div>
          </div>
          <div>
            <label className="label">Endereço</label>
            <input className="input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Rua, número, bairro, cidade" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 className="font-display font-semibold text-mocha-900 mb-4">Usuários ({users.length})</h3>
        {loadingUsers ? <LoadingPage /> : (
          <div className="divide-y divide-cream-100">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-chocolate-700 flex items-center justify-center text-cream-50 text-sm font-bold">
                    {u.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-mocha-800">{u.name}</p>
                    <p className="text-xs text-mocha-400">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={u.role === 'admin' ? 'chocolate' : u.role === 'manager' ? 'info' : 'default'}>{u.role}</Badge>
                  {!u.is_active && <Badge variant="danger">Inativo</Badge>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Onboard ───────────────────────────────────────────────────────────────
export function OnboardPage() {
  const [form, setForm] = useState({ tenantName: '', adminName: '', adminEmail: '', adminPassword: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { default: axios } = await import('axios')
      const res = await axios.post('/api/tenants/onboard', form)
      setResult(res.data.data)
      setDone(true)
    } catch (err: any) {
      const { toast } = await import('react-hot-toast')
      toast.error(err?.response?.data?.error || 'Erro ao cadastrar. Verifique os dados e tente novamente.')
    } finally { setLoading(false) }
  }

  if (done && result) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-mocha-900">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-warm-lg animate-slide-up">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="font-display text-2xl font-bold text-mocha-900 mb-2">Confeitaria criada!</h2>
        <p className="text-mocha-500 text-sm mb-6">Sua conta está pronta. Guarde seu slug para fazer login.</p>
        <div className="bg-cream-50 rounded-2xl p-4 text-left text-sm space-y-2 mb-6">
          <p><span className="text-mocha-400">Slug:</span> <strong className="text-chocolate-700">{result.tenant?.slug}</strong></p>
          <p><span className="text-mocha-400">Email:</span> <strong>{form.adminEmail}</strong></p>
        </div>
        <a href="/login" className="btn-primary inline-flex">Ir para o login →</a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex">
      {/* Painel esquerdo — formulário */}
      <div className="flex-1 flex items-center justify-center p-8 bg-mocha-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-chocolate-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-sage-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md animate-slide-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-cream-100 rounded-3xl mb-4 shadow-warm-lg text-4xl">
              🎂
            </div>
            <h1 className="font-display text-3xl font-bold text-cream-50">Cadastre sua confeitaria</h1>
            <p className="text-chocolate-300 text-sm mt-1">Comece gratuitamente em 30 segundos</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: 'Nome da confeitaria', key: 'tenantName', placeholder: 'Ex: Confeitaria da Ana', type: 'text' },
                { label: 'Seu nome', key: 'adminName', placeholder: 'Nome completo', type: 'text' },
                { label: 'Email', key: 'adminEmail', placeholder: 'seu@email.com', type: 'email' },
                { label: 'Senha (mínimo 6 caracteres)', key: 'adminPassword', placeholder: '••••••••', type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-chocolate-200 mb-1.5">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} required
                    minLength={f.key === 'adminPassword' ? 6 : undefined}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-cream-50 placeholder-chocolate-400 focus:outline-none focus:ring-2 focus:ring-chocolate-400 transition-all" />
                </div>
              ))}
              <button type="submit" disabled={loading}
                className="w-full bg-chocolate-600 hover:bg-chocolate-500 text-cream-50 font-semibold py-3 rounded-xl transition-all duration-200 hover:shadow-warm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Criando...</> : 'Criar minha confeitaria'}
              </button>
            </form>
            <p className="text-center text-chocolate-400 text-xs mt-5">
              Já tem conta? <a href="/login" className="text-chocolate-200 hover:text-cream-100 underline">Entrar</a>
            </p>
          </div>
        </div>
      </div>

      {/* Painel direito — imagem */}
      <div className="hidden lg:block lg:w-[55%] relative">
        <img
          src="https://images.pexels.com/photos/34802628/pexels-photo-34802628.jpeg"
          alt="Doces artesanais"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-mocha-900/10 to-mocha-900/60" />
        <div className="absolute bottom-12 left-10 right-10">
          <blockquote className="text-white font-display text-2xl font-semibold leading-snug drop-shadow-lg">
            "Cada pedido é uma história.<br />Conte a sua com a gente."
          </blockquote>
          <p className="text-cream-200/80 text-sm mt-3 drop-shadow">Cadastro gratuito. Sem cartão de crédito.</p>
        </div>
      </div>
    </div>
  )
}
