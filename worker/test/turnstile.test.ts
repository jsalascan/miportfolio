import { describe, it, expect, vi } from "vitest"
import { verificarTurnstile } from "../src/turnstile"

function respuesta(cuerpo: unknown, estado = 200) {
  return new Response(JSON.stringify(cuerpo), { status: estado })
}

describe("verificarTurnstile", () => {
  it("acepta el token cuando Turnstile confirma", async () => {
    const doble = vi.fn().mockResolvedValue(respuesta({ success: true }))
    const salida = await verificarTurnstile("tok", "sec", "1.2.3.4", doble as unknown as typeof fetch)

    expect(salida).toEqual({ estado: "valido" })
  })

  it("envía secret, response y remoteip al endpoint de siteverify", async () => {
    const doble = vi.fn().mockResolvedValue(respuesta({ success: true }))
    await verificarTurnstile("tok", "sec", "1.2.3.4", doble as unknown as typeof fetch)

    const [url, opciones] = doble.mock.calls[0]
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify")

    const enviado = new URLSearchParams(opciones.body as string)
    expect(enviado.get("secret")).toBe("sec")
    expect(enviado.get("response")).toBe("tok")
    expect(enviado.get("remoteip")).toBe("1.2.3.4")
  })

  it("rechaza cuando Turnstile responde que no", async () => {
    const doble = vi.fn().mockResolvedValue(
      respuesta({ success: false, "error-codes": ["invalid-input-response"] }),
    )
    const salida = await verificarTurnstile("tok", "sec", "", doble as unknown as typeof fetch)

    expect(salida).toEqual({ estado: "rechazado" })
  })

  it("rechaza sin salir a la red si no hay token", async () => {
    const doble = vi.fn()
    const salida = await verificarTurnstile("", "sec", "", doble as unknown as typeof fetch)

    expect(salida).toEqual({ estado: "rechazado" })
    expect(doble).not.toHaveBeenCalled()
  })

  it("queda indeterminado si la petición falla", async () => {
    const doble = vi.fn().mockRejectedValue(new Error("network"))
    const salida = await verificarTurnstile("tok", "sec", "", doble as unknown as typeof fetch)

    expect(salida).toEqual({ estado: "indeterminado" })
  })

  it("queda indeterminado ante un 5xx de Cloudflare", async () => {
    const doble = vi.fn().mockResolvedValue(respuesta({}, 503))
    const salida = await verificarTurnstile("tok", "sec", "", doble as unknown as typeof fetch)

    expect(salida).toEqual({ estado: "indeterminado" })
  })

  it("queda indeterminado si la respuesta no es JSON", async () => {
    const doble = vi.fn().mockResolvedValue(new Response("<html>", { status: 200 }))
    const salida = await verificarTurnstile("tok", "sec", "", doble as unknown as typeof fetch)

    expect(salida).toEqual({ estado: "indeterminado" })
  })

  it("omite remoteip cuando no se conoce la IP", async () => {
    const doble = vi.fn().mockResolvedValue(respuesta({ success: true }))
    await verificarTurnstile("tok", "sec", "", doble as unknown as typeof fetch)

    const [, opciones] = doble.mock.calls[0]
    expect(new URLSearchParams(opciones.body as string).has("remoteip")).toBe(false)
  })
})
