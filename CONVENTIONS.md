# Module HTML conventions (ADC `.drop` pattern)

Every module is written in the same pattern the **Sumeru Email Builder Figma plugin** uses for ADC. That means the SFMC `stylingblock-content-wrapper` blocks, `.drop` column stacking, `.fluid` images, and ADC's own named mobile classes.

**Only the classes in `email-head.css`** may be used. That file is the plugin's ADC stylesheet, verbatim. **Never invent a class.** SFMC blocks ship without a `<head>`, so a new class would do nothing in production.

**No dark-mode CSS.** Inboxes apply their own dark mode. The doc site's Dark preview only *emulates* that, and modules carry nothing for it.

`modules/HRO-01.html` is the reference implementation. Copy its patterns.

## File contract
- `modules/<ID>.html` is a **body-only fragment**: no `<html>`, `<head>`, `<body>`, `<style>`, `<script>` or `<div>`.
- The file starts with `<!-- MFS · <ID> · <title> · v1.0 -->`.
- It's pasted inside ADC's template container, a 600px `<table class="container">`. The doc site's `module-view.html` supplies the same container, so the module itself is **100% wide**.
- **Outer structure.** Exactly what the plugin emits, one per section:
  ```html
  <table cellpadding="0" cellspacing="0" width="100%" role="presentation" class="stylingblock-content-wrapper" style="min-width: 100%; background-color: #FFD100;" bgcolor="#FFD100">
  <tr><td class="stylingblock-content-wrapper camarker-inner">
    … content tables …
  </td></tr></table>
  ```
  - The section background goes on the **wrapper table**: style and `bgcolor`.
  - A module made of several visual bands, such as a header strip plus a body, may use several wrappers back to back.
- `modules/<ID>.meta.json` holds the specs. Its schema is unchanged; see below.
- Images live in `assets/img/<ID>/`, referenced relatively, exported at 2× and displayed at 1× with explicit `width`/`height`.

## Markup rules
- **Tables only.** Every table gets `role="presentation" cellpadding="0" cellspacing="0" border="0"`.
  - No flex, grid, `position`, `float` or CSS `gap` in inline styles.
  - Gaps are spacer rows or `padding-top` on the next cell.
- **All visual styles are inline.** The light desktop version must look right with no `<head>` CSS at all.
- **Font:** every text cell has `font-family: Calibri, arial, helvetica, sans-serif;` (Arial is the Gmail fallback) and `mso-line-height-rule: exactly;`.
- **Line heights in px:** headline 38/44, subheadline 28/32, body-lg 20/26, body-md 18/23, body-sm 16/21, eyebrow 16/21 (bold caps), legal 13/18.
- **Text** goes directly in a `<td>`, or in `<p style="margin:0; …">`. Use entities such as `&rsquo;`, `&amp;` and `&reg;`.
- **Images:** `display:block; border:0; outline:none; text-decoration:none; width:Npx; max-width:100%; height:auto;`, plus `width`/`height` attributes and meaningful `alt` text. Add `class="fluid"` to images that should go full width on mobile.
- **Links:** `href="#"`, `alias=""` and `target="_blank"`, with inline colour and `text-decoration`. Inline links are `#001489` and underlined.
- **Buttons** use the plugin's bulletproof button plus a VML fallback for Outlook. Copy it from HRO-01. The `td` carries `bgcolor` and `border-radius:48px`. The `<a>` has `display:block; padding:14px 32px;`, Calibri Bold 18/23.
  - **Primary:** `#222731` with white text.
  - **Yellow:** `#FFD100` with `#222731` text.
  - Add `class="fluid"` to the button table **only** if the Figma Mobile frame shows a full-width button.
- **Merge fields and MLR copy:** keep Figma's `[Bracketed]` text. Keep it inline magenta `#FF00F5` if Figma shows it magenta.
- **Rounded corners:** `border-radius` on the td (cards 8px, images 16px). Outlook shows square corners; that's accepted.

