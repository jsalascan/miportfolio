# buzon-contacto

Cloudflare Worker que recibe el formulario de contacto del portfolio y lo
entrega en Telegram.

```bash
pnpm test     # vitest, sin red
pnpm dev      # wrangler dev
pnpm deploy   # wrangler deploy
```

## Puesta en marcha

### Secretos

```bash
npx wrangler secret put BOT_TOKEN
npx wrangler secret put CHAT_ID
npx wrangler secret put TURNSTILE_SECRET
```

### Turnstile

1. En el dashboard de Cloudflare, **Turnstile → Add widget**, modo *Managed*.
   Hostnames: `jsalascan.github.io` y `localhost`.
2. Copiar la **site key** a `src/config/contacto.ts` (`TURNSTILE_SITE_KEY`).
   Es pública y viaja en el HTML.
3. Guardar la **secret key** como `TURNSTILE_SECRET` (arriba).

Para desarrollo local sirven las claves de prueba de Cloudflare: site key
`1x00000000000000000000AA`, secreto `1x0000000000000000000000000000000AA`.

## Botón de responder

Cada aviso lleva un botón **Responder**. Telegram no admite `mailto:` en los
botones inline (solo `http`, `https` y `tg://`), así que el botón apunta a
`GET /responder?to=…&su=…&body=…` de este mismo Worker, que devuelve un 302
hacia el `mailto:`. El sistema abre entonces la app de correo predeterminada,
sea Gmail, Spark o la que sea.

Esa ruta se atiende antes que ninguna otra comprobación: llega como navegación
desde Telegram, sin cabecera `Origin` y sin cuerpo, y no consume el rate limit.
El destinatario se valida contra el formato de email para que nadie pueda colar
cabeceras extra (`?bcc=…`) en el correo que se abre.

## Defensas

| Capa | Qué frena |
|---|---|
| `Origin` | Peticiones desde otros sitios hechas por un navegador |
| Rate limit | 2 envíos por minuto e IP |
| Honeypot `_hp` | Bots que rellenan todos los campos |
| Umbral `_t` | Envíos en menos de 3 segundos |
| Turnstile | Automatismos que superan todo lo anterior |

El `Origin` solo disuade a navegadores: un `curl` con la cabecera falsificada lo
atraviesa. Quien de verdad sostiene el buzón son el rate limit y Turnstile.

La ventana del rate limit es de 60 segundos porque el binding nativo de
Cloudflare solo admite `10` o `60`. Un tope por hora o por día exigiría KV.

Si Turnstile **rechaza** el token, el envío se descarta con 403. Si Turnstile
**no responde**, el mensaje se entrega marcado con `Sin verificar` en vez de
descartarse: esa caída no la provoca un atacante, las demás capas siguen
activas, y rechazar ahí solo costaría contactos legítimos.

## Higiene del bot

Un tercero que encuentre el bot en Telegram no puede leer los avisos: al
escribirle abre su propio chat privado y los mensajes se entregan al `CHAT_ID`
del propietario. El riesgo real es la fuga del `BOT_TOKEN`.

Comprobar que nadie ha registrado un webhook:

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
```

Lo esperado es `"url": ""`. Cualquier otra cosa significa que el token está
comprometido: rotarlo en BotFather y volver a subir el secreto.

En BotFather conviene tener `/setjoingroups` en *Disable* y `/setprivacy` en
*Enable*.
