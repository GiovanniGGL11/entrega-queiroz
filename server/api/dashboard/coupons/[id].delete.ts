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
  const db = await getDB();
  await db.collection("coupons").deleteOne({ _id: new ObjectId(id) });
  return { ok: true };
});
