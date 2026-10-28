# www.pxldash.com

The landing page for PxlDash. Plain
HTML, CSS and JS with no build step, served by GitHub Pages.

## Layout

| Path | What |
| --- | --- |
| `index.html` | The whole page |
| `assets/site.css` | Styles; tokens mirror pxldash's `docs/design-system.md` (Night theme) |
| `assets/site.js` | Draws board frames as LED dots on canvas, runs the hero rotation, builds module glyphs |
| `assets/boards/*.png` | Real 128×64 frames rendered by the pxldash server from its preview fixtures |
| `assets/fonts/` | Geist and Geist Mono (OFL), copied from pxldash |
| `.nojekyll` | Serve files as-is; skip Jekyll |

## Preview locally

```sh
python3 -m http.server 8088 --bind 0.0.0.0
```

## Refreshing the board frames

The PNGs are 1:1 decodes of the RGB565 frames pxldash sends to the panel
(first 16384 bytes, little-endian RGB565 → 128×64 PNG). With the pxldash dev
server running on port 4010:

- **Football:** `/preview/football/<state>/matrix.rgb565` (college football),
  add `?league=nfl` for the NFL. States are in `PxldashWeb.FootballFixtures` /
  `PxldashWeb.NflFixtures`.
- **Countdowns:** `/preview/countdown/<state>/matrix.rgb565`, states from
  `PxldashWeb.CountdownFixtures.all_states/0`.
- **Flights:** `/preview/<state>/matrix.rgb565`.
- **Animations:** no route; render each frame with
  `Pxldash.Providers.Animations.board/1` on a catalog entry whose `frames` is
  just that one sprite, then `Pxldash.Matrix.scene_to_rgb565/2` (`mode: :raw`).
- **Custom messages:** no route; build a `%Pxldash.CustomMessages.Message{}`
  in a `mix run` script and render `Pxldash.Providers.CustomMessage.board/1`
  the same way. The samples here are made up, not from a real account.

`tools/matrix_sim.py` in pxldash decodes a frame URL to a PNG.

## Deploy

GitHub Pages, from the `main` branch at the repository root
(Settings → Pages → Deploy from a branch). To serve it at `www.pxldash.com`,
add a `CNAME` file containing the domain and point a DNS `CNAME` record at
`<owner>.github.io`.
