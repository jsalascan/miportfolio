import type { TecladoRespuesta } from "./mensaje"

export async function enviarATelegram(
  texto: string,
  token: string,
  chatId: string,
  tecladoRespuesta?: TecladoRespuesta,
  hacerPeticion: typeof fetch = fetch,
): Promise<void> {
  const cuerpo: Record<string, unknown> = {
    chat_id: chatId,
    text: texto,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  }

  if (tecladoRespuesta) {
    cuerpo.reply_markup = tecladoRespuesta
  }

  const respuesta = await hacerPeticion(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    },
  )

  if (!respuesta.ok) {
    const detalle = await respuesta.text()
    throw new Error(`Telegram rechazó el mensaje: ${detalle}`)
  }
}
