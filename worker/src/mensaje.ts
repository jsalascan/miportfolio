import type { DatosLimpios } from "./validacion"

export function escaparHtml(texto: string): string {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

export const LARGO_CITA = 500
const ASUNTO_RESPUESTA = "Re: tu mensaje desde jsalascan.github.io"

export type BotonTelegram =
  | { text: string; url: string }
  | { text: string; copy_text: { text: string } }

export type TecladoRespuesta = { inline_keyboard: BotonTelegram[][] }

function recortar(texto: string, maximo: number): string {
  return texto.length > maximo ? `${texto.slice(0, maximo)}…` : texto
}

function citar(mensaje: string): string {
  return recortar(mensaje, LARGO_CITA)
    .split("\n")
    .map((linea) => `> ${linea}`)
    .join("\n")
}

// Telegram no admite `mailto:` en los botones inline: solo http, https y tg://.
// Por eso el botón apunta a `/responder` del propio Worker, que devuelve un 302
// hacia el mailto y deja que el sistema abra la app de correo predeterminada.
//
// Aquí no se escapa HTML: estos valores viajan en una URL y en un campo JSON,
// donde `URLSearchParams` y `JSON.stringify` ya hacen el trabajo. Escapar dos
// veces dejaría `&amp;` literales en el borrador.
export function urlRespuesta(datos: DatosLimpios, base: string): string {
  const parametros = new URLSearchParams({
    to: datos.email,
    su: ASUNTO_RESPUESTA,
    body: `Hola ${datos.nombre}:\n\n\n\n${citar(datos.mensaje)}`,
  })

  return `${base}/responder?${parametros}`
}

export function construirTeclado(
  datos: DatosLimpios,
  base: string,
): TecladoRespuesta {
  return {
    inline_keyboard: [
      [
        { text: "✉️ Responder", url: urlRespuesta(datos, base) },
        { text: "📋 Copiar email", copy_text: { text: datos.email } },
      ],
    ],
  }
}

export function formatearMensaje(datos: DatosLimpios, verificado = true): string {
  const nombre = escaparHtml(datos.nombre)
  const email = escaparHtml(datos.email)
  const mensaje = escaparHtml(datos.mensaje)

  // La marca solo aparece cuando Turnstile no pudo pronunciarse: así se
  // distingue de un vistazo qué avisos pasaron el filtro y cuáles no.
  const cabecera = verificado
    ? ["📬 <b>Nuevo contacto - miportfolio</b>"]
    : ["⚠️ <i>Sin verificar</i>", "📬 <b>Nuevo contacto - miportfolio</b>"]

  return [
    ...cabecera,
    "",
    `<b>De:</b> ${nombre}`,
    `<b>Email:</b> ${email}`,
    "",
    mensaje,
  ].join("\n")
}
