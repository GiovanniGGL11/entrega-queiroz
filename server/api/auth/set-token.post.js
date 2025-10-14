// server/api/auth/set-token.post.js
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { token } = body;
  setCookie(event, "authToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60, // 24h
  });
  return { success: true };
});
