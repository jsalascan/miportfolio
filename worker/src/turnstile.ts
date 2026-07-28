export type ResultadoTurnstile =
  | { estado: "valido" }
  | { estado: "rechazado" }
  | { estado: "indeterminado" }

const URL_VERIFICACION =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify"

const MS_ESPERA = 5000

// Tres estados y no un booleano: «el token es falso» y «no he podido
// comprobarlo» merecen respuestas distintas, y un booleano invita a tratarlos
// igual.
export async function verificarTurnstile(
  token: string,
  secreto: string,
  ip: string,
  hacerPeticion: typeof fetch = fetch,
): Promise<ResultadoTurnstile> {
  if (token === "") {
    return { estado: "rechazado" }
  }

  const cuerpo = new URLSearchParams({ secret: secreto, response: token })
  if (ip !== "") {
    cuerpo.set("remoteip", ip)
  }

  let respuesta: Response
  try {
    respuesta = await hacerPeticion(URL_VERIFICACION, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: cuerpo.toString(),
      signal: AbortSignal.timeout(MS_ESPERA),
    })
  } catch (error) {
    console.error("Turnstile no respondió:", error)
    return { estado: "indeterminado" }
  }

  if (!respuesta.ok) {
    console.error("Turnstile devolvió el estado", respuesta.status)
    return { estado: "indeterminado" }
  }

  let datos: { success?: boolean }
  try {
    datos = (await respuesta.json()) as { success?: boolean }
  } catch (error) {
    console.error("Respuesta de Turnstile ilegible:", error)
    return { estado: "indeterminado" }
  }

  return datos.success === true ? { estado: "valido" } : { estado: "rechazado" }
}
