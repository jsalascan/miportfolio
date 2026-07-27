import { describe, it, expect } from "vitest"
import { validarEnvio } from "../src/validacion"

const AHORA = 1_800_000_000_000
const CARGA = AHORA - 10_000

function envio(cambios: Record<string, unknown> = {}) {
  return {
    nombre: "María López",
    email: "maria@ejemplo.com",
    mensaje: "Me interesa hablar contigo sobre un proyecto.",
    _hp: "",
    _t: CARGA,
    ...cambios,
  }
}

describe("validarEnvio", () => {
  it("acepta un envío correcto y devuelve los datos recortados", () => {
    const resultado = validarEnvio(envio({ nombre: "  María López  " }), AHORA)
    expect(resultado).toEqual({
      estado: "valido",
      datos: {
        nombre: "María López",
        email: "maria@ejemplo.com",
        mensaje: "Me interesa hablar contigo sobre un proyecto.",
      },
    })
  })

  it("descarta si el honeypot viene relleno", () => {
    const resultado = validarEnvio(envio({ _hp: "http://spam.example" }), AHORA)
    expect(resultado).toEqual({ estado: "descartado", motivo: "honeypot" })
  })

  it("descarta si se envía en menos de 3 segundos", () => {
    const resultado = validarEnvio(envio({ _t: AHORA - 500 }), AHORA)
    expect(resultado).toEqual({ estado: "descartado", motivo: "timing" })
  })

  it("descarta si falta la marca de tiempo", () => {
    const resultado = validarEnvio(envio({ _t: undefined }), AHORA)
    expect(resultado).toEqual({ estado: "descartado", motivo: "timing" })
  })

  it("rechaza un nombre demasiado corto", () => {
    const resultado = validarEnvio(envio({ nombre: "A" }), AHORA)
    expect(resultado).toMatchObject({ estado: "invalido", campo: "nombre" })
  })

  it("rechaza un nombre demasiado largo", () => {
    const resultado = validarEnvio(envio({ nombre: "x".repeat(81) }), AHORA)
    expect(resultado).toMatchObject({ estado: "invalido", campo: "nombre" })
  })

  it("rechaza un email sin arroba", () => {
    const resultado = validarEnvio(envio({ email: "maria.ejemplo.com" }), AHORA)
    expect(resultado).toMatchObject({ estado: "invalido", campo: "email" })
  })

  it("rechaza un email sin dominio", () => {
    const resultado = validarEnvio(envio({ email: "maria@" }), AHORA)
    expect(resultado).toMatchObject({ estado: "invalido", campo: "email" })
  })

  it("rechaza un mensaje demasiado corto", () => {
    const resultado = validarEnvio(envio({ mensaje: "hola" }), AHORA)
    expect(resultado).toMatchObject({ estado: "invalido", campo: "mensaje" })
  })

  it("rechaza un mensaje que supera los 2000 caracteres", () => {
    const resultado = validarEnvio(envio({ mensaje: "x".repeat(2001) }), AHORA)
    expect(resultado).toMatchObject({ estado: "invalido", campo: "mensaje" })
  })

  it("rechaza un cuerpo que no es un objeto", () => {
    const resultado = validarEnvio("texto suelto", AHORA)
    expect(resultado).toMatchObject({ estado: "invalido" })
  })

  it("rechaza un cuerpo nulo", () => {
    const resultado = validarEnvio(null, AHORA)
    expect(resultado).toMatchObject({ estado: "invalido" })
  })
})
