import React, { useEffect, useState, useCallback } from 'react'
import { CreditCard, Plus } from 'lucide-react'
import api from '../services/api'
import { Payment } from '../types'
import { formatCurrency, formatDateTime, PAYMENT_METHOD_LABELS } from '../utils'
import { LoadingPage, Modal, Button, Input, Select, EmptyState, Badge, Table } from '../components/ui'
import toast from 'react-hot-toast'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ order_id: '', amount: '', method: 'pix', notes: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pmtRes, ordRes] = await Promise.all([
        api.get('/payments'),
        api.get('/orders?status=pending'),
      ])
      setPayments(pmtRes.data.data)
      setOrders(ordRes.data.data)
    } catch { toast.error('Erro ao carregar') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/payments', { order_id: Number(form.order_id), amount: Number(form.amount), method: form.method, notes: form.notes || undefined })
      toast.success('Pagamento registrado! ✅')
      setModalOpen(false)
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao registrar')
    } finally { setSaving(false) }
  }

  const totalReceived = payments.filter(p => p.status === 'paid').reduce((a, p) => a + Number(p.amount), 0)

  if (loading) return <LoadingPage />

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-mocha-900">Pagamentos</h2>
          <p className="text-mocha-500 text-sm">Total recebido: <span className="font-bold text-sage-700">{formatCurrency(totalReceived)}</span></p>
        </div>
        <Button onClick={() => setModalOpen(true)} icon={<Plus size={16} />}>Registrar Pagamento</Button>
      </div>

      {/* Method breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {['pix', 'cash', 'credit_card', 'debit_card'].map(method => {
          const total = payments.filter(p => p.method === method && p.status === 'paid').reduce((a, p) => a + Number(p.amount), 0)
          return (
            <div key={method} className="card text-center">
              <p className="text-xs text-mocha-400 mb-1">{PAYMENT_METHOD_LABELS[method]}</p>
              <p className="font-display font-bold text-mocha-900">{formatCurrency(total)}</p>
            </div>
          )
        })}
      </div>

      {payments.length === 0 ? (
        <EmptyState title="Nenhum pagamento" description="Registre o primeiro pagamento" action={<Button onClick={() => setModalOpen(true)} icon={<Plus size={16} />}>Registrar</Button>} />
      ) : (
        <Table headers={['Pedido', 'Cliente', 'Valor', 'Método', 'Data']}>
          {payments.map(p => (
            <tr key={p.id} className="table-tr">
              <td className="table-td font-mono text-xs font-semibold text-chocolate-700">{p.order_code}</td>
              <td className="table-td">{p.client_name || '—'}</td>
              <td className="table-td font-semibold text-sage-700">{formatCurrency(Number(p.amount))}</td>
              <td className="table-td"><Badge variant="info">{PAYMENT_METHOD_LABELS[p.method]}</Badge></td>
              <td className="table-td text-xs text-mocha-400">{formatDateTime(p.created_at)}</td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Pagamento">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Pedido pendente *" value={form.order_id} onChange={e => {
            const o = orders.find(o => o.id === Number(e.target.value))
            setForm(f => ({ ...f, order_id: e.target.value, amount: o ? String(o.total) : f.amount }))
          }}
            options={[{ value: '', label: 'Selecione...' }, ...orders.map(o => ({ value: o.id, label: `${o.code} — ${o.client_name || 'Avulso'} — ${formatCurrency(o.total)}` }))]} />
          <Input label="Valor (R$) *" type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
          <Select label="Método de pagamento" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
            options={Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Registrar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
