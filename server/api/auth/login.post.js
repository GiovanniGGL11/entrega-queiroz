// server/api/auth/login.post.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDB } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, password } = body;

  try {
    const db = await getDB();
    const users = db.collection("users");

    const user = await users.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw createError({
        statusCode: 401,
        statusMessage: "Credenciais inválidas",
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return { token };
  } catch (err) {
    if (err.statusCode) throw err;
    throw createError({
      statusCode: 500,
      statusMessage: "Erro interno do servidor",
    });
  }
});
