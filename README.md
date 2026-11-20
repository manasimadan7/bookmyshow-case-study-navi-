# bookmyshow case study | navi

A case study on **splitting a BookMyShow booking with friends**: why one person always ends up paying upfront and chasing everyone, what the research said, and two interactive prototypes that tackle it.

**Live site:** https://manasimadan7.github.io/bookmyshow-case-study-navi-/

- Figma file: https://www.figma.com/design/VgETV6KyHXm8IKjcBon5Vu/navi-des-task
- FigJam board: https://www.figma.com/board/V90Hs1obiRLPqSWpvGNdHS/navi-destask

## What's inside

1. **Intro & problem**: the "um guys… you still haven't paid me" moment, and a user quote.
2. **Brand values**: BookMyShow's Simplicity, Disruption and Learning from Failure (animated cards).
3. **Research**: BookMyShow's 2016 split-pay feature, existing solutions (Zomato, Splitwise, Cash App), what works / what doesn't.
4. **Users**: interviews, key insights, and three archetypes: the Planner, the Canceller, the Avoider.
5. **Current app journey**, then a switch into dark mode for the solutions.
6. **User journey 01: Prototype 3 (WhatsApp link)**: "Taking the conversation to a familiar space".
7. **Why WhatsApp is risky**, then **User journey 02: Prototype 1 (inline checkout)**: "Keeping the whole split inside BookMyShow".
8. **The trade-off**: app users vs successful purchases.

Each user journey shows the **host's phone on the left and a friend's phone on the right**, with step dots, Previous / Next (or ← → keys), a finger showing what gets tapped next, and **"What if…"** branches: a failed payment, someone not paying, someone who doesn't know the sender, dropping a friend, the 10-minute hold running out, and only some people paying.

## Run it locally

It's a static site (plain HTML, CSS and JavaScript, no build step). Serve the folder over HTTP. Opening `index.html` directly from disk won't load the arrows or prototype styles.

```bash
node serve.mjs 5180
# then open http://localhost:5180
```

Any static server works too, e.g. `npx http-server .`

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | The page. Desktop is the 1728px Figma artboard at exact coordinates, scaled to the window; below 900px it reflows into one column. |
| `styles.css` | All page styles, including dark mode (`body.is-dark`) and the mobile layout. |
| `script.js` | Scales the artboard to the window and fits collage blocks on mobile. |
| `motion.js` | Animated arrows, bouncy section entrances, and the brand-value card animations. |
| `darkmode.js` | The circle that grows into dark mode before the user journeys. |
| `nav.js` | The page-contents bar at the top. |
| `journeys/journey.js` | Shared journey stepper: phones, dots, Previous/Next, "What if…" chips, tap hints. |
| `journeys/proto3-*`, `journeys/proto1-*` | Screens extracted from the two prototypes (`*-screens.js`, `*.css`) and the scripted journeys (`*-journey.js`). |
| `assets/` | Images and SVGs exported from Figma. |

Animations respect the "reduce motion" accessibility setting.

## Notes

- The phone number and email in the prototype screens and in one app screenshot are placeholders (`+91-98XXX XXXXX`, `name@example.com`).
- The prototype screens are taken directly from the original prototype files. The only additions are the journey-only screens for "let the host know" and "host pays for a friend".
