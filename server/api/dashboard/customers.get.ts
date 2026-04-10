import { getDB } from "../../utils/db";
import { verifyUserToken } from "../../utils/auth";
import { getRequestHeader, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Token necessário' });
  try { verifyUserToken(token) } catch { throw createError({ statusCode: 401, statusMessage: 'Token inválido' }) }

  const db = await getDB();

  const customers = await db.collection('orders').aggregate([
    {
      $match: {
        status: { $nin: ['cancelled'] },
        'customerInfo.phone': { $exists: true, $ne: '' }
      }
    },
    {
      $group: {
        _id: '$customerInfo.phone',
        name: { $last: '$customerInfo.name' },
        email: { $last: '$customerInfo.email' },
        phone: { $first: '$customerInfo.phone' },
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' },
        lastOrder: { $max: '$createdAt' },
        firstOrder: { $min: '$createdAt' },
        addresses: {
          $addToSet: {
            address: '$deliveryInfo.address',
            neighborhood: '$deliveryInfo.neighborhood',
            city: '$deliveryInfo.city'
          }
        },
        orders: {
          $push: {
            id: { $toString: '$_id' },
            orderNumber: '$orderNumber',
            status: '$status',
            totalAmount: '$totalAmount',
            createdAt: '$createdAt',
            items: '$items'
          }
        }
      }
    },
    {
      $lookup: {
        from: 'customers',
        localField: 'phone',
        foreignField: 'phone',
        as: 'customerDoc'
      }
    },
    { $sort: { totalOrders: -1, lastOrder: -1 } }
  ]).toArray();

  return customers.map((c: any) => ({
    phone: c.phone,
    name: c.name || 'Sem nome',
    email: c.email || '',
    avatar: c.customerDoc?.[0]?.avatar || '',
    totalOrders: c.totalOrders,
    totalSpent: c.totalSpent || 0,
    lastOrder: c.lastOrder,
    firstOrder: c.firstOrder,
    addresses: (c.addresses || []).filter((a: any) => a.address),
    orders: (c.orders || [])
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)
  }));
});
