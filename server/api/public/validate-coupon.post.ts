import { getDB } from "../../utils/db";
import { createError } from 'h3';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { code, subtotal } = body;

  if (!code || !code.trim()) {
    throw createError({ statusCode: 400, message: 'Código do cupom obrigatório' });
  }

  const db = await getDB();
  const coupon = await db.collection("coupons").findOne({ code: code.trim().toUpperCase() });

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
