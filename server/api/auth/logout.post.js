// server/api/auth/logout.post.js
export default defineEventHandler((event) => {
  setCookie(event, "authToken", "", { maxAge: -1 });
  return { success: true };
});
