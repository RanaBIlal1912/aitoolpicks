import * as THREE from "three";
import { SCENES } from "./scenes";

const W = 1600;
const H = 900;
const status = document.getElementById("status")!;
const only = new URLSearchParams(location.search).get("only");

function noiseTile(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** Film-style finishing: soft bloom, vignette and fine grain. */
function finish(src: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const ctx = out.getContext("2d")!;
  ctx.filter = "saturate(0.68) brightness(0.98)";
  ctx.drawImage(src, 0, 0, W, H);
  ctx.filter = "none";
  // bloom: blurred copies added back with "screen"
  const bright = document.createElement("canvas");
  bright.width = W;
  bright.height = H;
  const b = bright.getContext("2d")!;
  b.filter = "brightness(0.85) contrast(2.1) blur(2px)";
  b.drawImage(out, 0, 0);
  ctx.globalCompositeOperation = "screen";
  for (const [blur, alpha] of [[8, 0.3], [28, 0.34], [80, 0.26]] as const) {
    ctx.globalAlpha = alpha;
    ctx.filter = `blur(${blur}px)`;
    ctx.drawImage(bright, 0, 0);
  }
  ctx.filter = "none";
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  // vignette
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.72);
  v.addColorStop(0, "rgba(2,3,10,0)");
  v.addColorStop(1, "rgba(2,3,10,0.72)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  // grain
  const tile = noiseTile();
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = "overlay";
  for (let y = 0; y < H; y += 256) for (let x = 0; x < W; x += 256) ctx.drawImage(tile, x, y);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  return out;
}

function variant(src: HTMLCanvasElement, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const ratio = w / h;
  let sw = src.width;
  let sh = src.width / ratio;
  if (sh > src.height) {
    sh = src.height;
    sw = src.height * ratio;
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, (src.width - sw) / 2, (src.height - sh) / 2, sw, sh, 0, 0, w, h);
  return c;
}

async function save(name: string, c: HTMLCanvasElement): Promise<void> {
  const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), "image/jpeg", 0.86));
  const r = await fetch(`/__save?name=${encodeURIComponent(name)}`, { method: "POST", body: blob });
  if (!r.ok) throw new Error(`save failed for ${name}`);
}

async function main() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = "width:640px;height:360px;display:block";

  const names = Object.keys(SCENES).filter((n) => !only || only.split(",").includes(n));
  for (const name of names) {
    status.textContent = `Rendering ${name}...`;
    const shot = SCENES[name](renderer, W / H);
    renderer.toneMappingExposure = shot.exposure;
    renderer.render(shot.scene, shot.camera);
    await new Promise((r) => setTimeout(r, 60)); // not requestAnimationFrame: it never fires in a hidden tab
    renderer.render(shot.scene, shot.camera);
    const done = finish(renderer.domElement);
    await save(`${name}.jpg`, done);
    await save(`${name}-og.jpg`, variant(done, 1200, 630));
    await save(`${name}-sm.jpg`, variant(done, 640, 360));
    shot.dispose();
    shot.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    status.textContent = `Saved ${name}`;
  }
  status.textContent = `DONE ${names.join(",")}`;
  (window as unknown as { __done: boolean }).__done = true;
}

main().catch((e) => {
  status.textContent = `ERROR ${e?.message ?? e}`;
  console.error(e);
});
