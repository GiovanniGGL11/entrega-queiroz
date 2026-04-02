// middleware/auth.client.ts
export default defineNuxtRouteMiddleware((to) => {
  const cookie = useCookie("authToken");
  if (!cookie.value && to.path.startsWith("/dashboard")) {
    // Específico para dashboard
    return navigateTo("/login");
  }
});
