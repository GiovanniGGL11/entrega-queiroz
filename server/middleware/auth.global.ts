// server/middleware/auth.global.ts
import jwt from "jsonwebtoken";
import { defineEventHandler, getCookie, setCookie } from "h3";

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "authToken");
  if (!token) {
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    event.context.user = decoded;
  } catch (err) {
    setCookie(event, "authToken", "", { maxAge: -1 });
  }
});
