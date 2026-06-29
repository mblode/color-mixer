# Color Mixer

Mix and blend real pigments in your browser, like wet paint on a canvas.

**→ [colormixer.app](https://colormixer.app)**

Most color tools just blend RGB values — which is why mixing blue and yellow on a screen gives you grey instead of green. Color Mixer uses [Mixbox](https://github.com/scrtwpns/mixbox) pigment math so colors mix the way actual paint does, and a WebGPU fluid canvas so you can smear them around in real time.

## What you can do

- **Pick two pigments** from the palette and set the blend ratio between them.
- **See the mix instantly** — a live swatch shows the resulting color as you adjust.
- **Paint on a live canvas** — press and drag to inject pigment into a flowing, WebGPU-powered fluid simulation.
- **Watch colors blend like paint** — pigments advect and diffuse every frame using true subtractive mixing.
- **Pause, resume, and clear** to inspect a frozen frame or start fresh.

## Requirements

Color Mixer needs **WebGPU**, available in recent desktop Chrome, Edge, and Safari. If it isn't enabled, the app shows you how to turn it on. Everything runs locally in your browser.

## License

This project's own code is [MIT](./LICENSE) © Matthew Blode.

It relies on **Mixbox**, which is © Secret Weapons and licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) (non-commercial). As a result, the project as a whole is for **non-commercial use only**. See [NOTICE](./NOTICE) for details.

---

Crafted by [<img src="https://matthewblode.com/avatar-circle.png" width="20" align="top" />](https://matthewblode.com) [Matthew Blode](https://matthewblode.com)
