import { validarEnvio } from "./validacion"
import { formatearMensaje } from "./mensaje"
import { enviarATelegram } from "./telegram"

export interface Entorno {
  BOT_TOKEN: string
  CHAT_ID: string
}

export const ORIGENES_PERMITIDOS: readonly string[] = [
  "https://jsalascan.github.io",
  "http://localhost:4321",
]

type Enviar = (texto: string, token: string, chatId: string) => Promise<void>

const enviarPorDefecto: Enviar = (texto, token, chatId) =>
  enviarATelegram(texto, token, chatId)

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
): Promise<Response> {
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

  try {
    await enviar(
      formatearMensaje(resultado.datos),
      entorno.BOT_TOKEN,
      entorno.CHAT_ID,
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
