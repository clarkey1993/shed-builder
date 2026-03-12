/**
 * useShedTextures - PBR procedural textures for shed realism.
 * Generates wood grain, roof felt, OSB/floor, and grass textures.
 * Optional: Add files to public/textures/ (wood_diffuse.jpg, etc.) and use useTexture for higher quality.
 */
import { useMemo } from "react";
import * as THREE from "three";

// Shiplap: vertical timber boards with horizontal overlap lines (Page 9 specs)
function createShiplapTexture(width = 256, height = 256, options = {}) {
  const { plankWidth = 24, plankHeight = 20, gapColor = "#8b7355", baseColor = "#c4a574" } = options;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const baseR = parseInt(baseColor.slice(1, 3), 16);
  const baseG = parseInt(baseColor.slice(3, 5), 16);
  const baseB = parseInt(baseColor.slice(5, 7), 16);
  const gapR = parseInt(gapColor.slice(1, 3), 16);
  const gapG = parseInt(gapColor.slice(3, 5), 16);
  const gapB = parseInt(gapColor.slice(5, 7), 16);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inVertGap = (x % plankWidth) < 1;
      const inHorizLine = (y % plankHeight) < 1;
      const shade = 0.94 + (Math.sin(x * 0.05) * 0.03) + (inHorizLine ? -0.03 : 0);
      const r = inVertGap || inHorizLine ? gapR : Math.min(255, baseR * shade);
      const g = inVertGap || inHorizLine ? gapG : Math.min(255, baseG * shade);
      const b = inVertGap || inHorizLine ? gapB : Math.min(255, baseB * shade);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Bump map for wood grain (grayscale from shiplap)
function createWoodBumpTexture(width = 256, height = 256, plankWidth = 24, plankHeight = 20) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inVertGap = (x % plankWidth) < 1;
      const inHorizLine = (y % plankHeight) < 1;
      const shade = 0.5 + (Math.sin(x * 0.05) * 0.15) + (inHorizLine ? -0.2 : 0);
      const v = Math.min(255, Math.max(0, 128 + shade * 100));
      const i = (y * width + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Wood framing (studs, etc)
function createWoodTexture(width = 128, height = 128, options = {}) {
  const { baseColor = "#8b6914", gapColor = "#5c4033", plankHeight = 16 } = options;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const baseR = parseInt(baseColor.slice(1, 3), 16);
  const baseG = parseInt(baseColor.slice(3, 5), 16);
  const baseB = parseInt(baseColor.slice(5, 7), 16);
  const gapR = parseInt(gapColor.slice(1, 3), 16);
  const gapG = parseInt(gapColor.slice(3, 5), 16);
  const gapB = parseInt(gapColor.slice(5, 7), 16);
  for (let y = 0; y < height; y++) {
    const inGap = (y % plankHeight) < 1;
    const shade = 0.92 + (Math.random() - 0.5) * 0.08;
    const r = inGap ? gapR : Math.min(255, baseR * shade);
    const g = inGap ? gapG : Math.min(255, baseG * shade);
    const b = inGap ? gapB : Math.min(255, baseB * shade);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, width, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Dark matte roofing felt: charcoal/slate tone with fibre-like texture. Non-shiny, realistic.
function createRoofTexture(width = 256, height = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(width, height);
  const base = [0x2a, 0x2a, 0x2e]; // Dark charcoal with slight slate tint
  for (let i = 0; i < img.data.length; i += 4) {
    const x = (i / 4) % width;
    const y = Math.floor(i / 4 / width);
    const grain = Math.sin(x * 0.12) * 0.04 + Math.sin(y * 0.18) * 0.04;
    const fibre = (Math.sin(x * 1.5 + y * 1.0) * 0.5 + 0.5) * 0.08;
    const v = 0.86 + grain + fibre + (Math.random() - 0.5) * 0.06;
    const s = Math.min(1.02, Math.max(0.95, v));
    img.data[i] = Math.min(255, Math.max(0, base[0] * s));
    img.data[i + 1] = Math.min(255, Math.max(0, base[1] * s));
    img.data[i + 2] = Math.min(255, Math.max(0, base[2] * s));
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// OSB / floor: light gray with wood chip pattern
function createOSBTexture(width = 128, height = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#b8b0a8";
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const w = 2 + Math.random() * 4;
    const h = 1 + Math.random() * 2;
    ctx.fillStyle = `rgba(100,90,80,${0.3 + Math.random() * 0.4})`;
    ctx.fillRect(x, y, w, h);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function useShedTextures() {
  return useMemo(() => {
    const woodCladding = createShiplapTexture(256, 256, { baseColor: "#d4a574", gapColor: "#b89870", plankWidth: 24 });
    const woodCladdingBump = createWoodBumpTexture(256, 256, 24, 20);
    const woodFraming = createWoodTexture(128, 128, { baseColor: "#b8926a", gapColor: "#8b7355", plankHeight: 16 });
    const roofFelt = createRoofTexture(128, 128);
    const osb = createOSBTexture(128, 128);
    return {
      woodCladding,
      woodCladdingBump,
      woodFraming,
      roofFelt,
      osb,
    };
  }, []);
}
