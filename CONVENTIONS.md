# Module HTML conventions

These rules apply to every file in `modules/`. `modules/HRO-01.html` is the reference implementation. When in doubt, copy its patterns.

## File contract
- `modules/<ID>.html` is a **body-only fragment**: no `<html>`, `<head>`, `<body>` or `<style>`. It's what becomes an SFMC Content Builder block.
- The file starts with `<!-- MFS · <ID> · <title> · v1.0 -->`.
- It has one outermost table: `width="600"`, `class="mfs-w100 …"`, `style="width:600px; max-width:600px; …"`, `align="center"`.
- `modules/<ID>.meta.json` holds the documentation data, using the schema below.
- Images live in `assets/img/<ID>/`. They're referenced with a relative `src="assets/img/<ID>/<name>.png"`, exported at **2×**, and displayed at 1× with explicit `width` and `height`.
  - Fit each image to its exact slot with `scripts/fit_image.py SRC DEST W H contain|cover`.
  - Product renders use `contain` with transparency. Photos use `cover` and export as `.jpg`.

## Markup rules (ESP-safe)
- **Tables only** for layout. Every table gets `role="presentation" cellpadding="0" cellspacing="0" border="0"`.
  - Use no `<div>` for layout, and no flex, grid, `position`, `float` or `margin` for layout.
  - Never use CSS `gap`. Express gaps as `padding-top` on the next cell.
- **Every visual style is inline.** Classes are only for mobile and dark-mode overrides (see `email-head.css`). With the head CSS stripped, the light desktop version must still look right.
- **Font:** `font-family:Calibri, Arial, Helvetica, sans-serif;` goes on every text cell. Arial is the Gmail fallback. Also add `mso-line-height-rule:exactly;`.
- **Line heights** are in px, rounded: headline 38/44, subheadline 28/32, body-lg 20/26, body-md 18/23, body-sm 16/21, eyebrow 16/21 bold caps, legal 13/18.
- **Text** goes directly in `<td>`. Use `<br>` sparingly. If you use `<p>`, give it `margin:0`. Use `&rsquo;`, `&amp;`, `&reg;` and similar entities.
- **Images:** `display:block; border:0; outline:none; text-decoration:none;`, plus `width`/`height` attributes, inline `width:Npx; max-width:100%; height:auto;`, and meaningful `alt` text (empty `alt=""` only for decorative images). Full-width images get `class="mfs-img"`.
- **Links:** `href="#"`, `alias=""` and `target="_blank"`, plus an inline colour and `text-decoration`. Inline links are `#001489` and underlined, with `class="mfs-dm-link"`.
- **Buttons:** bulletproof. Copy the button block from HRO-01: a `td` with `border-radius:48px` and a bg colour, a VML `v:roundrect` for Outlook, and an `<a>` with `padding:14px 32px`. Labels are Calibri Bold 18/23.
  - Primary: `#222731` background, white text. In dark mode it flips: `mfs-dm-bg-charcoal` on the td and `mfs-dm-text-inv` on the `<a>`.
  - Yellow: `#FFD100` background with `#222731` text, the same in both modes. Don't add dm classes to it.
  - Set the VML `width` to roughly the label width plus 64.
- **Merge fields and MLR copy:** keep Figma's `[Bracketed placeholder]` text as-is. If Figma shows it in magenta (`#FF00F5`), keep the magenta inline. It's an annotation colour that must be replaced before send.
- **Rounded cards:** `border-radius:8px` on the td (images 16px). Outlook will show square corners, which is acceptable.

## Mobile (max-width 640px), classes only
- `mfs-w100` on fixed-width tables. `mfs-img` on full-width images.
- `mfs-stack` on side-by-side `<td>` columns that should stack. Columns are `<td>`s in the same `<tr>` with fixed widths, each with `class="mfs-stack"`.
- `mfs-h1` on 38px headlines (→28/32). `mfs-h2` on 28px subheadlines (→24/28).
- Spacing token *n* in Figma (`var(--spacing/n)`) maps to the desktop px inline value, plus the class `mfs-p{n}`, `mfs-px{n}`, `mfs-py{n}`, `mfs-pt{n}` or `mfs-pb{n}` so it shrinks on mobile:

  | Token | Desktop | Mobile |
  |---|---|---|
  | 2 | 16 | 8 |
  | 3 | 24 | 16 |
  | 4 | 32 | 24 |
  | 5 | 40 | 24 |
  | 6 | 48 | 32 |
  | 8 | 64 | 48 |

  Token 1 (8/8) needs no class.
- `mfs-hide` / `mfs-show` hide or show an element on mobile. A `mfs-show` element must be hidden inline by default: `display:none; max-height:0; overflow:hidden; mso-hide:all;`.
- Use the **Mobile · Light** Figma frame to decide what stacks, reorders or hides.

## Dark mode, classes only (values from the Figma Light/Dark token table)
| Figma variable on the node | Class |
|---|---|
| bg `surface/white` #FFFFFF | `mfs-dm-bg-white` (→ #222731) |
| bg `surface/yellow` #FFD100 | `mfs-dm-bg-yellow` (→ #5B4A00) |
| bg `surface/light-grey-30` #F4F4F3 | `mfs-dm-bg-grey` (→ #464646) |
| bg `surface/charcoal-1000` #222731 | `mfs-dm-bg-charcoal` (→ #FFFFFF) |
| text `text/charcoal` #222731 | `mfs-dm-text` (→ #FFFFFF) |
| text `text/white` #FFFFFF | `mfs-dm-text-inv` (→ #222731) |
| text `text/hyperlink` #001489 | `mfs-dm-link` (→ #D0A0EC) |
| `components/button/yellow`, `border/primary` | unchanged, no class |

- Only add a dm class where the Figma code uses that **variable**, written as `var(--surface/yellow, …)`. Hard-coded hex values stay as they are in dark mode.
- If an image needs a dark-mode swap, such as a logo on a background that turns dark, wrap the light image in `class="mfs-light-img"`. Add the dark image wrapped in `class="mfs-dark-img"` and hide it inline by default: `display:none; max-height:0; overflow:hidden; mso-hide:all;`.
- Check against the **Desktop · Dark** frame.

## `<ID>.meta.json` schema
```json
{
  "id": "HRO-01",
  "title": "Yellow · headline + product image + body + CTA",
  "category": "hero",
  "description": "Label description from Figma.",
  "usage": "Component description from Figma, if any.",
  "editable": ["Headline", "Product image", "Body", "CTA label + link"],
  "seenIn": "Voucher 1, 4, 8",
  "chars": { "Headline": "≤ 50", "Body": "≤ 200", "CTA": "≤ 22" },
  "images": [{ "slot": "Product image", "w": 504, "h": 380, "notes": "Transparent PNG, contain" }],
  "tokens": ["surface/yellow", "text/charcoal", "surface/charcoal-1000", "text/white"],
  "notes": ["Locked layout: edit only image fills and text."],
  "figmaNode": "94:684"
}
```
- `category` is one of `header`, `hero`, `body`, `support`, `polls` or `disclaimer`.
- `chars` gives approximate maximum lengths, taken from the Figma placeholder copy and the text-box width. Round up to sensible numbers. As a guide, at desktop width a 504px box fits about 28 characters per line at 38px and about 50 at 20px.
- `figmaNode` is the **Row** frame ID.
