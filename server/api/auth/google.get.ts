import { sendRedirect } from 'h3'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()

  const params = new URLSearchParams({
    client_id: config.googleClientId as string,
    redirect_uri: config.googleRedirectUri as string,
    response_type: 'code',
    scope: 'email profile',
    access_type: 'offline',
    prompt: 'select_account'
  })

  return sendRedirect(event, `https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})
