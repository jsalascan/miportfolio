import { describe, it, expect, vi } from "vitest"
import { enviarATelegram } from "../src/telegram"

function respuestaOk() {
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}

describe("enviarATelegram", () => {
  it("llama al endpoint sendMessage con el token en la ruta", async () => {
    const doble = vi.fn().mockResolvedValue(respuestaOk())
    await enviarATelegram("hola", "123:ABC", "999", doble as unknown as typeof fetch)

    const [url] = doble.mock.calls[0]
    expect(url).toBe("https://api.telegram.org/bot123:ABC/sendMessage")
  })

  it("envía el chat, el texto y el modo HTML en el cuerpo", async () => {
    const doble = vi.fn().mockResolvedValue(respuestaOk())
    await enviarATelegram("hola", "123:ABC", "999", doble as unknown as typeof fetch)

    const [, opciones] = doble.mock.calls[0]
    expect(opciones.method).toBe("POST")
    expect(JSON.parse(opciones.body)).toEqual({
      chat_id: "999",
      text: "hola",
      parse_mode: "HTML",
      disable_web_page_preview: true,
    })
  })

  it("lanza un error si Telegram responde con fallo", async () => {
    const doble = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: false, description: "chat not found" }), { status: 400 }),
    )

    await expect(
      enviarATelegram("hola", "123:ABC", "999", doble as unknown as typeof fetch),
    ).rejects.toThrow(/chat not found/)
  })
})
