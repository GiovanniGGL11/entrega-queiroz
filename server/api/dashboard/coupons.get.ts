import { getDB } from "../../utils/db";
import { verifyUserToken } from "../../utils/auth";
import { getRequestHeader, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Token necessário' });
  try { verifyUserToken(token) } catch { throw createError({ statusCode: 401, statusMessage: 'Token inválido' }) }

  const db = await getDB();
  const coupons = await db.collection("coupons").find({}).sort({ createdAt: -1 }).toArray();
  return coupons.map((c: any) => ({ ...c, _id: c._id.toString() }));
});
