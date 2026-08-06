"use client";

import { useEffect, useRef, type RefObject } from "react";

type Ember = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  opacity: number;
  peakOpacity: number;
  phase: number;
  exitY: number;
  exitProgress: number;
  visible: boolean;
};

type Flash = {
  active: boolean;
  age: number;
  life: number;
  dx: number;
  dy: number;
  height: number;
  width: number;
  lean: number;
  opacity: number;
  phase: number;
};

const SOURCE_WIDTH = 1536;
const SOURCE_HEIGHT = 1024;

// Seven perspective-aware zones: three rear, three front, one deep center.
const COAL_ZONES = [
  [-27, 14, 12, 2570, 0.45, 0.58],
  [0, 18, 13, 3340, 2.2, 0.64],
  [27, 14, 12, 2890, 4.4, 0.56],
  [-27, 12, 15, 2180, 3.1, 1],
  [0, 18, 16, 3010, 0.85, 1],
  [27, 12, 15, 3670, 5.2, 0.94],
  [0, 17, 10, 2410, 1.7, 0.82],
] as const;

// Heat breaks through the HMD rim and the real gap between the two lower coals.
const FLASH_ORIGINS = [
  [-34, 17],
  [-17, 20],
  [0, 22],
  [17, 20],
  [34, 17],
] as const;

// Only dark gaps and inner HMD areas; never the visible faces of coal cubes.
const EMBER_ORIGINS = [
  [-15, 44],
  [15, 44],
  [0, 48],
  [-29, 42],
  [29, 42],
  [2, 53],
] as const;

const makeEmberPool = (size: number): Ember[] => Array.from({ length: size }, () => ({
  active: false,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  age: 0,
  life: 1,
  size: 1,
  opacity: 0,
  peakOpacity: 0,
  phase: 0,
  exitY: 0,
  exitProgress: 0,
  visible: false,
}));

const makeFlashPool = (): Flash[] => Array.from({ length: 6 }, () => ({
  active: false,
  age: 0,
  life: 1,
  dx: 0,
  dy: 0,
  height: 3,
  width: 1,
  lean: 0,
  opacity: 1,
  phase: 0,
}));

