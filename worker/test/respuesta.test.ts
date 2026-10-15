import { describe, it, expect } from "vitest"
import { mailtoDesdeParametros } from "../src/respuesta"

function params(entradas: Record<string, string>) {
  return new URLSearchParams(entradas)
}

describe("mailtoDesdeParametros", () => {
  it("construye el mailto con destinatario, asunto y cuerpo", () => {
    const salida = mailtoDesdeParametros(
      params({ to: "maria@ejemplo.com", su: "Re: hola", body: "Hola María" }),
    )

    expect(salida).toBe(
      "mailto:maria@ejemplo.com?subject=Re%3A%20hola&body=Hola%20Mar%C3%ADa",
    )
  })

  it("escapa los saltos de línea del cuerpo", () => {
    const salida = mailtoDesdeParametros(
      params({ to: "a@b.com", su: "x", body: "Una\nDos" }),
    )

    expect(salida).toContain("body=Una%0ADos")
  })

  it("devuelve null si falta el destinatario", () => {
    expect(mailtoDesdeParametros(params({ su: "x", body: "y" }))).toBeNull()
  })

  it("devuelve null si el destinatario no parece un email", () => {
    expect(mailtoDesdeParametros(params({ to: "no-es-email" }))).toBeNull()
  })

  it("no deja colar una cabecera extra en el destinatario", () => {
    const salida = mailtoDesdeParametros(
      params({ to: "a@b.com?bcc=espia@mal.com", su: "x", body: "y" }),
    )

    expect(salida).toBeNull()
  })

  it("tolera que no haya asunto ni cuerpo", () => {
    expect(mailtoDesdeParametros(params({ to: "a@b.com" }))).toBe(
      "mailto:a@b.com?subject=&body=",
    )
  })
})
