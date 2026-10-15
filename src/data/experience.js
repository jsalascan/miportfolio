// Una entrada por empresa; `roles` en orden del más reciente al más antiguo,
// como en LinkedIn. `period` de la empresa abarca todos sus puestos.
export const experience = [
  {
    company: "Spring Hotels Group",
    period: "mar 2026 – actual",
    roles: [
      {
        role: "Analista Programador Web y Multimedia",
        period: "jun 2026 – actual",
        description:
          "Aplicación modular en Kotlin y Java para digitalizar la operativa del hotel (pisos, mantenimiento, animación), dentro del Programa Cataliza VIII. Acceso por NFC con roles y permisos, integración con APIs externas y publicación de versiones automatizada con GitHub Actions y runners.",
        tags: ["Kotlin", "Java", "NFC", "GitHub Actions", "CI/CD"],
      },
      {
        role: "Desarrollador de software (prácticas FP Dual, CFGS DAW)",
        period: "mar 2026 – may 2026",
        description:
          "Prácticas del segundo curso. Aplicaciones internas con Vue.js y Express.js: integración con bases de datos y APIs, pruebas, depuración y documentación, en equipo con metodología ágil.",
        tags: ["Vue.js", "Express.js", "APIs", "Bases de datos"],
      },
    ],
  },
  {
    company: "Xaicom Comunicaciones",
    period: "may 2025 – jun 2025",
    roles: [
      {
        role: "Desarrollador web (prácticas)",
        description:
          "Prácticas del primer curso. Webs en WordPress maquetadas con Bricks Builder, con formularios, SEO y adaptación a móvil. La principal fue la de SRG Maquinaria, preparada para que el cliente gestione su propio contenido.",
        tags: ["WordPress", "Bricks Builder", "SEO", "Responsive"],
      },
    ],
  },
  {
    company: "Bahía Príncipe Hotels & Resorts",
    period: "abr 2024 – jun 2024",
    roles: [
      {
        role: "Técnico informático (prácticas)",
        description:
          "Prácticas del CFGM SMR. Soporte técnico presencial en cuatro complejos (Explore Fantasia, Sunlight Costa Adeje, Escape Tenerife y Explore San Felipe): montaje y configuración de equipos, mantenimiento, incidencias y redes.",
        tags: ["Soporte IT", "Redes", "Hardware"],
      },
    ],
  },
]