function EffectsCanvas({ scene, globalLight }: {
  scene: RefObject<HTMLDivElement | null>;
  globalLight: RefObject<HTMLDivElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const node = scene.current;
    const light = globalLight.current;
    const hero = node?.closest<HTMLElement>(".hero");
    if (!canvas || !node || !light || !hero) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const embers = makeEmberPool(10);
    const flashes = makeFlashPool();
    let width = 0;
    let height = 0;
    let imageScale = 1;
    let imageOffsetX = 0;
    let imageOffsetY = 0;
    let mobile = false;
    let frame = 0;
    let previous = performance.now();
    let heroBounds = hero.getBoundingClientRect();
    let targetClientX = window.innerWidth * 0.5;
    let targetClientY = window.innerHeight * 0.5;
    let currentClientX = targetClientX;
    let currentClientY = targetClientY;
    let smoothX = 0;
    let smoothY = 0;
    let pointerInHero = false;
    let intersecting = true;
    let pageVisible = document.visibilityState === "visible";
    let running = false;
    let emberClock = 0;
    let nextEmber = 2000 + Math.random() * 1000;
    let flashClock = 0;
    let nextFlash = 420 + Math.random() * 520;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      mobile = width < 700;
      const dpr = mobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      imageScale = Math.max(width / SOURCE_WIDTH, height / SOURCE_HEIGHT);
      imageOffsetX = (width - SOURCE_WIDTH * imageScale) * (mobile ? 0.72 : 1);
      imageOffsetY = (height - SOURCE_HEIGHT * imageScale) * 0.5;
      canvas.dataset.dpr = dpr.toFixed(2);
      canvas.dataset.maxParticles = mobile ? "5" : "8";
    };

    const sourceX = (value: number) => imageOffsetX + value * imageScale;
    const sourceY = (value: number) => imageOffsetY + value * imageScale;

    const clipKaloud = (anchorX: number, anchorY: number) => {
      context.beginPath();
      context.ellipse(
        anchorX,
        anchorY + 3 * imageScale,
        66 * imageScale,
        47 * imageScale,
        0,
        0,
        Math.PI * 2,
      );
      context.clip();
    };

    const spawnFlashes = () => {
      const amount = 2 + (Math.random() > 0.58 ? 1 : 0);
      for (let created = 0; created < amount; created += 1) {
        for (let index = 0; index < flashes.length; index += 1) {
          const flash = flashes[index];
          if (flash.active) continue;
          flash.active = true;
          flash.age = 0;
          flash.life = 520 + Math.random() * 430;
          const origin = FLASH_ORIGINS[Math.floor(Math.random() * FLASH_ORIGINS.length)];
          flash.dx = origin[0] + (-2 + Math.random() * 4);
          flash.dy = origin[1] + (-1.5 + Math.random() * 3);
          flash.height = Math.random() > 0.92 ? 9 + Math.random() * 3 : 3 + Math.random() * 5;
          flash.width = 0.9 + Math.random() * 1.5;
          flash.lean = -2.2 + Math.random() * 4.4;
          flash.opacity = 0.54 + Math.random() * 0.3;
          flash.phase = Math.random() * Math.PI * 2;
          break;
        }
      }
    };

    const drawCoalHeat = (now: number, delta: number) => {
      const anchorX = sourceX(SOURCE_WIDTH * 0.72);
      const anchorY = sourceY(SOURCE_HEIGHT * 0.065);

      context.save();
      clipKaloud(anchorX, anchorY);

      // Rear depth: weak, low glow that is then partially occluded by coal crust.
      context.globalCompositeOperation = "screen";
      for (let index = 0; index < 3; index += 1) {
        const [dx, dy, radius, period, phase, strength] = COAL_ZONES[index];
        const pulse = 0.86 + Math.sin(now / period * Math.PI * 2 + phase) * 0.09;
        const x = anchorX + dx * imageScale;
        const y = anchorY + (dy + 8) * imageScale;
        const r = radius * 1.65 * imageScale;
        const rearGlow = context.createRadialGradient(x, y, 0, x, y, r);
        rearGlow.addColorStop(0, `rgba(255,103,24,${0.36 * pulse * strength})`);
        rearGlow.addColorStop(0.46, `rgba(208,43,12,${0.22 * pulse * strength})`);
        rearGlow.addColorStop(1, "rgba(116,19,7,0)");
        context.fillStyle = rearGlow;
        context.fillRect(x - r, y - r, r * 2, r * 2);
      }

      // Middle depth: independent hot gaps and cracks, brighter than the surfaces.
      context.globalCompositeOperation = "screen";
      const aura = context.createRadialGradient(anchorX, anchorY + 5 * imageScale, 1, anchorX, anchorY + 5 * imageScale, 82 * imageScale);
      aura.addColorStop(0, "rgba(255,113,27,.25)");
      aura.addColorStop(0.38, "rgba(224,51,15,.12)");
      aura.addColorStop(1, "rgba(140,35,14,0)");
      context.fillStyle = aura;
      context.fillRect(anchorX - 86 * imageScale, anchorY - 50 * imageScale, 172 * imageScale, 105 * imageScale);

      for (let index = 0; index < COAL_ZONES.length; index += 1) {
        const [dx, dy, radius, period, phase, strength] = COAL_ZONES[index];
        const pulse = 0.88 + Math.sin(now / period * Math.PI * 2 + phase) * 0.09;
        const x = anchorX + dx * imageScale;
        const y = anchorY + dy * imageScale;
        const r = radius * imageScale;
        const glow = context.createRadialGradient(x, y, 0, x, y, r);
        glow.addColorStop(0, `rgba(255,242,146,${0.88 * pulse * strength})`);
        glow.addColorStop(0.18, `rgba(255,139,29,${0.69 * pulse * strength})`);
        glow.addColorStop(0.58, `rgba(222,48,12,${0.31 * pulse * strength})`);
        glow.addColorStop(1, "rgba(110,20,8,0)");
        context.fillStyle = glow;
        context.fillRect(x - r, y - r, r * 2, r * 2);

      }

      // Front depth: at most three short-lived, differently shaped flashes between coals.
      for (let index = 0; index < flashes.length; index += 1) {
        const flash = flashes[index];
        if (!flash.active) continue;
        flash.age += delta;
        const progress = flash.age / flash.life;
        const envelope = Math.sin(Math.PI * Math.min(1, progress)) * flash.opacity;
        const flameHeight = flash.height * (0.72 + envelope * 0.28);
        const sway = Math.sin(progress * Math.PI * 2.4 + flash.phase) * 1.35;
        const rise = Math.sin(Math.PI * Math.min(1, progress)) * 2.2;
        const baseX = anchorX + (flash.dx + sway) * imageScale;
        const baseY = anchorY + (flash.dy - rise) * imageScale;
        const gradient = context.createLinearGradient(baseX, baseY, baseX + flash.lean, baseY - flameHeight);
        gradient.addColorStop(0, `rgba(200,38,9,${envelope * 0.7})`);
        gradient.addColorStop(0.4, `rgba(255,108,16,${envelope * 0.82})`);
        gradient.addColorStop(0.74, `rgba(255,215,101,${envelope * 0.7})`);
        gradient.addColorStop(1, "rgba(255,236,171,0)");
        context.fillStyle = gradient;
        context.beginPath();
        context.moveTo(baseX - flash.width, baseY);
        context.bezierCurveTo(
          baseX - flash.width * 0.35,
          baseY - flameHeight * 0.44,
          baseX + flash.lean - flash.width * 0.2,
          baseY - flameHeight * 0.75,
          baseX + flash.lean,
          baseY - flameHeight,
        );
        context.bezierCurveTo(
          baseX + flash.lean + flash.width * 0.65,
          baseY - flameHeight * 0.62,
          baseX + flash.width,
          baseY - flameHeight * 0.32,
          baseX + flash.width,
          baseY,
        );
        context.closePath();
        context.fill();
        if (flash.age >= flash.life) flash.active = false;
      }

      // Remove every heat pixel that crosses a coal body. The untouched product
      // image below becomes the occluder, so the glow can only emerge from gaps.
      context.globalCompositeOperation = "destination-out";
      context.fillStyle = "#000";
      const coalOccluders = [
        [-29, 7, 31, 22],
        [0, -2, 30, 22],
        [30, 7, 31, 22],
      ] as const;
      for (let index = 0; index < coalOccluders.length; index += 1) {
        const [dx, dy, coalWidth, coalHeight] = coalOccluders[index];
        const x = anchorX + dx * imageScale;
        const y = anchorY + dy * imageScale;
        context.beginPath();
        context.roundRect(
          x - coalWidth * 0.5 * imageScale,
          y - coalHeight * 0.5 * imageScale,
          coalWidth * imageScale,
          coalHeight * imageScale,
          4 * imageScale,
        );
        context.fill();
      }

      // The dark front lip is painted last, physically occluding front heat and flashes.
      context.globalCompositeOperation = "source-over";
      context.strokeStyle = "rgba(19,8,6,.58)";
      context.lineWidth = Math.max(2, 5.5 * imageScale);
      context.beginPath();
      context.ellipse(anchorX, anchorY + 41 * imageScale, 58 * imageScale, 8 * imageScale, 0, 0.1 * Math.PI, 0.9 * Math.PI);
      context.stroke();
      context.restore();
    };

    const activeEmberCount = () => {
      let active = 0;
      for (let index = 0; index < embers.length; index += 1) if (embers[index].active) active += 1;
      return active;
    };

    const spawnEmbers = () => {
      const anchorX = sourceX(SOURCE_WIDTH * 0.72);
      const anchorY = sourceY(SOURCE_HEIGHT * 0.052);
      const limit = 4;
      const amount = 2 + Math.floor(Math.random() * 3);
      for (let created = 0; created < amount && activeEmberCount() < limit; created += 1) {
        for (let index = 0; index < embers.length; index += 1) {
          const ember = embers[index];
          if (ember.active) continue;
          const origin = EMBER_ORIGINS[Math.floor(Math.random() * EMBER_ORIGINS.length)];
          ember.active = true;
          ember.visible = false;
          ember.x = anchorX + (origin[0] + (Math.random() - 0.5) * 4) * imageScale;
          ember.y = anchorY + (origin[1] + Math.random() * 3) * imageScale;
          ember.vx = -0.008 + Math.random() * 0.016;
          ember.vy = 0.018 + Math.random() * 0.016;
          ember.age = 0;
          ember.life = 450 + Math.random() * 450;
          ember.size = 1 + Math.random() * 1.5;
          ember.opacity = 0;
          ember.peakOpacity = 0.76 + Math.random() * 0.2;
          ember.phase = Math.random() * Math.PI * 2;
          ember.exitProgress = 0.2 + Math.random() * 0.15;
          ember.exitY = ember.y - ember.vy * ember.life * (ember.exitProgress - 0.21 * ember.exitProgress * ember.exitProgress);
          break;
        }
      }
    };

    const updateEmbers = (delta: number) => {
      context.save();
      context.globalCompositeOperation = "screen";
      for (let index = 0; index < embers.length; index += 1) {
        const ember = embers[index];
        if (!ember.active) continue;
        ember.age += delta;
        const progress = Math.min(1, ember.age / ember.life);
        const speed = 1 - progress * 0.42;
        ember.x += ember.vx * delta * speed + Math.sin(ember.phase + progress * 8.5) * 0.0016 * delta;
        ember.y -= ember.vy * delta * speed;
        if (!ember.visible && ember.y <= ember.exitY) ember.visible = true;
        const visibleProgress = Math.max(0, (progress - ember.exitProgress) / (1 - ember.exitProgress));
        const lifecycle = visibleProgress < 0.15
          ? visibleProgress / 0.15
          : visibleProgress <= 0.55
            ? 1
            : Math.max(0, (1 - visibleProgress) / 0.45);
        ember.opacity = ember.visible ? lifecycle * ember.peakOpacity : 0;
        if (ember.visible && ember.opacity > 0) {
          context.fillStyle = `rgba(255,177,72,${ember.opacity})`;
          context.beginPath();
          context.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
          context.fill();
        }
        if (ember.age >= ember.life) {
          ember.active = false;
          ember.visible = false;
          ember.opacity = 0;
        }
      }
      context.restore();
    };

    const animate = (now: number) => {
      if (!pageVisible) {
        running = false;
        canvas.dataset.running = "false";
        return;
      }

      const delta = Math.min(34, now - previous);
      previous = now;
      currentClientX += (targetClientX - currentClientX) * 0.18;
      currentClientY += (targetClientY - currentClientY) * 0.18;
      if (Math.abs(targetClientX - currentClientX) < 0.1) currentClientX = targetClientX;
      if (Math.abs(targetClientY - currentClientY) < 0.1) currentClientY = targetClientY;
      if (!mobile) light.style.transform = `translate3d(${currentClientX - 230}px,${currentClientY - 230}px,0)`;

      const targetX = pointerInHero && !mobile && !reducedMotion.matches
        ? Math.max(-1, Math.min(1, ((currentClientX - heroBounds.left) / heroBounds.width) * 2 - 1))
        : 0;
      const targetY = pointerInHero && !mobile && !reducedMotion.matches
        ? Math.max(-1, Math.min(1, ((currentClientY - heroBounds.top) / heroBounds.height) * 2 - 1))
        : 0;
      smoothX += (targetX - smoothX) * 0.12;
      smoothY += (targetY - smoothY) * 0.12;
      node.style.setProperty("--scene-x", `${smoothX * -22}px`);
      node.style.setProperty("--scene-y", `${smoothY * -10}px`);
      node.style.setProperty("--scene-scale", (1.045 + Math.min(0.015, Math.abs(smoothX) * 0.01 + Math.abs(smoothY) * 0.005)).toFixed(4));

      if (intersecting && !reducedMotion.matches) {
        context.clearRect(0, 0, width, height);
        flashClock += delta;
        if (flashClock >= nextFlash) {
          spawnFlashes();
          flashClock = 0;
          nextFlash = 420 + Math.random() * 620;
        }
        drawCoalHeat(now, delta);
        emberClock += delta;
        if (emberClock >= nextEmber) {
          spawnEmbers();
          emberClock = 0;
          nextEmber = 2000 + Math.random() * 1000;
        }
        updateEmbers(delta);
      }

      const unsettled = Math.abs(targetClientX - currentClientX) > 0.1
        || Math.abs(targetClientY - currentClientY) > 0.1
        || Math.abs(targetX - smoothX) > 0.002
        || Math.abs(targetY - smoothY) > 0.002;
      if ((intersecting && !reducedMotion.matches) || unsettled) frame = requestAnimationFrame(animate);
      else {
        running = false;
        canvas.dataset.running = "false";
      }
    };

    const start = () => {
      if (running || !pageVisible) return;
      running = true;
      canvas.dataset.running = "true";
      previous = performance.now();
      frame = requestAnimationFrame(animate);
    };

    const trackPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      targetClientX = event.clientX;
      targetClientY = event.clientY;
      pointerInHero = !mobile
        && event.clientX >= heroBounds.left
        && event.clientX <= heroBounds.right
        && event.clientY >= heroBounds.top
        && event.clientY <= heroBounds.bottom;
      start();
    };

    const updateBounds = () => { heroBounds = hero.getBoundingClientRect(); };
    const visibilityChanged = () => {
      pageVisible = document.visibilityState === "visible";
      if (pageVisible) start();
      else {
        cancelAnimationFrame(frame);
        running = false;
        canvas.dataset.running = "false";
      }
    };
    const motionChanged = () => {
      if (reducedMotion.matches) context.clearRect(0, 0, width, height);
      start();
    };

    resize();
    const resizeObserver = new ResizeObserver(() => { resize(); updateBounds(); });
    resizeObserver.observe(hero);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      if (intersecting) start();
    }, { rootMargin: "80px" });
    intersectionObserver.observe(hero);
    window.addEventListener("pointermove", trackPointer, { passive: true });
    window.addEventListener("scroll", updateBounds, { passive: true });
    document.addEventListener("visibilitychange", visibilityChanged);
    reducedMotion.addEventListener("change", motionChanged);
    start();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", trackPointer);
      window.removeEventListener("scroll", updateBounds);
      document.removeEventListener("visibilitychange", visibilityChanged);
      reducedMotion.removeEventListener("change", motionChanged);
    };
  }, [globalLight, scene]);

  return <canvas ref={canvasRef} className="cinematic-canvas cinematic-effects kaloud-effects" />;
}

export default function HookahScene() {
  const scene = useRef<HTMLDivElement>(null);
  const globalLight = useRef<HTMLDivElement>(null);

  return (
    <>
      <div ref={globalLight} className="global-cursor-light" data-tone="dark" aria-hidden="true" />
      <div ref={scene} className="product-scene" aria-hidden="true">
        <div className="product-parallax-layer">
          <img
            src="/hero-hookah-obloc-v3.webp"
            alt=""
            width="1536"
            height="1024"
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            className="product-photo"
          />
          <div className="kaloud-effects-anchor">
            <EffectsCanvas scene={scene} globalLight={globalLight} />
          </div>
        </div>
        <div className="atmosphere-depth" />
        <div className="base-product-light" />
        <div className="product-light" />
        <div className="product-light-sweep" />
        <div className="coal-aura" />
        <div className="glass-caustic" />
        <div className="glass-shimmer" />
        <div className="studio-motes" />
        <div className="studio-vignette" />
      </div>
    </>
  );
}
