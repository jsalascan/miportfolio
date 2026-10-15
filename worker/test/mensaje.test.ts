import { describe, it, expect } from "vitest"
import {
  escaparHtml,
  formatearMensaje,
  urlRespuesta,
  construirTeclado,
  LARGO_CITA,
} from "../src/mensaje"

const DATOS = {
  nombre: "María López",
  email: "maria@ejemplo.com",
  mensaje: "Me interesa hablar contigo.",
}

describe("escaparHtml", () => {
  it("escapa los tres caracteres que rompen el HTML de Telegram", () => {
    expect(escaparHtml('<b>Ana</b> & "Co"')).toBe("&lt;b&gt;Ana&lt;/b&gt; &amp; \"Co\"")
  })

  it("escapa el ampersand antes que los ángulos", () => {
    expect(escaparHtml("&lt;")).toBe("&amp;lt;")
  })

  it("deja intacto un texto sin caracteres especiales", () => {
    expect(escaparHtml("Hola María")).toBe("Hola María")
  })
})

describe("formatearMensaje", () => {
  const datos = {
    nombre: "María López",
    email: "maria@ejemplo.com",
    mensaje: "Me interesa hablar contigo.",
  }

  it("incluye nombre, email y mensaje", () => {
    const texto = formatearMensaje(datos)
    expect(texto).toContain("María López")
    expect(texto).toContain("maria@ejemplo.com")
    expect(texto).toContain("Me interesa hablar contigo.")
  })

  it("identifica el origen del mensaje", () => {
    expect(formatearMensaje(datos)).toContain("miportfolio")
  })

  it("neutraliza el HTML incrustado en el nombre", () => {
    const texto = formatearMensaje({ ...datos, nombre: "<script>alert(1)</script>" })
    expect(texto).not.toContain("<script>")
    expect(texto).toContain("&lt;script&gt;")
  })

  it("neutraliza el HTML incrustado en el mensaje", () => {
    const texto = formatearMensaje({ ...datos, mensaje: "mira esto <img src=x>" })
    expect(texto).toContain("&lt;img src=x&gt;")
  })
})

describe("formatearMensaje con verificación", () => {
  it("no marca nada cuando el envío está verificado", () => {
    expect(formatearMensaje(DATOS, true)).not.toContain("Sin verificar")
  })

  it("antepone un aviso cuando no se pudo verificar", () => {
    const texto = formatearMensaje(DATOS, false)

    expect(texto.split("\n")[0]).toBe("⚠️ <i>Sin verificar</i>")
    expect(texto).toContain("📬 <b>Nuevo contacto - miportfolio</b>")
  })
})

const BASE = "https://buzon.workers.dev"

describe("urlRespuesta", () => {
  it("apunta al endpoint /responder del propio Worker", () => {
    const url = new URL(urlRespuesta(DATOS, BASE))

    expect(url.origin + url.pathname).toBe("https://buzon.workers.dev/responder")
    expect(url.searchParams.get("to")).toBe("maria@ejemplo.com")
  })

  it("prepara el asunto y cita el mensaje original", () => {
    const url = new URL(urlRespuesta(DATOS, BASE))

    expect(url.searchParams.get("su")).toBe("Re: tu mensaje desde jsalascan.github.io")
    const cuerpo = url.searchParams.get("body") ?? ""
    expect(cuerpo).toContain("Hola María López")
    expect(cuerpo).toContain("> Me interesa hablar contigo.")
  })

  it("cita cada línea del mensaje por separado", () => {
    const url = new URL(urlRespuesta({ ...DATOS, mensaje: "Una\nDos" }, BASE))
    const cuerpo = url.searchParams.get("body") ?? ""

    expect(cuerpo).toContain("> Una\n> Dos")
  })

  it("recorta la cita cuando el mensaje es muy largo", () => {
    const largo = "a".repeat(LARGO_CITA + 200)
    const url = new URL(urlRespuesta({ ...DATOS, mensaje: largo }, BASE))
    const cuerpo = url.searchParams.get("body") ?? ""

    expect(cuerpo).toContain("…")
    expect(cuerpo).not.toContain("a".repeat(LARGO_CITA + 1))
  })
})

describe("construirTeclado", () => {
  it("ofrece un botón de respuesta y otro de copiar email", () => {
    const [fila] = construirTeclado(DATOS, BASE).inline_keyboard
    const [responder, copiar] = fila

    expect(responder).toEqual({
      text: "✉️ Responder",
      url: urlRespuesta(DATOS, BASE),
    })
    expect(copiar).toEqual({
      text: "📋 Copiar email",
      copy_text: { text: "maria@ejemplo.com" },
    })
  })

  it("mantiene la etiqueta corta sea cual sea el nombre", () => {
    const teclado = construirTeclado({ ...DATOS, nombre: "N".repeat(60) }, BASE)
    const [[responder]] = teclado.inline_keyboard

    expect(responder.text).toBe("✉️ Responder")
  })
})
