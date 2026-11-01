# Lilla Bil

A toddler-friendly 2D driving game: the moose from Lilla Piano and Lilla Lingua drives
north through Sweden in 30 levels, from Skåne to Abisko, collects coins, honks at animals, jumps over
logs and spends coins in a summer and a winter marketplace of vehicles, colours, tyres, extras and horns. Works offline after the first visit. Progress and the
player's name stay on the device, and nothing is collected.

Plain static site: no build step. Everything in this folder is served as-is.

## Run locally

```bash
python3 -m http.server 8791
```

Open http://localhost:8791. On localhost, `window.lillaBil` exposes the game for testing.

## Publish

Pushing to `main` publishes to GitHub Pages. It must be served over **https** for offline mode
and "Add to Home Screen" to work.

When you release a new version, bump `SHELL` in `sw.js` (e.g. `lb-shell-v9` → `lb-shell-v10`).

## Credits

- Font: Baloo 2 (SIL OFL 1.1), hosted with the game in `assets/fonts/`; notice in `LICENSES/`.
- Moose artwork from Lilla Lingua (owned by the app's owner; AI-generated with ChatGPT/Claude).
