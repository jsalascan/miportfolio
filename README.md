# miportfolio

Mi portfolio personal (ahora sí, actualizado)

**Demo: [jsalascan.github.io/miportfolio](https://jsalascan.github.io/miportfolio/)**

---

## Stack

| Tecnología | Uso |
|---|---|
| [Astro](https://astro.build) | Framework principal (salida estática) |
| [Tailwind CSS v4](https://tailwindcss.com) | Estilos y tokens del tema |
| [Simple Icons](https://simpleicons.org) | Logos SVG del stack tecnológico |
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
├── components/     # Secciones de la página + Monigote.astro (todos los robots SVG)
├── data/           # experience.js y projects.js — contenido editable sin tocar componentes
├── layouts/        # Layout base (SEO, Open Graph, scripts globales)
├── pages/          # index y 404
├── styles/         # global.css — tokens del tema y keyframes de animación
├── assets/fonts/   # Urbanist (OFL) y ProFontWindows, en woff2
└── utils/          # helpers (reveal on scroll, URLs con base path)
```

## Deploy

Cada push a `main` dispara el workflow de GitHub Actions: build con pnpm + Node 24 y publicación en GitHub Pages. Configuración en [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
