import { describe, it, expect, vi } from "vitest"
import trabajador, { manejar } from "../src/index"
import { enviarATelegram } from "../src/telegram"

// Sustituye la salida de red del export por defecto, que no recibe la función
// de envío por parámetro.
vi.mock("../src/telegram", () => ({
  enviarATelegram: vi.fn().mockResolvedValue(undefined),
}))

const ENTORNO = { BOT_TOKEN: "123:ABC", CHAT_ID: "999" }
const ORIGEN = "https://jsalascan.github.io"
const AHORA = Date.now()

function peticion(cuerpo: unknown, opciones: { origen?: string; metodo?: string } = {}) {
  return new Request("https://buzon.workers.dev/", {
    method: opciones.metodo ?? "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: opciones.origen ?? ORIGEN,
    },
    body: opciones.metodo === "GET" ? undefined : JSON.stringify(cuerpo),
  })
}

const VALIDO = {
  nombre: "María López",
  email: "maria@ejemplo.com",
  mensaje: "Me interesa hablar contigo sobre un proyecto.",
  _hp: "",
  _t: AHORA - 10_000,
}

describe("handler del worker", () => {
  it("acepta un envío válido y devuelve ok", async () => {
    const enviar = vi.fn().mockResolvedValue(undefined)
    const respuesta = await manejar(peticion(VALIDO), ENTORNO, enviar)

    expect(respuesta.status).toBe(200)
    expect(await respuesta.json()).toEqual({ ok: true })
    expect(enviar).toHaveBeenCalledOnce()
  })

  it("incluye la cabecera CORS del origen permitido", async () => {
    const enviar = vi.fn().mockResolvedValue(undefined)
    const respuesta = await manejar(peticion(VALIDO), ENTORNO, enviar)

    expect(respuesta.headers.get("Access-Control-Allow-Origin")).toBe(ORIGEN)
  })

  it("permite también el servidor de desarrollo", async () => {
    const enviar = vi.fn().mockResolvedValue(undefined)
    const respuesta = await manejar(
      peticion(VALIDO, { origen: "http://localhost:4321" }),
      ENTORNO,
      enviar,
    )

    expect(respuesta.status).toBe(200)
  })

  it("rechaza un origen desconocido con 403", async () => {
    const enviar = vi.fn()
    const respuesta = await manejar(
      peticion(VALIDO, { origen: "https://sitio-ajeno.example" }),
      ENTORNO,
      enviar,
    )

    expect(respuesta.status).toBe(403)
    expect(enviar).not.toHaveBeenCalled()
  })

  it("responde 204 al preflight", async () => {
    const respuesta = await manejar(
      peticion(null, { metodo: "OPTIONS" }),
      ENTORNO,
      vi.fn(),
    )

    expect(respuesta.status).toBe(204)
    expect(respuesta.headers.get("Access-Control-Allow-Methods")).toContain("POST")
  })

  it("rechaza GET con 405", async () => {
    const respuesta = await manejar(
      peticion(null, { metodo: "GET" }),
      ENTORNO,
      vi.fn(),
    )

    expect(respuesta.status).toBe(405)
  })

  it("finge éxito y no envía nada cuando el honeypot está relleno", async () => {
    const enviar = vi.fn()
    const respuesta = await manejar(
      peticion({ ...VALIDO, _hp: "spam" }),
      ENTORNO,
      enviar,
    )

    expect(respuesta.status).toBe(200)
    expect(await respuesta.json()).toEqual({ ok: true })
    expect(enviar).not.toHaveBeenCalled()
  })

  it("devuelve 400 y el campo culpable cuando un dato es inválido", async () => {
    const enviar = vi.fn()
    const respuesta = await manejar(
      peticion({ ...VALIDO, email: "no-es-un-email" }),
      ENTORNO,
      enviar,
    )

    expect(respuesta.status).toBe(400)
    expect(await respuesta.json()).toMatchObject({ campo: "email" })
    expect(enviar).not.toHaveBeenCalled()
  })

  it("devuelve 400 si el cuerpo no es JSON válido", async () => {
    const rota = new Request("https://buzon.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: ORIGEN },
      body: "{esto no es json",
    })

    const respuesta = await manejar(rota, ENTORNO, vi.fn())
    expect(respuesta.status).toBe(400)
  })

  it("devuelve 502 si Telegram falla", async () => {
    const enviar = vi.fn().mockRejectedValue(new Error("chat not found"))
    const respuesta = await manejar(peticion(VALIDO), ENTORNO, enviar)

    expect(respuesta.status).toBe(502)
    expect(await respuesta.json()).toMatchObject({ error: expect.any(String) })
  })

  it("no filtra el detalle del error de Telegram al cliente", async () => {
    const enviar = vi.fn().mockRejectedValue(new Error("bot token 123:ABC inválido"))
    const respuesta = await manejar(peticion(VALIDO), ENTORNO, enviar)

    expect(JSON.stringify(await respuesta.json())).not.toContain("123:ABC")
  })
})

describe("export por defecto, invocado como lo hace Cloudflare", () => {
  // Cloudflare llama a fetch(peticion, entorno, contexto). Si el handler
  // aceptase la función de envío en esa tercera posición, el contexto la
  // pisaría y el envío reventaría con "enviar is not a function".
  const contexto = { waitUntil: () => {}, passThroughOnException: () => {} }

  it("ignora el tercer argumento del runtime y entrega el mensaje", async () => {
    vi.mocked(enviarATelegram).mockClear()

    const respuesta = await (trabajador.fetch as unknown as (
      p: Request,
      e: typeof ENTORNO,
      c: unknown,
    ) => Promise<Response>)(peticion(VALIDO), ENTORNO, contexto)

    expect(respuesta.status).toBe(200)
    expect(await respuesta.json()).toEqual({ ok: true })
    expect(enviarATelegram).toHaveBeenCalledOnce()
  })
})
