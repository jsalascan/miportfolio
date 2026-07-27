export type DatosLimpios = {
  nombre: string
  email: string
  mensaje: string
}

export type ResultadoValidacion =
  | { estado: "valido"; datos: DatosLimpios }
  | { estado: "invalido"; campo: string; error: string }
  | { estado: "descartado"; motivo: "honeypot" | "timing" }

export const LARGO_NOMBRE = { min: 2, max: 80 }
export const LARGO_MENSAJE = { min: 10, max: 2000 }
export const MS_MINIMOS = 3000

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : ""
}

export function validarEnvio(cuerpo: unknown, ahora: number): ResultadoValidacion {
  if (typeof cuerpo !== "object" || cuerpo === null) {
    return { estado: "invalido", campo: "cuerpo", error: "Formato no reconocido" }
  }

  const campos = cuerpo as Record<string, unknown>

  if (texto(campos._hp) !== "") {
    return { estado: "descartado", motivo: "honeypot" }
  }

  const marca = campos._t
  if (typeof marca !== "number" || ahora - marca < MS_MINIMOS) {
    return { estado: "descartado", motivo: "timing" }
  }

  const nombre = texto(campos.nombre)
  if (nombre.length < LARGO_NOMBRE.min || nombre.length > LARGO_NOMBRE.max) {
    return {
      estado: "invalido",
      campo: "nombre",
      error: `El nombre debe tener entre ${LARGO_NOMBRE.min} y ${LARGO_NOMBRE.max} caracteres`,
    }
  }

  const email = texto(campos.email)
  if (!FORMATO_EMAIL.test(email)) {
    return { estado: "invalido", campo: "email", error: "El email no parece válido" }
  }

  const mensaje = texto(campos.mensaje)
  if (mensaje.length < LARGO_MENSAJE.min || mensaje.length > LARGO_MENSAJE.max) {
    return {
      estado: "invalido",
      campo: "mensaje",
      error: `El mensaje debe tener entre ${LARGO_MENSAJE.min} y ${LARGO_MENSAJE.max} caracteres`,
    }
  }

  return { estado: "valido", datos: { nombre, email, mensaje } }
}
