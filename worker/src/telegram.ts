export async function enviarATelegram(
  texto: string,
  token: string,
  chatId: string,
  hacerPeticion: typeof fetch = fetch,
): Promise<void> {
  const respuesta = await hacerPeticion(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: texto,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    },
  )

  if (!respuesta.ok) {
    const detalle = await respuesta.text()
    throw new Error(`Telegram rechazó el mensaje: ${detalle}`)
  }
}
