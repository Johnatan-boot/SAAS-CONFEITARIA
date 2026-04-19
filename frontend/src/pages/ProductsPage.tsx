import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, AlertTriangle, Package } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../services/api'
import { Product } from '../types'
import { formatCurrency } from '../utils'
import { LoadingPage, Modal, Button, Input, Select, Textarea, EmptyState, ConfirmDialog, Table, Badge } from '../components/ui'
import toast from 'react-hot-toast'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [lowStock, setLowStock] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [view, setView] = useState<'list' | 'chart'>('list')

  const [form, setForm] = useState({
    name: '', description: '', price: '', cost_price: '', unit: 'unidade',
    stock: '0', min_stock: '0', is_active: true
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [proRes, lowRes] = await Promise.all([api.get('/products'), api.get('/products/low-stock')])
      setProducts(proRes.data.data)
      setLowStock(lowRes.data.data)
    } catch { toast.error('Erro ao carregar produtos') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() {
    setSelected(null)
    setForm({ name: '', description: '', price: '', cost_price: '', unit: 'unidade', stock: '0', min_stock: '0', is_active: true })
    setModalOpen(true)
  }

  function openEdit(p: Product) {
    setSelected(p)
    setForm({
      name: p.name, description: p.description || '', price: String(p.price),
      cost_price: String(p.cost_price || ''), unit: p.unit, stock: String(p.stock),
      min_stock: String(p.min_stock), is_active: p.is_active
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, price: Number(form.price), cost_price: form.cost_price ? Number(form.cost_price) : undefined, stock: Number(form.stock), min_stock: Number(form.min_stock) }
      if (selected) {
        await api.put(`/products/${selected.id}`, payload)
        toast.success('Produto atualizado!')
      } else {
        await api.post('/products', payload)
        toast.success('Produto criado!')
      }
      setModalOpen(false)
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await api.delete(`/products/${deleteId}`)
      toast.success('Produto removido')
      setDeleteId(null)
      load()
    } catch { toast.error('Erro ao excluir') }
    finally { setDeleting(false) }
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  const margin = (p: Product) => {
    if (!p.cost_price || !p.price) return null
    return (((Number(p.price) - Number(p.cost_price)) / Number(p.price)) * 100).toFixed(0)
  }

  if (loading) return <LoadingPage />

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-mocha-900">Produtos</h2>
          <p className="text-mocha-500 text-sm">{products.length} produto(s) cadastrados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView(v => v === 'list' ? 'chart' : 'list')}
            className="btn-secondary text-sm flex items-center gap-2">
            {view === 'list' ? '📊 Gráfico' : '📋 Lista'}
          </button>
          <Button onClick={openNew} icon={<Plus size={16} />}>Novo Produto</Button>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-yellow-600" />
            <p className="text-sm font-semibold text-yellow-800">{lowStock.length} produto(s) com estoque baixo</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(p => (
              <span key={p.id} className="text-xs bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full">
                {p.name}: {p.stock} un
              </span>
            ))}
          </div>
        </div>
      )}

      {view === 'chart' && products.length > 0 && (
        <div className="card">
          <h3 className="font-display font-semibold text-mocha-900 mb-4">Estoque por Produto</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={products.slice(0, 12).map(p => ({ name: p.name.slice(0, 16), stock: p.stock, min: p.min_stock }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e8dc" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9a7e5a' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9a7e5a' }} />
              <Tooltip contentStyle={{ background: '#2c1c12', color: '#fdf6f0', border: 'none', borderRadius: 12 }} />
              <Bar dataKey="stock" fill="#6F4F37" radius={[4, 4, 0, 0]} name="Estoque" />
              <Bar dataKey="min" fill="#D4B896" radius={[4, 4, 0, 0]} name="Mínimo" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mocha-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto..."
          className="input pl-10 w-full" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum produto encontrado" action={<Button onClick={openNew} icon={<Plus size={16} />}>Novo Produto</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => {
            const m = margin(p)
            const isLow = p.stock <= p.min_stock
            return (
              <div key={p.id} className="card card-hover group relative overflow-hidden">
                {/* status strip */}
                <div className={`absolute top-0 left-0 w-1 h-full ${p.is_active ? 'bg-green-400' : 'bg-mocha-300'}`} />
                <div className="pl-3">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <h4 className="font-display font-semibold text-mocha-900 truncate">{p.name}</h4>
                      {p.category_name && <p className="text-xs text-mocha-400">{p.category_name}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-cream-100 text-mocha-500"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display text-xl font-bold text-chocolate-700">{formatCurrency(Number(p.price))}</span>
                    {m && <Badge variant="success">Margem {m}%</Badge>}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isLow ? 'text-yellow-600' : 'text-sage-700'}`}>
                        {isLow && '⚠️ '}{p.stock} {p.unit}
                      </span>
                      {p.min_stock > 0 && <span className="text-mocha-300 text-xs">/ mín {p.min_stock}</span>}
                    </div>
                    {!p.is_active && <Badge variant="warning">Inativo</Badge>}
                  </div>
                  {/* Stock bar */}
                  {p.min_stock > 0 && (
                    <div className="mt-2 h-1.5 bg-cream-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${isLow ? 'bg-yellow-400' : 'bg-sage-400'}`}
                        style={{ width: `${Math.min(100, (p.stock / (p.min_stock * 3)) * 100)}%` }} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Editar Produto' : 'Novo Produto'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nome *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Ex: Bolo de Chocolate" />
          <Textarea label="Descrição" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva o produto..." />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Preço de venda (R$) *" type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
            <Input label="Custo (R$)" type="number" step="0.01" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))} />
            <Input label="Estoque" type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
            <Input label="Estoque mínimo" type="number" value={form.min_stock} onChange={e => setForm(f => ({ ...f, min_stock: e.target.value }))} />
            <Select label="Unidade" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              options={['unidade', 'par', 'caixa', 'kg', 'g', 'dúzia'].map(v => ({ value: v, label: v }))} />
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-chocolate-700" />
              <label htmlFor="active" className="text-sm text-mocha-700">Produto ativo</label>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{selected ? 'Atualizar' : 'Criar'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Excluir Produto" message="Tem certeza? Esta ação não pode ser desfeita." loading={deleting} />
    </div>
  )
}
