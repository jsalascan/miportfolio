# miportfolio

Mi portfolio personal (ahora sí, actualizado)

**Demo: [jsalascan.github.io/miportfolio](https://jsalascan.github.io/miportfolio/)**

---

## Stack

| Tecnología | Uso |
|---|---|
| [Astro](https://astro.build) | Framework principal (salida estática) |
| [Tailwind CSS v4](https://tailwindcss.com) | Estilos y tokens del tema |
| [GitHub Pages](https://pages.github.com) | Hosting |
| [GitHub Actions](https://github.com/features/actions) | CI/CD — deploy automático en cada push a `main` |

## Desarrollo

```bash
pnpm install   # instalar dependencias
pnpm dev       # servidor de desarrollo en http://localhost:4321/miportfolio
pnpm build     # build de producción en dist/
pnpm preview   # previsualizar el build
```

## Estructura

```
src/
├── components/     # Barra lateral, secciones de la página y formulario de contacto
├── config/         # Endpoint del buzón de contacto y clave pública de Turnstile
├── data/           # experience.js y projects.js — contenido editable sin tocar componentes
├── layouts/        # Layout base (SEO, Open Graph)
├── pages/          # index, 404 y páginas legales
├── styles/         # global.css — tokens de color (claro/oscuro) y estilos base
├── assets/fonts/   # Public Sans e IBM Plex Mono (OFL), en woff2
└── utils/          # helper de URLs con base path
worker/             # Cloudflare Worker del formulario de contacto (reenvía a Telegram)
```

## Deploy

Cada push a `main` dispara el workflow de GitHub Actions: build con pnpm + Node 24 y publicación en GitHub Pages. Configuración en [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
