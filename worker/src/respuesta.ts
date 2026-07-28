// Telegram no admite `mailto:` en los botones inline, así que el botón apunta
// aquí por https y este endpoint redirige. El sistema operativo abre entonces
// la app de correo predeterminada del usuario, sea cual sea.

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function mailtoDesdeParametros(parametros: URLSearchParams): string | null {
  const destino = parametros.get("to") ?? ""

  // El formato se valida en serio: sin esto, un `to` con `?bcc=` colaría
  // cabeceras extra en el correo que se abre.
  if (!FORMATO_EMAIL.test(destino)) {
    return null
  }

  const asunto = encodeURIComponent(parametros.get("su") ?? "")
  const cuerpo = encodeURIComponent(parametros.get("body") ?? "")

  return `mailto:${destino}?subject=${asunto}&body=${cuerpo}`
}
