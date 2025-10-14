// server/middleware/auth.global.ts
import jwt from "jsonwebtoken";
import { defineEventHandler, getCookie, setCookie, sendRedirect } from "h3";

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "authToken");
  if (!token) {
    // Protege rotas do dashboard se não há token
    if (event.node.req.url?.startsWith("/dashboard")) {
      await sendRedirect(event, "/login", 302);
    }
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    event.context.user = decoded;
  } catch (err) {
    // Token inválido: limpa cookie e redireciona se em rota protegida
    setCookie(event, "authToken", "", { maxAge: -1 });
    if (event.node.req.url?.startsWith("/dashboard")) {
      await sendRedirect(event, "/login", 302);
    }
  }
});
