import { getDB } from "../../../utils/db";
import { verifyUserToken } from "../../../utils/auth";
import { getRequestHeader, createError } from 'h3';
import { ObjectId } from 'mongodb';

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Token necessário' });
  try { verifyUserToken(token) } catch { throw createError({ statusCode: 401, statusMessage: 'Token inválido' }) }

  const id = getRouterParam(event, 'id');
  const body = await readBody(event);

  const db = await getDB();
  const coupons = db.collection("coupons");

  const updateFields: any = { updatedAt: new Date() };
  if (body.active !== undefined) updateFields.active = Boolean(body.active);
  if (body.code !== undefined) updateFields.code = body.code.trim().toUpperCase();
  if (body.type !== undefined) updateFields.type = body.type;
  if (body.value !== undefined) updateFields.value = parseFloat(body.value);
  if (body.minOrder !== undefined) updateFields.minOrder = parseFloat(body.minOrder) || 0;
  if (body.maxUses !== undefined) updateFields.maxUses = body.maxUses ? parseInt(body.maxUses) : null;
  if (body.expiresAt !== undefined) updateFields.expiresAt = body.expiresAt ? new Date(body.expiresAt + 'T23:59:59-03:00') : null;

  await coupons.updateOne({ _id: new ObjectId(id) }, { $set: updateFields });
  const updated = await coupons.findOne({ _id: new ObjectId(id) });
  return { ...updated, _id: updated._id.toString() };
});
