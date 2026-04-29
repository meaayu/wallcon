# ✦ Wallcon — Pixel Art & Wallpaper Studio

> A zero-dependency, browser-based creative tool for turning photos into pixel art and generating stunning wallpapers — all in a single HTML file.

![Wallcon](https://img.shields.io/badge/version-1.0.0-ff6b9d?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-5effc8?style=flat-square)
![No dependencies](https://img.shields.io/badge/dependencies-none-ffe547?style=flat-square)
![Single file](https://img.shields.io/badge/single-file-c9b8ff?style=flat-square)

---

## ✨ Features

### 🖼 Pixel Art Converter
- **Drag-and-drop or click-to-upload** any image (PNG, JPG, WEBP, GIF)
- **Live before/after slider** — drag to compare the original and pixelated result side by side
- **Adjustable pixel size** from fine (2px) to chunky (48px)
- **6 curated color palettes** — Catppuccin Mocha, Catppuccin Frappé, Gruvbox, Nord, Tokyo Night, Rosé Pine
- **Export as PNG or SVG**

### 🎨 Wallpaper Generator
- **15 pattern types** — Geometric, Waves, Dots, Stripes, Mosaic, Starburst, Hexagons, Triangles, Gradient, Chevron, Mandala, Isometric, Circuit, Aurora, Confetti
- **Full color control** — 4 independent color slots with hex input and color picker
- **Color harmony generator** — Complementary, Triadic, Analogous, Split, Monochrome
- **Quick palettes** for one-click color schemes
- **Adjustable parameters** — Scale, Complexity, Rotation, Opacity
- **Post-processing effects** — Shadows, Outlines, Vignette
- **5 output sizes** — 1920×1080, 2560×1440, 4K, Mobile (1080×1920), Laptop
- **Export as PNG, JPG, or copy to clipboard**
- **Randomize** button for instant inspiration

---

## 🖥 Browser Support

Works in any modern browser with Canvas API support.

| Browser | Support |
|---------|---------|
| Chrome / Edge | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full |
| Mobile Chrome | ✅ Full |
| Mobile Safari | ✅ Full |

---

## 📱 Responsive Design

Wallcon is fully responsive across screen sizes:

- **Desktop** — Two-column layout with live preview on the left and controls on the right
- **Tablet** — Stacked layout with preview on top, controls below
- **Mobile** — Optimized touch targets, compact bottom navigation, always-visible download buttons

---

## 🎨 Color Palettes (Pixel Art)

| Palette | Description |
|---------|-------------|
| **Original** | No palette mapping — preserves image colors |
| **Catppuccin Mocha** | Warm, dark pastel theme |
| **Catppuccin Frappé** | Medium-contrast pastel theme |
| **Gruvbox** | Warm retro earthy tones |
| **Nord** | Cool arctic blue-gray |
| **Tokyo Night** | Dark vibrant city palette |
| **Rosé Pine** | Muted dusty rose and pine |

---

## ⚙️ Wallpaper Parameters

| Parameter | Range | Description |
|-----------|-------|-------------|
| Scale | 10–200 | Size of pattern elements |
| Complexity | 1–10 | Detail level of the pattern |
| Rotation | 0–360° | Global rotation of the pattern |
| Opacity | 10–100% | Pattern layer transparency |

---

## 🛠 How It Works

Everything runs on the **Canvas API** — no WebGL, no external libraries, no server-side processing. Images never leave your device.

- **Pixel art**: The converter samples each cell block of the source image, averages the RGB values, optionally maps to the nearest palette color, and redraws at the same resolution.
- **Wallpapers**: Each pattern is a pure JavaScript draw function that accepts colors, scale, complexity, and rotation parameters and renders directly onto a `<canvas>` element at your chosen output resolution.

---

## 🤝 Contributing

Contributions are welcome! Some ideas:

- New wallpaper patterns
- Additional color palettes
- Dithering modes for pixel art
- Animation / GIF export
- Dark mode UI

To contribute, fork the repo, make your changes to `wallcon.html`, and open a pull request.

---

## 📄 License

MIT © [aayu](https://github.com/meaayu)

---

<p align="center">Made with ✦ by <a href="https://github.com/meaayu">aayu</a></p>
