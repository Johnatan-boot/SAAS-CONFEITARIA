import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Eye, Pencil, Trash2, ChevronDown, Filter, ShoppingBag } from 'lucide-react'
import api from '../services/api'
import { Order, OrderStatus, Client, Product } from '../types'
import { formatCurrency, formatDate, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_BADGE } from '../utils'
import { LoadingPage, Modal, Button, Input, Select, Textarea, EmptyState, ConfirmDialog, Table } from '../components/ui'
import { clsx } from '../utils'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  ...Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label }))
]

const STATUS_NEXT: Record<OrderStatus, OrderStatus | null> = {
  pending: 'confirmed', confirmed: 'in_production', in_production: 'ready',
  ready: 'delivered', delivered: null, cancelled: null
}

interface OrderItem { product_id?: number; product_name: string; quantity: number; unit_price: number; notes?: string }

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selected, setSelected] = useState<Order | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    client_id: '', delivery_date: '', delivery_type: 'pickup',
    delivery_address: '', discount: '0', notes: ''
  })
  const [items, setItems] = useState<OrderItem[]>([{ product_name: '', quantity: 1, unit_price: 0 }])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const [ordRes, cliRes, proRes] = await Promise.all([
        api.get(`/orders?${params}`),
        api.get('/clients'),
        api.get('/products'),
      ])
      setOrders(ordRes.data.data)
      setClients(cliRes.data.data)
      setProducts(proRes.data.data)
    } catch { toast.error('Erro ao carregar pedidos') }
    finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  function openNew() {
    setSelected(null)
    setForm({ client_id: '', delivery_date: '', delivery_type: 'pickup', delivery_address: '', discount: '0', notes: '' })
    setItems([{ product_name: '', quantity: 1, unit_price: 0 }])
    setModalOpen(true)
  }

  function openView(order: Order) {
    setSelected(order)
    setViewOpen(true)
  }

  function addItem() {
    setItems(i => [...i, { product_name: '', quantity: 1, unit_price: 0 }])
  }

  function removeItem(idx: number) {
    setItems(i => i.filter((_, ii) => ii !== idx))
  }

  function updateItem(idx: number, field: keyof OrderItem, value: any) {
    setItems(prev => {
      const next = [...prev]
      if (field === 'product_id' && value) {
        const p = products.find(p => p.id === Number(value))
        if (p) { next[idx] = { ...next[idx], product_id: p.id, product_name: p.name, unit_price: Number(p.price) } }
      } else {
        next[idx] = { ...next[idx], [field]: value }
      }
      return next
    })
  }

  const subtotal = items.reduce((acc, i) => acc + i.quantity * i.unit_price, 0)
  const total = subtotal - (Number(form.discount) || 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.some(i => !i.product_name || i.quantity < 1 || i.unit_price <= 0)) {
      toast.error('Preencha todos os itens corretamente')
      return
    }
    setSaving(true)
    try {
      const payload = {
        client_id: form.client_id ? Number(form.client_id) : undefined,
        delivery_date: form.delivery_date || undefined,
        delivery_type: form.delivery_type,
        delivery_address: form.delivery_address || undefined,
        discount: Number(form.discount) || 0,
        notes: form.notes || undefined,
        items: items.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: Number(i.quantity), unit_price: Number(i.unit_price) })),
      }
      await api.post('/orders', payload)
      toast.success('Pedido criado!')
      setModalOpen(false)
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  async function handleStatusChange(order: Order) {
    const next = STATUS_NEXT[order.status]
    if (!next) return
    try {
      await api.patch(`/orders/${order.id}/status`, { status: next })
      toast.success(`Status: ${ORDER_STATUS_LABELS[next]}`)
      load()
    } catch { toast.error('Erro ao atualizar status') }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await api.delete(`/orders/${deleteId}`)
      toast.success('Pedido removido')
      setDeleteId(null)
      load()
    } catch { toast.error('Erro ao excluir') }
    finally { setDeleting(false) }
  }

  const filtered = orders.filter(o =>
    o.code?.toLowerCase().includes(search.toLowerCase()) ||
    o.client_name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingPage />

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-mocha-900">Pedidos</h2>
          <p className="text-mocha-500 text-sm">{orders.length} pedido(s) este mês</p>
        </div>
        <Button onClick={openNew} icon={<Plus size={16} />}>Novo Pedido</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mocha-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código ou cliente..."
            className="input pl-10 w-full" />
        </div>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          options={STATUS_OPTIONS} className="sm:w-52" label="" />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState title="Nenhum pedido encontrado" description="Crie seu primeiro pedido" action={<Button onClick={openNew} icon={<Plus size={16} />}>Novo Pedido</Button>} />
      ) : (
        <Table headers={['Código', 'Cliente', 'Total', 'Entrega', 'Status', 'Ações']}>
          {filtered.map(o => (
            <tr key={o.id} className="table-tr">
              <td className="table-td font-mono text-xs font-semibold text-chocolate-700">{o.code}</td>
              <td className="table-td">{o.client_name || <span className="text-mocha-400 italic">Avulso</span>}</td>
              <td className="table-td font-semibold">{formatCurrency(Number(o.total))}</td>
              <td className="table-td text-xs">{o.delivery_date ? formatDate(o.delivery_date) : '—'}</td>
              <td className="table-td">
                <span className={ORDER_STATUS_BADGE[o.status]}>{ORDER_STATUS_LABELS[o.status]}</span>
              </td>
              <td className="table-td">
                <div className="flex items-center gap-1">
                  <button onClick={() => openView(o)} className="p-1.5 rounded-lg hover:bg-cream-100 text-mocha-500 transition-colors" title="Ver detalhes">
                    <Eye size={14} />
                  </button>
                  {STATUS_NEXT[o.status] && (
                    <button onClick={() => handleStatusChange(o)} title={`Avançar para ${ORDER_STATUS_LABELS[STATUS_NEXT[o.status]!]}`}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors text-xs font-medium">
                      <ChevronDown size={14} />
                    </button>
                  )}
                  <button onClick={() => setDeleteId(o.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* New order modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Pedido" size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Cliente (opcional)" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
              options={[{ value: '', label: 'Venda avulsa' }, ...clients.map(c => ({ value: c.id, label: c.name }))]} />
            <Select label="Tipo de entrega" value={form.delivery_type} onChange={e => setForm(f => ({ ...f, delivery_type: e.target.value }))}
              options={[{ value: 'pickup', label: 'Retirada' }, { value: 'delivery', label: 'Entrega' }]} />
            <Input label="Data de entrega" type="datetime-local" value={form.delivery_date} onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))} />
            <Input label="Desconto (R$)" type="number" step="0.01" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} />
          </div>
          {form.delivery_type === 'delivery' && (
            <Input label="Endereço de entrega" value={form.delivery_address} onChange={e => setForm(f => ({ ...f, delivery_address: e.target.value }))} />
          )}

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">Itens do Pedido</label>
              <button type="button" onClick={addItem} className="text-xs text-chocolate-700 hover:text-chocolate-800 font-medium flex items-center gap-1">
                <Plus size={12} /> Adicionar item
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 bg-cream-50 rounded-xl">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select value={item.product_id || ''} onChange={e => updateItem(idx, 'product_id' as any, e.target.value)}
                      className="input text-sm col-span-1 sm:col-span-1">
                      <option value="">Produto livre</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(Number(p.price))}</option>)}
                    </select>
                    {!item.product_id && (
                      <input placeholder="Nome do item" value={item.product_name} onChange={e => updateItem(idx, 'product_name', e.target.value)}
                        className="input text-sm" />
                    )}
                    <input type="number" placeholder="Qtd" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                      className="input text-sm w-full" />
                    <input type="number" placeholder="Preço unit." step="0.01" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))}
                      className="input text-sm" />
                  </div>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="p-2 text-red-400 hover:text-red-600 mt-0.5">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Textarea label="Observações" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Sabor, decoração, mensagem no bolo..." />

          {/* Summary */}
          <div className="bg-cream-50 rounded-xl p-4 space-y-1">
            <div className="flex justify-between text-sm text-mocha-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-sm text-mocha-600"><span>Desconto</span><span>- {formatCurrency(Number(form.discount) || 0)}</span></div>
            <div className="flex justify-between text-base font-bold text-mocha-900 pt-1 border-t border-cream-200"><span>Total</span><span>{formatCurrency(total)}</span></div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Criar Pedido</Button>
          </div>
        </form>
      </Modal>

      {/* View modal */}
      {selected && (
        <Modal open={viewOpen} onClose={() => setViewOpen(false)} title={`Pedido ${selected.code}`} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-mocha-400 text-xs">Cliente</p><p className="font-medium">{selected.client_name || 'Avulso'}</p></div>
              <div><p className="text-mocha-400 text-xs">Status</p><span className={ORDER_STATUS_BADGE[selected.status]}>{ORDER_STATUS_LABELS[selected.status]}</span></div>
              <div><p className="text-mocha-400 text-xs">Criado em</p><p className="font-medium">{formatDateTime(selected.created_at)}</p></div>
              <div><p className="text-mocha-400 text-xs">Entrega</p><p className="font-medium">{selected.delivery_date ? formatDateTime(selected.delivery_date) : '—'}</p></div>
            </div>
            {selected.items && selected.items.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-mocha-500 uppercase tracking-wide mb-2">Itens</p>
                <div className="space-y-2">
                  {selected.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between text-sm bg-cream-50 rounded-xl px-4 py-2">
                      <span>{i.product_name} × {i.quantity}</span>
                      <span className="font-semibold">{formatCurrency(Number(i.total_price))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-cream-50 rounded-xl p-4">
              <div className="flex justify-between font-bold text-mocha-900">
                <span>Total</span><span>{formatCurrency(Number(selected.total))}</span>
              </div>
            </div>
            {selected.notes && <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-sm text-yellow-800">{selected.notes}</div>}
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Excluir Pedido" message="Tem certeza? Esta ação não pode ser desfeita." loading={deleting}
      />
    </div>
  )
}
