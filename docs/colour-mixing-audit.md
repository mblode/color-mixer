# Colour-mixing technical audit

A technical audit of the paint-mixing colour algorithm in this WebGPU paint app (Vite + React 19 + TypeScript).

---

## 1. Executive summary

The app mixes paint using [Mixbox](https://scrtwpns.com/mixbox/) (Sochorová & Jamriška, *Practical Pigment Mixing for Digital Painting*, SIGGRAPH Asia 2021) in a 7-component latent space. Latent values are accumulated per-pixel into two `rgba16float` ping-pong textures and decoded back to colour in a fragment shader.

**Verdict: the Mixbox latent math itself is implemented correctly.** The pipeline accumulates `latent += pigment · deposit` alongside a weight accumulator, then divides by total weight at render time. This is a valid convex blend and is exactly the officially-sanctioned N-colour weighted-average form:

$$ \text{mix} = G\!\left( \frac{\sum_i w_i \cdot F(\text{RGB}_i)}{\sum_i w_i} \right) $$

where `F` is `rgbToLatent` (RGB → latent), `G` is the latent → RGB decode (polynomial + residual), and `wᵢ` are the per-deposit weights. Because the decode is applied **once**, after a weighted average in latent space, the result is a genuine Mixbox mix rather than a naive RGB average.

**The physical-accuracy gaps are in the surrounding pipeline, not the latent algebra.** Specifically: compositing happens in gamma (sRGB) space rather than linear light; the opacity model is watercolour-like (thin paint lerps toward white) when an opaque oil/acrylic model is intended; there is no per-pigment tinting strength; accumulation precision is limited by FP16; and deposition is frame-rate-dependent rather than distance-dosed. These are the items to fix to reach physical plausibility — the core Mixbox call is sound.

---

## 2. How the current algorithm works

The data flow from colour selection to pixel is:

1. **Hex → latent.** [`src/lib/mixbox.ts`](../src/lib/mixbox.ts) calls `mixbox.rgbToLatent(hex)` and pads the result to 8 components (`hexToPigmentLatent`, lines 24–25). Mixbox's latent is 7 meaningful values: `c0..c3` are the four pigment concentrations (which sum to 1) and the remaining 3 are RGB residuals that capture the part of the colour the four primaries cannot reproduce. The 8th slot is zero padding.

2. **Latent → brush uniform.** The 7+1 latent is written into the brush uniform buffer and read by the compute shader as two `vec4`s: `pigment0` (`c0..c3`) and `pigment1` (`residual.xyz` + an unused `.w`).

3. **Accumulation (paint compute shader).** In `getPaintShader()` ([`src/simulation/fluid.ts`](../src/simulation/fluid.ts), ~line 734) the per-pixel deposit is computed (`let deposit = influence * 0.55 * flow;`, ~line 760) and added into the two latent storage textures:

   ```wgsl
   latent0 = latent0 + pigment0 * deposit;                              // c0..c3
   latent1 = vec4<f32>(latent1.xyz + pigment1.xyz * deposit,            // residual
                       latent1.w + deposit);                            // weight accumulator
   ```

   `latent1.w` is the running sum of deposits — the `Σ wᵢ` denominator. Both textures are `rgba16float` ping-pong pairs (allocated ~lines 249–290).

4. **Decode (render fragment shader).** `getRenderFragmentShader()` ([`src/simulation/fluid.ts`](../src/simulation/fluid.ts), ~lines 838–904) reads the accumulators, divides by `weight` to recover the averaged latent, evaluates a 20-term polynomial (`evalPolynomial`, ~line 844, called ~line 883) plus the residual to produce sRGB, and then composites against a white background:

   ```wgsl
   let weight   = latent1.w;
   let base     = evalPolynomial(latent0.x, latent0.y, latent0.z, latent0.w);
   // ... + residual ...
   let coverage = clamp(weight, 0.0, 1.0);                              // ~line 899
   let color    = background * (1.0 - coverage) + paintColor * coverage; // ~line 901
   ```

Reference pigment definitions and the display palette live in [`src/lib/pigments.ts`](../src/lib/pigments.ts).

---

## 3. Findings

Severity-ranked. P0 = physically wrong / visible artefact, P1 = significant accuracy loss, P2 = correctness/maintainability, P3 = legal / dead code.

| #   | Severity | Finding | Location |
| --- | -------- | ------- | -------- |
| F1  | P0 | Compositing done in sRGB (gamma) space — `color = bg*(1-cov) + paint*cov` on a non-sRGB canvas format → dark/muddy soft-brush edges, hue shifts. Must blend in linear light. | `fluid.ts` render frag ~901; canvas format `getPreferredCanvasFormat()` ~115 |
| F2  | P0 | Watercolor model but opaque (oil/acrylic) intended — thin paint lerps toward white (`coverage=clamp(weight)`, `bg=white`) → desaturates where opaque paint should stay full chroma. | `fluid.ts` ~899–901 |
| F3  | P0 | No tinting strength — Mixbox mixes every colour with equal power; real phthalo blue overpowers titanium white at a fraction of the volume. | `fluid.ts` paint shader deposit ~760–764 |
| F4  | P1 | FP16 accumulation precision — latent0/1 and unbounded `.w` weight accumulate many small deposits in `rgba16float` (10-bit mantissa); near 1.0 the step is ~0.001 so small deposits round away. | `fluid.ts` texture alloc ~249–290 |
| F5  | P1 | Frame-rate-dependent deposition — fixed deposit per frame regardless of pointer speed/Δt → slow strokes over-deposit, fast under-deposit, overlaps double-deposit. Should be distance-dosed (MyPaint `dabs_per_actual_radius`). | `fluid.ts` paint shader ~759–760 |
| F6  | P2 | Palette uses display primaries not pigments — `#235CFF`, `#FFE300` are screen primaries, far more saturated than real paint. | `pigments.ts` 14–63 |
| F7  | P2 | Latent padded to 8 components; only 0–6 meaningful; `mixbox.d.ts` missing `latentToRgb`/`LATENT_SIZE`. | `lib/mixbox.ts`, `types/mixbox.d.ts` |
| F8  | P2 | No mixing tests validating ground truth. | (none) |
| F9  | P3 | Mixbox licence is CC BY-NC (non-commercial); `spectral.js` is MIT. | dependency `mixbox@2.0.0` |
| F10 | P3 | Diffusion shader is dead (`DIFFUSION_STRENGTH=0`); no wet-on-wet transport. | `fluid.ts` line 10, 549 |

### F1 — Compositing in gamma space (P0)

The final composite `color = background * (1 - coverage) + paintColor * coverage` is a linear interpolation between two colours. That operation is only physically correct when its operands are **linear-light** radiance values. Here `paintColor` is sRGB (Mixbox decodes to sRGB) and the canvas uses `navigator.gpu.getPreferredCanvasFormat()` (~line 115), which on virtually every platform returns `bgra8unorm` — a non-`-srgb` format. So the GPU writes the already-gamma-encoded value straight to the framebuffer with no decode/encode around the blend.

Blending gamma-encoded values pulls intermediate colours toward darker, less saturated results: a 50% feathered edge between white paper and a saturated stroke lands well below the true midpoint luminance, producing the characteristic muddy/dark halo at soft-brush edges and visible hue shifts (most severe across complementary or high-chroma pairs). The fix is to decode operands to linear, blend, and re-encode — most cheaply by using an `*-srgb` canvas format (or a linear intermediate target) so the hardware does the transfer-function conversion around the blend. See F-section 4, "Linear-light compositing."

### F2 — Watercolour opacity model where opaque paint is intended (P0)

`coverage = clamp(weight, 0.0, 1.0)` and `color = background*(1-coverage) + paint*coverage`, with `background = white`. This means thin paint (low accumulated weight) is rendered as a lerp **toward white**, i.e. the colour washes out toward the paper as if it were translucent watercolour over a white ground. For an oil/acrylic app this is wrong: a thin scrape of opaque paint should retain its full chroma and simply cover less area, not desaturate toward white. The white "bleed-through" both lowers saturation everywhere weight is below 1 and couples coverage (an alpha/edge concept) to colour (which should be pigment-determined). The target model decouples them: treat white as an actual pigment in the mix (titanium white), and use coverage/alpha **only** to soften stroke edges against whatever is already on the canvas, never to lerp the colour toward paper.

### F3 — No tinting strength (P0)

Mixbox's weighted average gives every contributing colour equal influence per unit weight. Real pigments do not behave this way: tinting (colouring) strength varies by one to two orders of magnitude. A trace of phthalo blue visibly tints a large mass of titanium white; the reverse — a trace of white into phthalo — barely registers. Because the deposit term (`influence * 0.55 * flow`, ~lines 760–764) is identical regardless of which pigment is being laid down, equal volumes mix to a perceptual midpoint instead of the strong pigment dominating. A per-pigment tinting-strength scalar should weight each pigment's contribution into the accumulator (this is exactly what `spectral.js` does via its effective-concentration term `C = f² · T² · L`; see section 4).

### F4 — FP16 accumulation precision (P1)

Both latent textures and the weight accumulator are `rgba16float` (allocated ~lines 249–290). Half-float has a 10-bit mantissa, so near magnitude 1.0 the representable step is ≈2⁻¹⁰ ≈ 0.001. The weight accumulator `latent1.w` is unbounded and grows with every frame of a held stroke; once it reaches the low single digits, a per-frame deposit of ~0.005 is near the rounding floor and successive small deposits can quantise away entirely (`x + ε == x`). This shows up as strokes that stop building colour, banding in slow gradients, and pixels that "stick" at a value. Promoting the accumulators to `rgba32float` removes the problem at the cost of bandwidth/memory; alternatively, normalise weight (keep it bounded) so the accumulator never enters the coarse part of the FP16 range.

### F5 — Frame-rate-dependent deposition (P1)

The deposit applied per frame is fixed (`influence * 0.55 * flow`, ~lines 759–760) and is not scaled by pointer velocity or frame delta-time. The amount of paint laid down therefore depends on how many frames the pointer spends over a pixel: a slow stroke (many frames per unit distance) over-deposits, a fast stroke under-deposits, and the app's behaviour changes with display refresh rate. Overlapping passes double-deposit. The standard fix, used by MyPaint, is **distance-dosed** deposition: emit dabs at a fixed spacing along the actual pointer path (`dabs_per_actual_radius`) so the dose is a function of distance travelled, not elapsed frames — making strokes resolution- and frame-rate-independent.

### F6 — Palette uses display primaries, not pigments (P2)

The palette in [`pigments.ts`](../src/lib/pigments.ts) (lines 14–63) is built from screen primaries such as `#235CFF` (primary blue) and `#FFE300` (primary yellow). These are near the sRGB gamut boundary — far more saturated than any real paint. Feeding them through Mixbox produces mixes that are technically correct for those inputs but unlike anything a painter would see on a palette, because no physical pigment sits that close to the display primaries. Replacing them with measured pigment sRGB values (the Mixbox reference set in section 4 — titanium white, cadmium yellow, quinacridone magenta, ultramarine, phthalo blue/green, etc.) immediately makes mixes look like real paint.

### F7 — Latent padding and incomplete type declarations (P2)

`hexToPigmentLatent` pads Mixbox's latent to 8 components ([`lib/mixbox.ts`](../src/lib/mixbox.ts), lines 13–25) while only indices 0–6 are meaningful; the 8th is dead. More importantly, [`types/mixbox.d.ts`](../src/types/mixbox.d.ts) only declares `lerp` and `rgbToLatent` — it is missing `latentToRgb` and the `LATENT_SIZE` constant that the real package exports. Any future code that needs the inverse decode in JS (e.g. for tests or a CPU reference) has no typed entry point and would have to cast through `any`, defeating the type-safety goal. The declaration should mirror the package's actual surface.

### F8 — No ground-truth mixing tests (P2)

There is no test that asserts a known mix (e.g. blue + yellow → green, or a published Mixbox reference pair) lands within a tolerance. Colour algorithms are exactly the kind of code where a silent regression (a wrong index, a missing residual term, a gamma slip) produces output that still "looks like paint" and passes review unnoticed. A small deterministic ΔE harness over a handful of canonical mixes would catch these and is a prerequisite for safely swapping engines (section 5).

### F9 — Licence mismatch (P3)

The `mixbox@2.0.0` dependency is licensed **CC BY-NC** (non-commercial). Any commercial use of this app requires a paid Mixbox licence from Scrtwpns. `spectral.js` is **MIT** and carries no such restriction. If commercial shipping is on the table, this is a blocking constraint on Mixbox as the production engine (see section 6).

### F10 — Dead diffusion shader (P3)

`DIFFUSION_STRENGTH` is hard-coded to `0` ([`fluid.ts`](../src/simulation/fluid.ts) line 10) and gated everywhere it is used (`if (DIFFUSION_STRENGTH > 0)`, line 549; written to a uniform at line 639). The diffusion/transport pass therefore never runs, so there is no wet-on-wet pigment movement — strokes are purely local deposits. Not a bug, but a disabled feature worth either wiring up (with a non-zero strength and validation) or removing to reduce dead surface area.

---

## 4. World-class background

The gold-standard approaches for physically-plausible pigment mixing, with citations.

### Kubelka–Munk theory

Kubelka–Munk (K-M) models a paint layer by two wavelength-dependent coefficients: **K** (absorption) and **S** (scattering). For an opaque layer the reflectance is

$$ R = 1 + \frac{K}{S} - \sqrt{\left(\frac{K}{S}\right)^2 + 2\frac{K}{S}} $$

and mixtures combine **linearly in K and S** weighted by concentration:

$$ K_{\text{mix}} = \sum_i c_i K_i, \qquad S_{\text{mix}} = \sum_i c_i S_i. $$

The **single-constant** formulation tracks only the ratio `K/S` (adequate for many opaque mixes); the **two-constant** formulation tracks `K` and `S` separately (needed when scattering varies independently, e.g. tints with white). The reason K-M gives blue + yellow → green where naive RGB averaging gives a desaturated grey is that mixing happens in *spectral absorption* space: blue paint absorbs long wavelengths, yellow absorbs short ones, and the surviving band in the middle is green. Averaging RGB triples instead cancels the chroma and lands on grey.

- Kubelka–Munk theory: <https://en.wikipedia.org/wiki/Kubelka%E2%80%93Munk_theory>
- K-M overview (Wikipedia, Kubelka–Munk model context): <https://en.wikipedia.org/wiki/Kubelka%E2%80%93Munk_theory>

### Spectral upsampling (RGB → reflectance)

K-M needs a reflectance/absorption spectrum, but UI colours arrive as RGB. Spectral upsampling reconstructs a plausible reflectance curve from an sRGB triple:

- **Scott Burns — LHTSS** (Least Hyperbolic Tangent Slope Squared): reflectance curves from sRGB. <http://scottburns.us/reflectance-curves-from-srgb/>, paper [arXiv:1710.05732](https://arxiv.org/abs/1710.05732).
- **Mallett & Yuksel 2019** — Spectral Primary Decomposition for Rendering with sRGB Reflectance: <http://www.cemyuksel.com/research/papers/spectral_primary_decomposition.pdf>.
- **Jakob & Hanika 2019** — A Low-Dimensional Function Space for Efficient Spectral Upsampling (sigmoid model): <https://jo.dreggn.org/home/2019_sigmoid.pdf>.

### Mixbox

Mixbox (Sochorová & Jamriška, SIGGRAPH Asia 2021) trains a latent representation against a K-M model over **four primaries** — phthalo blue, quinacridone magenta, Hansa yellow, and titanium white — and achieves sub-JND (just-noticeable-difference) error against ground truth. Stated limitations, directly relevant to this audit: **only four primaries**, **opaque only** (no glazing/transparency), and **no tinting strength** (F3).

- Project page: <https://scrtwpns.com/mixbox/>
- Paper: <https://scrtwpns.com/mixbox.pdf>

### spectral.js

`spectral.js` (MIT) is a single-constant Kubelka–Munk implementation that reconstructs a **7-primary** reflectance from a Burns LHTSS variant and applies an effective-concentration term

$$ C = f^2 \cdot T^2 \cdot L $$

where `T` is a per-pigment **tinting strength** — directly addressing F3.

- Repository: <https://github.com/rvanwijnen/spectral.js>

### Linear-light compositing

All alpha blending and filtering must happen in linear light, not gamma space (F1):

- NVIDIA, *GPU Gems 3*, Ch. 24 — "The Importance of Being Linear": <https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-24-importance-being-linear>
- John Novak — "What every coder should know about gamma": <https://blog.johnnovak.net/2016/09/21/what-every-coder-should-know-about-gamma/>

### Reference implementations

- MyPaint spectral mixing notes (and the `dabs_per_actual_radius` distance-dosing model relevant to F5): <https://github.com/mypaint/mypaint/blob/master/doc/spectral/spectral.md>
- Krita spectral pigment mixing (Kubelka–Munk based brush blending).
- David Li — interactive fluid paint demo: <http://david.li/paint/>

### Reference pigment sRGB values

From the official Mixbox GLSL (<https://github.com/scrtwpns/mixbox/blob/master/shaders/mixbox.glsl>) — useful for replacing the display-primary palette (F6):

| Pigment | sRGB (approx.) |
| --- | --- |
| Titanium White | 1.0, 1.0, 1.0 |
| Cadmium Yellow | 0.996, 0.925, 0.0 |
| Hansa Yellow | 0.988, 0.827, 0.0 |
| Cadmium Red | 1.0, 0.153, 0.008 |
| Quinacridone Magenta | 0.502, 0.008, 0.180 |
| Ultramarine | 0.098, 0.0, 0.349 |
| Phthalo Blue | 0.051, 0.106, 0.267 |
| Phthalo Green | 0.0, 0.235, 0.196 |

---

## 5. Recommended target architecture

A spectral Kubelka–Munk core running in a **linear-light** pipeline, with **opaque (oil/acrylic) compositing**, **per-pigment tinting strength**, and validation by a **deterministic ΔE test harness**.

**Engine abstraction.** Introduce a `MixEngine` interface with three operations — `encode` (RGB → engine-native latent/spectrum), `mix` (weighted combine in that space), and `decode` (back to colour). Provide two implementations behind it:

- `MixboxEngine` — wraps the current Mixbox path; retained as the **fidelity reference** for benchmarking.
- `SpectralEngine` — `spectral.js` (MIT, commercial-safe), the candidate production engine.

This makes the engine swappable, lets the ΔE harness benchmark both against each other and against published references, and isolates the colour math from the WebGPU plumbing.

**Pipeline rules:**

- **Linear everywhere.** Decode to linear before any blend/filter, re-encode only at present (fixes F1). Use an `*-srgb` canvas format or an explicit linear intermediate.
- **Opaque coverage decoupled from colour.** Alpha only softens stroke edges against existing canvas content; white is a *pigment* in the mix, not paper bleed-through (fixes F2).
- **Tinting strength weights mixes.** Per-pigment `T` scales each contribution into the accumulator (fixes F3; native in `spectral.js`).
- **`rgba32float` accumulators.** Removes FP16 quantisation in the weight/latent sums (fixes F4).
- **Distance-dosed deposition.** Emit dabs at fixed spacing along the pointer path so dose is frame-rate- and resolution-independent (fixes F5).
- **Measured pigment palette.** Seed the palette from the Mixbox reference sRGB values, not display primaries (fixes F6).
- **ΔE harness.** Deterministic tests over canonical mixes, gating any engine change (fixes F8).

---

## 6. Recommendation

The user wants **full spectral mixing with tinting strength**, and **commercial-safety matters**. Both point to the same choice:

**Adopt `spectral.js` (MIT) as the production engine.** It is a single-constant Kubelka–Munk model with 7-primary reflectance and built-in per-pigment tinting strength (`C = f²·T²·L`), and its MIT licence removes the CC BY-NC commercial restriction that blocks Mixbox (F9).

**Retain Mixbox as a fidelity reference.** Keep `MixboxEngine` behind the `MixEngine` interface purely for benchmarking — Mixbox's sub-JND accuracy makes it the right yardstick to confirm the spectral engine's mixes are perceptually faithful before it ships.

The empirical head-to-head (ΔE across canonical mixes, performance, and visual comparison) will be produced with the ΔE harness from section 5 and appended below.

## 7. Engine benchmark

Measured with `npx vite-node src/lib/color/benchmark.ts` over all 55 unordered
pigment pairs in the reference palette, mixing 50/50 with each pigment's tinting
strength applied. ΔE00 here is the *disagreement between the two engines* on the
same input — not error against a ground truth (neither engine is ground truth
for arbitrary sRGB pigments).

### Engine agreement (50/50 mixes, 55 pairs)

| Metric | ΔE00 (Mixbox vs Spectral) |
| --- | --- |
| Mean | 7.52 |
| Median | 6.32 |
| Max | 28.41 |

Most divergent pairs:

| Pigment A | Pigment B | ΔE00 |
| --- | --- | --- |
| Hansa Yellow | Ultramarine Blue | 28.41 |
| Cadmium Yellow | Ultramarine Blue | 26.34 |
| Phthalo Blue | Burnt Sienna | 21.12 |
| Cobalt Blue | Burnt Sienna | 20.46 |
| Ultramarine Blue | Burnt Sienna | 17.17 |

### Runtime (per 2-pigment CPU mix)

| Engine | µs/mix |
| --- | --- |
| Mixbox | 0.22 |
| Spectral | 1.87 |

### Reading the results

- The engines agree to a just-noticeable level on near-neutral and same-family
  mixes, but **diverge sharply on yellow + blue** (the canonical green) and on
  earth + blue greys — the mixes where pigment behaviour matters most. Engine
  choice is therefore a *visible* product decision, not a rounding detail.
- Both produce a green for blue+yellow (the additive-RGB failure mode is gone in
  both); they differ on *which* green. Spectral's is the explicit Kubelka–Munk
  result; Mixbox's is the trained-LUT result.
- Mixbox is ~8× faster on CPU (LUT vs spectral integration), but both are far
  below any frame budget. On the GPU the decision is reversed in cost terms:
  Mixbox decodes with a 20-term polynomial, spectral with a fixed-primary K–M
  evaluation — both cheap per fragment.

### Decision: ship `SpectralEngine`, keep `MixboxEngine` as reference

`spectral.js` is selected as the production engine because it satisfies all three
requirements the divergence makes consequential: it is **MIT-licensed**
(commercial-safe, removing the F9 blocker), it models **per-pigment tinting
strength natively** (F3), and it is an explicit **Kubelka–Munk** model whose
behaviour is inspectable and tunable. `MixboxEngine` is retained behind the
`MixEngine` interface as a sub-JND fidelity yardstick for regression tests.

## 8. What shipped (implementation notes)

### CPU layer (`src/lib/color/`)
- `srgb.ts` — piecewise sRGB ⇄ linear transfer + hex parsing.
- `delta-e.ts` — CIELAB + CIEDE2000 (validated against the Sharma et al. vectors).
- `mix-engine.ts` — the `MixEngine` interface and `PaintComponent` (rgb + weight +
  tinting strength).
- `mixbox-engine.ts` / `spectral-engine.ts` — the two engines; `spectral.js` is the
  recommended production engine, Mixbox the reference.
- `benchmark.ts` — `npx vite-node src/lib/color/benchmark.ts` reproduces §7.
- `pigments.ts` — measured/reference pigment masstones, Colour Index codes, and
  per-pigment tinting strengths (F3, F6).

### GPU pipeline (`src/simulation/fluid.ts`)
The real-time canvas was rebuilt to fix the pipeline findings:
- **F1 linear compositing** — the canvas is configured with an sRGB render-target
  view (`viewFormats`), and the fragment shader composites paint over the
  substrate in **linear light**, letting the GPU gamma-encode on write. No more
  muddy/dark soft-brush edges.
- **F2 opaque model** — colour is the full-chroma normalised pigment mix,
  decoupled from coverage; raw deposit (`latent0.w`) only feathers the stroke
  edge. Thin paint keeps its chroma instead of fading to the paper. The fourth
  Mixbox concentration is reconstructed at decode (`c3 = 1 − c0 − c1 − c2`),
  which frees a channel to carry coverage without a third texture.
- **F3 tinting strength** — the brush carries the pigment's tinting strength;
  the colour-mix deposit is scaled by it (so phthalo dominates), while the
  coverage deposit is not (so weak-tinting white still covers).
- **F4 precision** — latent accumulators moved from `rgba16float` to
  `rgba32float`, read via `textureLoad`.
- **F5 deposition** — deposit is scaled by Δt, making the paint-down rate
  frame-rate independent.

### Known constraint: the GPU still decodes via the Mixbox latent
The GPU keeps the **Mixbox 7-component latent** as its compact per-pixel
accumulation format because it fits two textures and its weighted-average
mixing is provably correct. An exact `spectral.js` decode on the GPU would
require accumulating the 38-wavelength Kubelka–Munk K/S curve per pixel
(~10 RGBA textures, doubled for ping-pong) — impractical for a real-time
ping-pong canvas. The faithful next step is a **7-primary concentration**
representation (W/C/M/Y/R/G/B, two textures) decoded with in-shader
single-constant Kubelka–Munk — matching `spectral.js`'s own upsampling basis —
which would put the spectral engine on the GPU at the current footprint. Until
then, `spectral.js` powers the CPU colour path and is the recommended engine if
Mixbox's CC BY-NC licence (F9) is a blocker for the GPU decode.
