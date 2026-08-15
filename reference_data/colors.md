# Color Palette

Canonical colors for campdegen.com. Use CSS semantic tokens in code—not raw hex in HTML.

## Primary Palette

Foundational tones for surfaces and typography.

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Dark Charcoal | `#1C1C1E` | `28, 28, 30` | Page background (`--bg-base`), header, footer |
| Faded Olive | `#5C6B52` | `92, 107, 82` | About section tint, panel accents (`--bg-panel` base) |
| Dirty Beige | `#B8A88A` | `184, 168, 138` | Hero tagline accent, warm highlights (`--accent-warm`) |
| Weathered Steel | `#6E7885` | `110, 120, 133` | Secondary text, nav links, captions (`--text-muted`) |
| Off-White | `#EDE8DF` | `237, 232, 223` | Headings, body copy on dark (`--text-primary`) |

## Accent Palette

Use sparingly—accents should be **less than ~15%** of visible UI pixels.

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Safety Orange | `#E85D04` | `232, 93, 4` | Primary buttons, Discord CTA (`--accent-cta`) |
| Warning Yellow | `#D4A017` | `212, 160, 23` | CTA hover, focus rings (`--accent-cta-hover`, `--accent-highlight`) |
| Faded Red | `#9E4B4B` | `158, 75, 75` | Errors only—avoid decorative use (`--accent-danger`) |
| CRT Cyan | `#3DB8B0` | `61, 184, 176` | Email links, focus outlines, tech accent lines (`--accent-link`) |
| Deep Cobalt Blue | `#2A4575` | `42, 69, 117` | Hero gradient, secondary accents (`--accent-secondary`) |

## Semantic Tokens

Derived values used in [`css/styles.css`](css/styles.css):

| Token | Value | Source |
|-------|-------|--------|
| `--bg-base` | `#1C1C1E` | Dark Charcoal |
| `--bg-elevated` | `#252528` | Derived (+8% lightness from charcoal) |
| `--bg-panel` | `#2A2F28` | Charcoal + olive tint |
| `--text-primary` | `#EDE8DF` | Off-White |
| `--text-muted` | `#6E7885` | Weathered Steel |
| `--border` | `#3A4248` | Derived from Weathered Steel |
| `--accent-warm` | `#B8A88A` | Dirty Beige |
| `--accent-cta` | `#E85D04` | Safety Orange |
| `--accent-cta-hover` | `#D4A017` | Warning Yellow |
| `--accent-link` | `#3DB8B0` | CRT Cyan |
| `--accent-secondary` | `#2A4575` | Deep Cobalt Blue |
| `--accent-danger` | `#9E4B4B` | Faded Red |
| `--accent-highlight` | `#D4A017` | Warning Yellow |

## Do / Don't

- **Do** use one Safety Orange primary CTA per viewport (Discord join).
- **Do** use CRT Cyan for text links and focus states—not for buttons.
- **Do** keep body text Off-White on Dark Charcoal for contrast.
- **Don't** use Faded Red unless showing an error state.
- **Don't** fill large areas with accent colors; keep them for CTAs, links, and small highlights.
- **Don't** hard-code hex values in HTML—reference CSS variables only.

## Typography (operational identity)

Retro-era web fonts on campdegen.com (WW2–Early Cold War / 1970s manual influence):

| Role | Font | Use |
|------|------|-----|
| Headings | Bebas Neue | Propaganda-style bold display, facility titles |
| Body | Rajdhani | Industrial signage, paragraphs |
| Labels / stamps | Share Tech Mono | Doc codes, CRT-era labels, buttons, nav |

Avoid esports fonts, novelty military fonts, and ultra-futuristic sci-fi type. Blue accents should read as industrial control systems, not RGB gaming aesthetics.

## Retro presentation (site)

CSS applies aged stock tones, film grain, vignette, scanlines (hero), registration marks, double borders, letterpress shadows, and photocopied logo treatment—aligned with surface wear and era influence standards in operational identity docs.
