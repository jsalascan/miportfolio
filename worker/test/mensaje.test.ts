import { describe, it, expect } from "vitest"
import { escaparHtml, formatearMensaje } from "../src/mensaje"

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
