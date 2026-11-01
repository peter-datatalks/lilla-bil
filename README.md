# Lilla Bil

A toddler-friendly 2D driving game: the moose from Lilla Piano and Lilla Lingua drives through
eight levels, collects coins, honks at animals, jumps over logs and spends coins in a marketplace.
Works offline after the first visit. Progress stays on the device, and nothing is collected.

Plain static site: no build step. Everything in this folder is served as-is.

## Run locally

```bash
python3 -m http.server 8791
```

Open http://localhost:8791. On localhost, `window.lillaBil` exposes the game for testing.

## Publish

Pushing to `main` publishes to GitHub Pages. It must be served over **https** for offline mode
and "Add to Home Screen" to work.

When you release a new version, bump `SHELL` in `sw.js` (e.g. `lb-shell-v1` → `lb-shell-v2`).

## Credits

- Font: Baloo 2 (SIL OFL 1.1), hosted with the game in `assets/fonts/`; notice in `LICENSES/`.
- Moose artwork from Lilla Lingua (owned by the app's owner; AI-generated with ChatGPT/Claude).
