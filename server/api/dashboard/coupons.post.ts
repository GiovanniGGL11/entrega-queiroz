import { getDB } from "../../utils/db";
import { verifyUserToken } from "../../utils/auth";
import { getRequestHeader, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Token necessário' });
  try { verifyUserToken(token) } catch { throw createError({ statusCode: 401, statusMessage: 'Token inválido' }) }

  const body = await readBody(event);
  const { code, type, value, minOrder, maxUses, expiresAt } = body;

  if (!code || !code.trim()) throw createError({ statusCode: 400, message: 'Código obrigatório' });
  if (!['percentage', 'fixed'].includes(type)) throw createError({ statusCode: 400, message: 'Tipo inválido' });
  if (!value || isNaN(parseFloat(value)) || parseFloat(value) <= 0) throw createError({ statusCode: 400, message: 'Valor inválido' });
  if (type === 'percentage' && parseFloat(value) > 100) throw createError({ statusCode: 400, message: 'Percentual não pode ser maior que 100' });

  const db = await getDB();
  const coupons = db.collection("coupons");
  const cleanCode = code.trim().toUpperCase();

  const existing = await coupons.findOne({ code: cleanCode });
  if (existing) throw createError({ statusCode: 400, message: 'Já existe um cupom com esse código' });

  const coupon = {
    code: cleanCode,
    type,
    value: parseFloat(value),
    minOrder: parseFloat(minOrder) || 0,
    maxUses: maxUses ? parseInt(maxUses) : null,
    usedCount: 0,
    active: true,
    expiresAt: expiresAt ? new Date(expiresAt + 'T23:59:59-03:00') : null,
    createdAt: new Date()
  };

  const result = await coupons.insertOne(coupon);
  return { ...coupon, _id: result.insertedId.toString() };
});
