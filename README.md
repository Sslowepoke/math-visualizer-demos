# Physics & Math Demos

Interactive Three.js visualizations, deployed as a monorepo to GitHub Pages.

## Demos

| Demo | Command |
|------|---------|
| [Electric Field — Cube](elektricno-polje-kocka/) | `npm run dev:elektricno-polje-kocka` |
| [Complex Vector Visualiser](complex-vector-visualiser/) | `npm run dev:complex-vector-visualiser` |
| [Sferne ljuske](sferne-ljuske/) | `npm run dev:sferne-ljuske` |

## Local development

One demo at a time (hot reload):

```bash
npm install
npm run dev:elektricno-polje-kocka
# or
npm run dev:complex-vector-visualiser
```

Landing page plus both demos (production build):

```bash
npm run preview
```

Then open the URL `serve` prints, usually `http://localhost:3000`.

## Build for GitHub Pages

```bash
npm run build
```

Output goes to `dist/`:

```
dist/
├── index.html              # landing page
├── demos.json
├── elektricno-polje-kocka/
└── complex-vector-visualiser/
```

## Deploy to GitHub Pages

1. Create a GitHub repo and push this folder.
2. In repo **Settings → Pages**, set source to **GitHub Actions**.
3. Push to `main` — the workflow in `.github/workflows/deploy.yml` builds and deploys automatically.

Your site will be at:

```
https://<username>.github.io/<repo-name>/
```

Each demo lives at a subpath, e.g. `https://<username>.github.io/math-visualizer-demos/elektricno-polje-kocka/`.

## Adding a new demo

```bash
python scripts/new_demo.py my-demo-slug --title "My Demo" --description "What it shows."
npm install
npm run dev:my-demo-slug
```

The script copies `templates/demo/`, then registers the slug in `package.json`, `demos.json`, and this README. The template already includes the theme toggle, title, z-up camera, axes/grid GUI, and `Space` / `X` / `Y` / `Z` / `G` keys.
