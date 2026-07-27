import type { DatosLimpios } from "./validacion"

export function escaparHtml(texto: string): string {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

export function formatearMensaje(datos: DatosLimpios): string {
  const nombre = escaparHtml(datos.nombre)
  const email = escaparHtml(datos.email)
  const mensaje = escaparHtml(datos.mensaje)

  return [
    "📬 <b>Nuevo contacto — miportfolio</b>",
    "",
    `<b>De:</b> ${nombre}`,
    `<b>Email:</b> ${email}`,
    "",
    mensaje,
  ].join("\n")
}
