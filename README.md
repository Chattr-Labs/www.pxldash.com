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

The PNGs are 1:1 decodes of the RGB565 frames pxldash sends to the panel. To
regenerate them, render the fixtures in pxldash (`Pxldash.Matrix.to_rgb565/2` for
flights, `Pxldash.Matrix.scene_to_rgb565/2` for the football and soccer scenes),
take the first 16384 bytes of each, and decode little-endian RGB565 to a
128×64 PNG.

## Deploy

GitHub Pages, from the `main` branch at the repository root
(Settings → Pages → Deploy from a branch). To serve it at `www.pxldash.com`,
add a `CNAME` file containing the domain and point a DNS `CNAME` record at
`<owner>.github.io`.
