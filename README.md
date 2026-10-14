# Transmission Line Reflection Simulator

A self-contained browser application for visualizing lossless transmission-line step propagation and reflections. Open `index.html` in any current desktop browser; no installation, Python runtime, web server, or build step is required.

## Open the simulator

**[Click here to open the live Transmission Line Reflection Simulator](https://ludvikalkhoury.github.io/TransmissionLine/)**

The simulator uses event-based superposition of forward and backward voltage steps. It supports load and source reflection coefficients, multiple reflections, position/time voltage plots, current measurements, playback controls, presets, JSON settings, CSV export, and PNG plot export.

## Verification

The lossless resistive model is implemented in `physics.js`; the browser interface is in `app_v2.js`. To run the automated physics checks locally, install a current Node.js release and run:

```powershell
node tests.js
```

The application is an educational lossless-line model. It does not replace an eye-diagram, IBIS/SPICE, or electromagnetic analysis for a real board or RF design.

## Physics checks

With Vs = 5 V, Rs = Z0 = 50 Ω, and TD = 6 ns, the open-load preset produces 2.5 V at A at 0 ns, B at 3 ns, 5 V at C at 6 ns, B at 9 ns, and A at 12 ns. The model keeps step regions behind their wavefronts rather than using pulse or dot animation.
