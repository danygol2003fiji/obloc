"use client";

import { useEffect, useRef } from "react";

const cards = [
  { number: "01", className: "mood-one", title: "Глубина вкуса", copy: "Каждый микс раскрывается под ваше настроение." },
  { number: "02", className: "mood-two", title: "Тишина деталей", copy: "Мягкий свет, винил и приватность без пафоса." },
  { number: "03", className: "mood-three", title: "Искусство внимания", copy: "Команда, которая помнит ваши предпочтения." },
];

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const range = (value: number, from: number, to: number) => clamp((value - from) / (to - from));

export default function AtmosphereSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const hero = section.closest(".chapter-transition")?.querySelector<HTMLElement>(".transition-hero");
    const cardNodes = Array.from(section.querySelectorAll<HTMLElement>(".mood"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 701px)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let visible = true;
    let lightMoving = false;

    const lights = cardNodes.map(() => ({ x: 50, y: 50, tx: 50, ty: 50, active: false }));

    const setReveal = (name: string, value: number, distance: number, blur = 0) => {
      section.style.setProperty(`--${name}-opacity`, value.toFixed(3));
      section.style.setProperty(`--${name}-y`, `${((1 - value) * distance).toFixed(2)}px`);
      section.style.setProperty(`--${name}-blur`, `${((1 - value) * blur).toFixed(2)}px`);
    };

    const render = () => {
      frame = 0;
      if (!visible || document.hidden || reduceMotion.matches || !desktop.matches) return;

      const viewport = window.innerHeight;
      const start = section.offsetTop - viewport;
      const progress = clamp((window.scrollY - start) / viewport);
      const eased = progress * progress * (3 - 2 * progress);

      section.style.setProperty("--panel-y", `${((1 - eased) * viewport * 0.28).toFixed(2)}px`);
      section.style.setProperty("--panel-scale", (0.988 + eased * 0.012).toFixed(4));
      section.style.setProperty("--panel-radius", `${((1 - eased) * 18).toFixed(2)}px`);
      hero?.style.setProperty("--hero-exit-scale", (1 - eased * 0.012).toFixed(4));
      hero?.style.setProperty("--hero-exit-brightness", (1 - eased * 0.08).toFixed(4));

      setReveal("label", range(progress, 0.3, 0.42), 24);
      setReveal("line-one", range(progress, 0.39, 0.55), 64, 5);
      setReveal("line-two", range(progress, 0.47, 0.63), 64, 5);
      setReveal("pink", range(progress, 0.57, 0.7), 12);
      setReveal("copy", range(progress, 0.54, 0.7), 30, 3);

      cardNodes.forEach((card, index) => {
        const cardProgress = range(progress, 0.62 + index * 0.07, 0.8 + index * 0.07);
        card.style.setProperty("--card-opacity", cardProgress.toFixed(3));
        card.style.setProperty("--card-y", `${((1 - cardProgress) * 68).toFixed(2)}px`);
        card.style.setProperty("--card-scale", (0.975 + cardProgress * 0.025).toFixed(4));
        card.style.setProperty("--card-blur", `${((1 - cardProgress) * 4).toFixed(2)}px`);
        const rect = card.getBoundingClientRect();
        const position = clamp((rect.top + rect.height / 2 - viewport / 2) / viewport, -1, 1);
        const strength = [18, 14, 22][index];
        card.style.setProperty("--card-parallax", `${(-position * strength).toFixed(2)}px`);
      });

      if (lightMoving) {
        lightMoving = false;
        lights.forEach((light, index) => {
          light.x += (light.tx - light.x) * 0.16;
          light.y += (light.ty - light.y) * 0.16;
          cardNodes[index].style.setProperty("--card-light-x", `${light.x.toFixed(2)}%`);
          cardNodes[index].style.setProperty("--card-light-y", `${light.y.toFixed(2)}%`);
          if (Math.abs(light.tx - light.x) > 0.08 || Math.abs(light.ty - light.y) > 0.08) lightMoving = true;
        });
      }

      if (lightMoving) frame = requestAnimationFrame(render);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    const enterMobile = () => {
      section.dataset.motion = "mobile";
      hero?.style.removeProperty("--hero-exit-scale");
      hero?.style.removeProperty("--hero-exit-brightness");
    };

    const configure = () => {
      if (reduceMotion.matches) {
        section.dataset.motion = "reduced";
        section.dataset.visible = "true";
      } else if (desktop.matches) {
        section.dataset.motion = "ready";
        section.dataset.visible = "true";
      } else {
        enterMobile();
      }
      schedule();
    };

   const visibilityObserver = new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;

  if (entry.isIntersecting) {
    section.dataset.visible = "true";
    schedule();
  }
}, {
  rootMargin: desktop.matches
    ? "20% 0px 20%"
    : "0px 0px -18% 0px",
  threshold: desktop.matches ? 0 : 0.08,
});
    visibilityObserver.observe(section);

    const pointerHandlers = cardNodes.map((card, index) => {
      const onMove = (event: PointerEvent) => {
        if (!finePointer.matches || !desktop.matches || reduceMotion.matches) return;
        const rect = card.getBoundingClientRect();
        lights[index].tx = clamp((event.clientX - rect.left) / rect.width) * 100;
        lights[index].ty = clamp((event.clientY - rect.top) / rect.height) * 100;
        lights[index].active = true;
        lightMoving = true;
        schedule();
      };
      const onLeave = () => {
        lights[index].tx = 50;
        lights[index].ty = 50;
        lights[index].active = false;
        lightMoving = true;
        schedule();
      };
      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerleave", onLeave);
      return { card, onMove, onLeave };
    });

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", configure, { passive: true });
    document.addEventListener("visibilitychange", schedule);
    reduceMotion.addEventListener("change", configure);
    desktop.addEventListener("change", configure);
    configure();
    document.fonts?.ready.then(schedule);

    return () => {
      cancelAnimationFrame(frame);
      visibilityObserver.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", configure);
      document.removeEventListener("visibilitychange", schedule);
      reduceMotion.removeEventListener("change", configure);
      desktop.removeEventListener("change", configure);
      pointerHandlers.forEach(({ card, onMove, onLeave }) => {
        card.removeEventListener("pointermove", onMove);
        card.removeEventListener("pointerleave", onLeave);
      });
    };
  }, []);

  return (
    <section ref={sectionRef} className="manifesto atmosphere-panel" id="experience">
      <div className="shell manifesto-grid atmosphere-intro">
        <p className="section-index atmosphere-label">01 · АТМОСФЕРА</p>
        <div>
          <h2 className="atmosphere-heading">
            <span className="atmosphere-mask"><span className="atmosphere-line atmosphere-line-one">O’BLOCK — это не просто лаундж.</span></span>
            <span className="atmosphere-mask"><span className="atmosphere-line atmosphere-line-two">Это пространство для <em className="atmosphere-pink-word">настоящего.</em></span></span>
          </h2>
          <p className="body-copy atmosphere-copy">Мы собрали всё, что делает вечер особенным: внимание к деталям, честные вкусы, правильный свет и людей, которые знают, когда быть рядом, а когда — оставить вас наедине с моментом.</p>
        </div>
      </div>
      <div className="mood-grid shell atmosphere-cards">
        {cards.map((card) => (
          <article className={`mood ${card.className}`} key={card.number}>
            <div className="mood-visual" aria-hidden="true" />
            <div className="mood-light" aria-hidden="true" />
            <div className="mood-content"><span>{card.number}</span><h3>{card.title}</h3><p>{card.copy}</p></div>
          </article>
        ))}
      </div>
    </section>
  );
}
