# DIRECCIÓN VISUAL — RV Corp

> Registro de dirección visual del proyecto (hard blocker del `SELLO DE APROBACIÓN PARCIAL`).

**Resultado: SI** — dirección visual clara: **SI**

## Concepto rector

Estética cálida, hospitalaria y confiable para un negocio de alquiler de RVs, **emulando el lenguaje visual de la empresa objetivo de la entrevista (RV Fun Rental)**: naranja cálido como acento de acción, gris carbón para superficies oscuras (hero, sidebar, footer), azul-teal para enlaces, y fondo crema claro. Botones tipo píldora redondeada. Tipografía serif para titulares (carácter) + sans-serif para cuerpo (legibilidad).

## Paleta cromática (implementada en `app/globals.css`)

| Rol | Token | Valor | Uso |
|---|---|---|---|
| Acento primario / CTA | `--color-brand-orange` | `#E8730C` | Botones, píldoras, números de paso, indicador activo |
| Superficie oscura | `--color-brand-forest` | `#37373A` | Hero, sidebar, footer, panel de login |
| Enlaces / acento secundario | `--color-brand-sage` | `#4F93C6` | Enlaces, badges de rama |
| Naranja profundo | `--color-brand-earth` | `#C85F08` | Headings de badge |
| Fondo claro | `--color-brand-cream` | `#F5F4F1` | Fondo de página |
| Neutros | `--color-neutral-*` | gris cálido | Texto, bordes, superficies claras |

Verificado por estilos computados en runtime (Playwright): hero `rgb(55,55,58)`, CTA `rgb(232,115,12)`, enlaces `#4F93C6`, fondo `rgb(245,244,241)`.

## Tipografía

- **Titulares:** `Instrument Serif` (`--font-serif`) — carácter cálido, editorial.
- **Cuerpo / UI:** `Inter` (`--font-sans`) — neutra, legible.
- **Datos / código / transcript:** `JetBrains Mono` (`--font-mono`).

## Composición y patrones

- **Header público** blanco con logo (badge naranja + monograma van SVG) + nav + píldora naranja de CTA "Talk to an Agent" — eco directo del header de RV Fun Rental.
- **Hero** en carbón con badge naranja y titular serif grande.
- **Tarjetas** redondeadas (`rounded-xl`/`2xl`) blancas con borde neutro sutil sobre fondo crema.
- **Footer** carbón con headings naranja y enlaces claros.
- **Diagrama de call-flow** con rieles verticales naranja y tarjetas por paso.
- **Sidebar CRM** carbón con indicador activo naranja.

## Criterios visibles de aceptación

- Botones de acción en naranja, consistentes en todas las vistas.
- Superficies oscuras en carbón (no negro puro), texto blanco/gris claro encima con contraste suficiente.
- Enlaces en teal distinguibles del texto.
- Divulgación honesta ("browser demo → producción Twilio/Vapi") visible en `/voice` y `/how-it-works`.
- Superficie recruiter-facing 100% en inglés.

## Herramienta

Materializado directamente en código (Tailwind v4 `@theme` + estilos inline con tokens CSS), sin dependencia de Figma. Coherente con la capa visual free-first/code-first de la doctrina.
