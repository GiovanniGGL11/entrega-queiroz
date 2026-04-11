import { getDB } from "../../utils/db";
import { createError, getRequestHeader } from 'h3';
import { RateLimiter, InputValidator } from '../../utils/security';

export default defineEventHandler(async (event) => {
  const ip = getRequestHeader(event, 'x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  RateLimiter.enforce(`coupon:${ip}`, 20, 60_000)

  const body = await readBody(event);
  const code = InputValidator.validateRequiredString(body?.code, 'Código do cupom', 50).toUpperCase()
  const subtotal = body?.subtotal !== undefined ? InputValidator.validatePositiveNumber(body.subtotal, 'Subtotal', 0) : undefined

  const db = await getDB();
  const coupon = await db.collection("coupons").findOne({ code });

  if (!coupon) throw createError({ statusCode: 404, message: 'Cupom não encontrado' });
  if (!coupon.active) throw createError({ statusCode: 400, message: 'Cupom inativo' });
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))) {
    throw createError({ statusCode: 400, message: 'Cupom expirado' });
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw createError({ statusCode: 400, message: 'Cupom esgotado' });
  }
  if (subtotal !== undefined && subtotal < coupon.minOrder) {
    throw createError({ statusCode: 400, message: `Pedido mínimo para este cupom: R$ ${coupon.minOrder.toFixed(2).replace('.', ',')}` });
  }

  let discountAmount = 0;
  if (coupon.type === 'percentage') {
    discountAmount = (subtotal || 0) * (coupon.value / 100);
  } else {
    discountAmount = coupon.value;
  }

  return {
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    minOrder: coupon.minOrder
  };
});
