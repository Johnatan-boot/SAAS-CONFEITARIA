import { listOrders, findOrderById, createOrder, addOrderItem, updateOrderStatus, updateOrder, deleteOrder } from './order.repository'
import { findProductById } from '../products/product.repository'
import { updateClientStats } from '../clients/client.repository'
import { db } from '../../database/connection'
import { NotFoundError, AppError } from '../../shared/errors/appError'

export async function listOrdersService(tenantId: number, filters?: any) {
  return listOrders(tenantId, filters)
}

export async function getOrderService(id: number, tenantId: number) {
  const order = await findOrderById(id, tenantId)
  if (!order) throw new NotFoundError('Pedido')
  return order
}

export async function createOrderService(tenantId: number, userId: number, data: {
  client_id?: number
  items: Array<{ product_id?: number; product_name?: string; quantity: number; unit_price?: number; notes?: string }>
  delivery_date?: string
  delivery_type?: string
  delivery_address?: string
  discount?: number
  notes?: string
}) {
  let subtotal = 0
  const resolvedItems = []

  for (const item of data.items) {
    let unit_price = item.unit_price || 0
    let product_name = item.product_name || 'Item avulso'

    if (item.product_id) {
      const product = await findProductById(item.product_id, tenantId)
      if (!product) throw new NotFoundError(`Produto #${item.product_id}`)
      unit_price = unit_price || Number(product.price)
      product_name = product.name
    }
    subtotal += item.quantity * unit_price
    resolvedItems.push({ ...item, unit_price, product_name })
  }

  const discount = data.discount || 0
  const total = subtotal - discount

  const orderId = await createOrder({
    ...data, tenant_id: tenantId, user_id: userId,
    subtotal, discount, total
  })

  for (const item of resolvedItems) {
    await addOrderItem(orderId, item)
  }

  if (data.client_id) await updateClientStats(data.client_id)

  return findOrderById(orderId, tenantId)
}

export async function updateOrderStatusService(id: number, tenantId: number, status: string) {
  const order = await findOrderById(id, tenantId)
  if (!order) throw new NotFoundError('Pedido')
  const validStatus = ['pending','confirmed','in_production','ready','delivered','cancelled']
  if (!validStatus.includes(status)) throw new AppError('Status inválido')
  await updateOrderStatus(id, tenantId, status)
  if (status === 'delivered' && order.client_id) await updateClientStats(order.client_id)
  return findOrderById(id, tenantId)
}

export async function updateOrderService(id: number, tenantId: number, data: any) {
  if (!await findOrderById(id, tenantId)) throw new NotFoundError('Pedido')
  await updateOrder(id, tenantId, data)
  return findOrderById(id, tenantId)
}

export async function deleteOrderService(id: number, tenantId: number) {
  if (!await findOrderById(id, tenantId)) throw new NotFoundError('Pedido')
  await deleteOrder(id, tenantId)
}
