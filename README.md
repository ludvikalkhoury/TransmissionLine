# Transmission Line Reflection Simulator

A self-contained browser application for visualizing lossless transmission-line step propagation and reflections. Open `index.html` in any current desktop browser; no installation, Python runtime, web server, or build step is required.

The simulator uses event-based superposition of forward and backward voltage steps. It supports load and source reflection coefficients, multiple reflections, position/time voltage plots, current measurements, playback controls, presets, JSON settings, CSV export, and PNG plot export.

## GitHub Pages

To publish it, create or use a Git repository, commit `index.html`, `styles.css`, and `app.js`, push them to GitHub, then enable **Settings → Pages → Deploy from a branch** with the repository root selected. The resulting GitHub Pages URL runs the simulator without a server.

## Physics checks

With Vs = 5 V, Rs = Z0 = 50 Ω, and TD = 6 ns, the open-load preset produces 2.5 V at A at 0 ns, B at 3 ns, 5 V at C at 6 ns, B at 9 ns, and A at 12 ns. The model keeps step regions behind their wavefronts rather than using pulse or dot animation.
