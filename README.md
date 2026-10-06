# MyFreeStyle Email Design System

Documentation site for the MyFreeStyle (Abbott Diabetes Care) email module library: brand foundations plus 30 live, table-based email modules. Each one previews at Desktop 600px and Mobile 375px, in Light and Dark mode.

The source of truth is the Figma file **Templates v/s Modules**, page "◆ MyFreeStyle · Email Modules".

## Structure
| Path | What it is |
|---|---|
| `index.html`, `site.css`, `site.js` | The documentation site. Vanilla HTML, CSS and JS with no build step, set in Brandon Text. |
| `module-view.html` | Renders one module inside a real email shell. Each preview iframe loads it as `?id=HRO-01&scheme=dark`. |
| `email-head.css` | ADC's SFMC template head CSS, plus the MyFreeStyle mobile and dark-mode classes. |
| `modules/<ID>.html` | Body-only, ESP-safe module HTML: what becomes an SFMC Content Builder block. |
| `modules/<ID>.meta.json` | Specs for each module: editable fields, character counts, image slots, tokens and notes. |
| `brand.json` | Brand foundations: colours, tokens, typography, spacing, buttons, icons and logos. |
| `manifest.json` | Generated from `brand.json` and every `*.meta.json`. Don't edit it by hand. |
| `CONVENTIONS.md` | The rules every module follows. Read this before adding or editing one. |

## Working on it
```bash
node scripts/build.mjs             # rebuild manifest.json + validate every module
python3 -m http.server 5175        # preview at http://localhost:5175
node scripts/set-password.mjs '…'  # change the site password (stores only its SHA-256)
```

Fit an image exported from Figma into its slot at 2×:
```bash
python3 scripts/fit_image.py SRC DEST WIDTH HEIGHT contain|cover   # needs Pillow
```

## Password
The password screen only hides the page. This repository is public, so every file in it can still be read on GitHub. Don't put anything here that must stay confidential.

## Fonts
`fonts/` holds web versions of Brandon Text (HVD Fonts), used only for this site's UI. Emails use Calibri, with Arial as the fallback.
