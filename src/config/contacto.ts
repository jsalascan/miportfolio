// URL del Cloudflare Worker que reenvía el formulario a Telegram.
// No es un secreto: el navegador la necesita para hacer la petición.
export const ENDPOINT_CONTACTO = "https://buzon-contacto.miportfoliocan.workers.dev"

// Clave pública del widget de Turnstile. Tampoco es un secreto: viaja en el
// HTML. La pareja privada vive como secreto del Worker (TURNSTILE_SECRET).
export const TURNSTILE_SITE_KEY = "0x4AAAAAAEAFGvU7AL-LAER9"
