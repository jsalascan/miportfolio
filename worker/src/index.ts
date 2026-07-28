import { validarEnvio } from "./validacion"
import { formatearMensaje, construirTeclado } from "./mensaje"
import type { TecladoRespuesta } from "./mensaje"
import { enviarATelegram } from "./telegram"
import { mailtoDesdeParametros } from "./respuesta"
import { verificarTurnstile } from "./turnstile"
import type { ResultadoTurnstile } from "./turnstile"

export interface Entorno {
  BOT_TOKEN: string
  CHAT_ID: string
  TURNSTILE_SECRET: string
  LIMITADOR: RateLimit
}

export const ORIGENES_PERMITIDOS: readonly string[] = [
  "https://jsalascan.github.io",
  "http://localhost:4321",
]

type Enviar = (
  texto: string,
  token: string,
  chatId: string,
  teclado?: TecladoRespuesta,
) => Promise<void>

const enviarPorDefecto: Enviar = (texto, token, chatId, teclado) =>
  enviarATelegram(texto, token, chatId, teclado)

type Verificar = (
  token: string,
  secreto: string,
  ip: string,
) => Promise<ResultadoTurnstile>

function cabeceras(origen: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origen,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

function json(cuerpo: unknown, estado: number, origen: string): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: cabeceras(origen),
  })
}

// La inyección de `enviar` vive aquí y no en `fetch`: Cloudflare invoca
// `fetch(peticion, entorno, contexto)` y su tercer argumento pisaría cualquier
// parámetro que pusiéramos en esa posición.
export async function manejar(
  peticion: Request,
  entorno: Entorno,
  enviar: Enviar = enviarPorDefecto,
  verificar: Verificar = verificarTurnstile,
): Promise<Response> {
  const direccion = new URL(peticion.url)

  // Va antes que el resto de comprobaciones: es una navegación que llega desde
  // el botón de Telegram, sin cabecera `Origin` y sin cuerpo que validar.
  if (peticion.method === "GET" && direccion.pathname === "/responder") {
    const destino = mailtoDesdeParametros(direccion.searchParams)

    if (destino === null) {
      return new Response("Enlace de respuesta no válido", { status: 400 })
    }

    return new Response(null, { status: 302, headers: { Location: destino } })
  }

  const origen = peticion.headers.get("Origin") ?? ""

  if (!ORIGENES_PERMITIDOS.includes(origen)) {
    return new Response(JSON.stringify({ error: "Origen no permitido" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (peticion.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cabeceras(origen) })
  }

  if (peticion.method !== "POST") {
    return json({ error: "Método no permitido" }, 405, origen)
  }

  // Antes de leer el cuerpo: así una avalancha de payloads grandes no llega
  // siquiera a consumir el parseo.
  const ip = peticion.headers.get("CF-Connecting-IP") ?? ""
  const { success } = await entorno.LIMITADOR.limit({ key: ip })

  if (!success) {
    return json({ error: "Demasiados envíos. Espera un minuto." }, 429, origen)
  }

  let cuerpo: unknown
  try {
    cuerpo = await peticion.json()
  } catch {
    return json({ error: "Cuerpo ilegible" }, 400, origen)
  }

  const resultado = validarEnvio(cuerpo, Date.now())

  // El spam recibe una confirmación falsa: un error le enseñaría al bot
  // que fue detectado y le invitaría a reintentar con otra forma.
  if (resultado.estado === "descartado") {
    return json({ ok: true }, 200, origen)
  }

  if (resultado.estado === "invalido") {
    return json({ error: resultado.error, campo: resultado.campo }, 400, origen)
  }

  // Turnstile va al final de la cadena por ser la única comprobación que sale
  // a la red: los envíos que ya fallan por otro motivo no la gastan.
  const campos = cuerpo as Record<string, unknown>
  const token =
    typeof campos.turnstileToken === "string" ? campos.turnstileToken : ""
  const verificacion = await verificar(token, entorno.TURNSTILE_SECRET, ip)

  if (verificacion.estado === "rechazado") {
    return json({ error: "Verificación fallida" }, 403, origen)
  }

  // Si Turnstile no responde el mensaje pasa igualmente: esa caída no la
  // provoca un atacante y las demás capas ya se han aplicado. Rechazarlo solo
  // costaría contactos legítimos.
  const verificado = verificacion.estado === "valido"

  try {
    await enviar(
      formatearMensaje(resultado.datos, verificado),
      entorno.BOT_TOKEN,
      entorno.CHAT_ID,
      construirTeclado(resultado.datos, direccion.origin),
    )
  } catch (error) {
    // El detalle se registra en los logs del Worker, nunca se devuelve al
    // cliente: sin esto, un 502 no da ninguna pista de qué falló.
    console.error("Fallo al entregar en Telegram:", error)
    return json({ error: "No se pudo entregar el mensaje" }, 502, origen)
  }

  return json({ ok: true }, 200, origen)
}

export default {
  // Solo dos parámetros a propósito: el `contexto` que Cloudflare pasa como
  // tercero se ignora, y así nunca puede colarse en el hueco de `enviar`.
  fetch(peticion: Request, entorno: Entorno): Promise<Response> {
    return manejar(peticion, entorno)
  },
}
