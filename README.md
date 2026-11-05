# abhiram.ca

My personal portfolio, live at [abhiram.ca](https://abhiram.ca).

Built with HTML, CSS, and vanilla JavaScript. A small grid-based ecosystem runs in the background, simulating plants, rabbits, foxes, fungi, weather, and nutrient recycling.

## Run locally

No build step or dependencies are required. From this directory, run:

```sh
python3 -m http.server 8000 --directory dist
```

Open <http://localhost:8000>.

## Files

- `dist/index.html` — portfolio content and navigation
- `dist/style.css` — styles and responsive layout
- `dist/app.js` — section routing and expandable projects
- `dist/ecosystem-engine.js` — simulation logic
- `dist/ecosystem.js` — rendering and ecosystem controls
- `dist/assets/` — site icons and logos
- `dist/resume.pdf` — résumé

## Hosting

The published site is hosted on Cloudflare through Sites. This repository is a source copy; pushes here do not automatically deploy to abhiram.ca. Any static host can serve the `dist/` directory.

Third-party logos belong to their respective owners.
