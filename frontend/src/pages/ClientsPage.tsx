import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, Phone, Mail, Star, ShoppingBag } from 'lucide-react'
import api from '../services/api'
import { Client } from '../types'
import { formatCurrency, formatDate } from '../utils'
import { LoadingPage, Modal, Button, Input, Textarea, EmptyState, ConfirmDialog, Table } from '../components/ui'
import toast from 'react-hot-toast'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<Client | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({ name: '', email: '', phone: '', birthday: '', address: '', notes: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/clients')
      setClients(res.data.data)
    } catch { toast.error('Erro ao carregar clientes') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() {
    setSelected(null)
    setForm({ name: '', email: '', phone: '', birthday: '', address: '', notes: '' })
    setModalOpen(true)
  }

  function openEdit(c: Client) {
    setSelected(c)
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', birthday: c.birthday?.slice(0, 10) || '', address: c.address || '', notes: c.notes || '' })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, birthday: form.birthday || undefined, email: form.email || undefined, phone: form.phone || undefined }
      if (selected) {
        await api.put(`/clients/${selected.id}`, payload)
        toast.success('Cliente atualizado!')
      } else {
        await api.post('/clients', payload)
        toast.success('Cliente cadastrado!')
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
      await api.delete(`/clients/${deleteId}`)
      toast.success('Cliente removido')
      setDeleteId(null)
      load()
    } catch { toast.error('Erro ao excluir') }
    finally { setDeleting(false) }
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  // Top clients by spent
  const topClients = [...clients].sort((a, b) => Number(b.total_spent) - Number(a.total_spent)).slice(0, 3)

  if (loading) return <LoadingPage />

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-mocha-900">Clientes</h2>
          <p className="text-mocha-500 text-sm">{clients.length} cliente(s) cadastrados</p>
        </div>
        <Button onClick={openNew} icon={<Plus size={16} />}>Novo Cliente</Button>
      </div>

      {/* Top 3 VIPs */}
      {topClients.length > 0 && Number(topClients[0].total_spent) > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {topClients.map((c, i) => (
            <div key={c.id} className={`card card-hover flex items-center gap-3 animate-slide-up`} style={{ animationDelay: `${i * 80}ms` }}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-cream-50 font-bold text-lg flex-shrink-0 ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-mocha-400' : 'bg-cream-500'}`}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-mocha-900 truncate text-sm">{c.name}</p>
                <p className="text-xs text-mocha-400">{c.total_orders} pedidos</p>
                <p className="text-sm font-bold text-chocolate-700">{formatCurrency(Number(c.total_spent))}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mocha-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, email ou telefone..."
          className="input pl-10 w-full" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum cliente encontrado" description="Cadastre clientes para fidelizá-los"
          action={<Button onClick={openNew} icon={<Plus size={16} />}>Novo Cliente</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="card card-hover group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-chocolate-800 flex items-center justify-center text-cream-50 font-bold flex-shrink-0">
                    {c.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-display font-semibold text-mocha-900">{c.name}</p>
                    {c.birthday && <p className="text-xs text-mocha-400">🎂 {formatDate(c.birthday)}</p>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-cream-100 text-mocha-500"><Pencil size={13} /></button>
                  <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={13} /></button>
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-sm text-mocha-600 hover:text-chocolate-700 transition-colors">
                    <Phone size={13} className="text-mocha-400" />{c.phone}
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-sm text-mocha-600 hover:text-chocolate-700 transition-colors truncate">
                    <Mail size={13} className="text-mocha-400 flex-shrink-0" /><span className="truncate">{c.email}</span>
                  </a>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-cream-100">
                <div className="flex items-center gap-1.5 text-xs text-mocha-500">
                  <ShoppingBag size={12} /><span>{c.total_orders} pedidos</span>
                </div>
                <span className="text-sm font-bold text-sage-700">{formatCurrency(Number(c.total_spent))}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Editar Cliente' : 'Novo Cliente'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nome *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="Telefone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" />
            <Input label="Aniversário 🎂" type="date" value={form.birthday} onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))} />
          </div>
          <Input label="Endereço" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          <Textarea label="Observações" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Preferências, alergias, etc." />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{selected ? 'Atualizar' : 'Cadastrar'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Excluir Cliente" message="Tem certeza? Os pedidos do cliente serão mantidos." loading={deleting} />
    </div>
  )
}