## Mobile: ADC classes only (they fire at ≤ 480px; `.container`/`.fluid` also at 640px)
| Need | ADC class | Effect |
|---|---|---|
| Columns stack | `drop` on **every** column `<td>` **and** every gutter/spacer `<td>` between them, at every nesting level | `display:block; width:100%` |
| Columns stay side by side on mobile | no `drop` (it's opt-in) | |
| Gutter between stacked columns | spacer td `class="drop mob-h25"` (or `mob-h15` / `mob-hegt20` / `mob-h35` / `mob-rht`) | becomes a 15/20/25/35/40px-tall gap |
| Image full width | `fluid` | `width:100%; height:auto` |
| Headline 38 → 28 | `f28` | |
| Subheadline 28 → 24 | `f24` | |
| Other font steps | `f10` `f11` `f12` `f13` `f14` `f15` `f16` `f18` `f20` `f22` `f26` `f36` `f60` `f78` | |
| Left+right padding on mobile | `mobPad32` (32) · `mobCont` (20) · `pad15` (15) · `mobile-prl` (10) · `mob-pad-non` (0) | symmetric L+R only |
| Top padding on mobile | `padd-top` (40) · `himobtop` (20) · `padd-none` (10) · `padd-topnone` / `pt0` (0) | |
| Bottom padding on mobile | `padd-bottom` (40) · `mob-pad-bot` (30) | |
| All sides 16 | `mobPad16` | |
| Centre text on mobile | `centered` | |
| Hide on mobile | `h` (≤ 480px, in step with `drop`/`dis-block`). `mobile-hidden` also fires at 481–640px, so avoid it in desktop/mobile swaps. | |
| Show only on mobile | `dis-block` on an element hidden inline by default: `display:none; mso-hide:all;`. **Don't** add `max-height:0; overflow:hidden`: no ADC class undoes them. | |

**Don't pad a `drop` cell.** At 100% width, padding makes it overflow. Nest a padded cell inside it instead.

**Snapping.** Figma spacing tokens shrink on mobile (desktop/mobile: 16/8, 24/16, 32/24, 40/24, 48/32, 64/48). Snap each one to the **nearest** ADC class, the same way the plugin does:
- **Horizontal:** 48→32 is `mobPad32`, 32→24 and 40→24 are `mobCont`, 24→16 is `pad15`, 16→8 is `mobile-prl`.
- **Top:** 48→32 is `padd-top`, 40→24 and 32→24 are `himobtop`, 24→16 is `himobtop`, 16→8 is `padd-none`.
- **Bottom:** 48→32, 40→24 and 32→24 are all `mob-pad-bot`. Below that there's no class, so keep the desktop value.

If no class gets within about 8px, leave the desktop value and record it in the meta `notes`.

## Dark mode
- **Don't add anything.** No classes, no media queries and no swap images.
- Use the exact brand hex values inline (`#FFFFFF`, `#FFD100`, `#F4F4F3`, `#222731`, `#001489`). The doc site's Dark preview recognises them and shows the Figma Dark token values, which is roughly what Apple Mail and Outlook produce.
- Other light backgrounds and dark text are lightness-inverted in the preview, as partial-invert clients do.
- Images are never recoloured. Use transparent PNGs, or images with a background that still reads on a dark canvas.

## `<ID>.meta.json` schema
```json
{
  "id": "HRO-01", "title": "…", "category": "hero",
  "description": "…", "usage": "…",
  "editable": ["Headline", "…"], "seenIn": "Voucher 1, 4, 8",
  "chars": { "Headline": "≤ 55" },
  "images": [{ "slot": "Product image", "w": 504, "h": 380, "notes": "…" }],
  "tokens": ["surface/yellow", "…"],
  "notes": ["…"],
  "figmaNode": "94:684"
}
```
`category` is one of `header`, `hero`, `body`, `support`, `polls` or `disclaimer`.
