"use client";

import { useEffect, useRef, useState } from "react";
import HookahScene from "@/components/HookahScene";
import AtmosphereSection from "@/components/AtmosphereSection";
import VenueHours from "@/components/VenueHours";
import {
  openingHoursSpecification,
  VENUE_ADDRESS,
  VENUE_CITY,
  VENUE_NAME,
  VENUE_STREET_ADDRESS,
  VENUE_TIME_ZONE,
  weeklySchedule,
} from "@/lib/venue-hours";

const mapUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(VENUE_ADDRESS)}`;

const localBusinessStructuredData = {
  "@context": "https://schema.org",
  "@type": "BarOrPub",
  name: VENUE_NAME,
  address: {
    "@type": "PostalAddress",
    addressLocality: VENUE_CITY,
    streetAddress: VENUE_STREET_ADDRESS,
    addressCountry: "RU",
  },
  openingHoursSpecification,
  additionalProperty: {
    "@type": "PropertyValue",
    name: "timeZone",
    value: VENUE_TIME_ZONE,
  },
};

const menu = [
  { tag: "Фирменный", name: "Black Forest", note: "Чернослив · хвоя · тёмные ягоды", price: "2 200" },
  { tag: "Пряный", name: "Silk Road", note: "Манго · кардамон · жасмин", price: "2 000" },
  { tag: "Свежий", name: "Cold Garden", note: "Щавель · груша · лёгкая мята", price: "1 900" },
  { tag: "Дымный", name: "Noir", note: "Вишня · какао · дуб", price: "2 400" },
];

const drinks = [
  { name: "Pink Negroni", note: "Джин · вермут · клубника", price: "790" },
  { name: "Midnight Sour", note: "Бурбон · смородина · лимон", price: "850" },
  { name: "Velvet Highball", note: "Ром · кокос · содовая", price: "720" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerOnLight, setHeaderOnLight] = useState(false);
  const [headerLabel, setHeaderLabel] = useState("PRIVATE LOUNGE · SINCE 2026");
   const menuDialogRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
  const sections = [
  { id: "home", light: false, color: "#21100c" },
  { id: "experience", light: true, color: "#f2eee8" },
  { id: "menu", light: false, color: "#2a140e" },
  { id: "story", light: false, color: "#1b0c0a" },
  { id: "booking", light: true, color: "#f2eee8" },
  { id: "reviews", light: false, color: "#24110c" },
  { id: "contacts", light: false, color: "#160806" },
];

  const updateHeaderTheme = () => {
    const markerY = 110;

    let active = sections[0];

    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (!element) continue;

      const rect = element.getBoundingClientRect();

      if (rect.top <= markerY && rect.bottom > markerY) {
        active = section;
      }
    }

    setHeaderOnLight(active.light);

    document.documentElement.style.backgroundColor = active.color;
    document.body.style.backgroundColor = active.color;

    let themeMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );

    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.name = "theme-color";
      document.head.appendChild(themeMeta);
    }

    themeMeta.content = active.color;
  };

  updateHeaderTheme();

  window.addEventListener("scroll", updateHeaderTheme, {
    passive: true,
  });

  window.addEventListener("resize", updateHeaderTheme);

  return () => {
    window.removeEventListener("scroll", updateHeaderTheme);
    window.removeEventListener("resize", updateHeaderTheme);
  };
}, []);
 useEffect(() => {
  const sections = [
    { id: "home", label: "PRIVATE LOUNGE · SINCE 2026" },
    { id: "experience", label: "01 · АТМОСФЕРА" },
    { id: "menu", label: "02 · МЕНЮ" },
    { id: "story", label: "03 · ИСТОРИЯ" },
    { id: "booking", label: "04 · БРОНИРОВАНИЕ" },
    { id: "reviews", label: "05 · ГОСТИ" },
    { id: "contacts", label: "06 · КОНТАКТЫ" },
  ];

  const updateHeaderLabel = () => {
    const markerY = 110;

    let currentLabel = sections[0].label;

    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (!element) continue;

      const rect = element.getBoundingClientRect();

      if (rect.top <= markerY && rect.bottom > markerY) {
        currentLabel = section.label;
       }
    }

    setHeaderLabel(currentLabel);
  };

  updateHeaderLabel();

  window.addEventListener("scroll", updateHeaderLabel, { passive: true });
  window.addEventListener("resize", updateHeaderLabel);

  return () => {
    window.removeEventListener("scroll", updateHeaderLabel);
    window.removeEventListener("resize", updateHeaderLabel);
  };
}, []);

  useEffect(() => {
  const clamp = (value: number) =>
    Math.max(0, Math.min(1, value));

  const range = (
    progress: number,
    start: number,
    end: number
  ) => clamp((progress - start) / (end - start));

  const ids = [
    "experience",
    "menu",
    "story",
    "booking",
    "reviews",
    "contacts",
  ];

  const sections = ids
    .map((id) => document.getElementById(id))
    .filter((section): section is HTMLElement => Boolean(section));

  let frame = 0;

  const setReveal = (
    section: HTMLElement,
    name: string,
    value: number,
    distance: number,
    blur: number
  ) => {
    section.style.setProperty(
      `--${name}-opacity`,
      String(value)
    );

    section.style.setProperty(
      `--${name}-y`,
      `${(1 - value) * distance}px`
    );

    section.style.setProperty(
      `--${name}-blur`,
      `${(1 - value) * blur}px`
    );
  };

  const clear = () => {
    sections.forEach((section) => {
      section.style.removeProperty("--stack-top");
      section.style.removeProperty("--stack-z");

      ["reveal-a", "reveal-b", "reveal-c"].forEach((name) => {
        section.style.removeProperty(`--${name}-opacity`);
        section.style.removeProperty(`--${name}-y`);
        section.style.removeProperty(`--${name}-blur`);
      });
      section.style.removeProperty("--section-exit-opacity");
section.style.removeProperty("--section-exit-blur");
    });
  };

  const update = () => {
    frame = 0;

    if (window.innerWidth > 700) {
      clear();
      return;
    }

    const viewport = window.innerHeight;

    sections.forEach((section, index) => {
      const height = section.offsetHeight;

      /*
       * Высокая секция прокручивается обычно.
       * Когда её низ доходит до низа экрана —
       * последний кадр остаётся sticky.
       */
      section.style.setProperty(
        "--stack-top",
        `${Math.min(0, viewport - height)}px`
      );

      section.style.setProperty(
        "--stack-z",
        String(10 + index * 10)
      );

      /*
       * Atmosphere уже имеет свою красивую
       * scroll-анимацию — её не трогаем.
       */
       const rect = section.getBoundingClientRect();
      const fadeStart = 180;
const fadeEnd = 105;

const exitProgress = clamp(
  (fadeStart - rect.top) / (fadeStart - fadeEnd)
);

section.style.setProperty(
  "--section-exit-opacity",
  String(1 - exitProgress)
);

section.style.setProperty(
  "--section-exit-blur",
  `${exitProgress * 8}px`
);
if (section.id === "experience") return;

      /*
       * Reveal начинает работать сразу,
       * как новая секция входит снизу.
       */
      const progress = clamp(
        (viewport - rect.top) / (viewport * 0.82)
      );

      const revealA = range(progress, 0.08, 0.4);
const revealB = range(progress, 0.2, 0.58);
const revealC = range(progress, 0.4, 0.8);

setReveal(section, "reveal-a", revealA, 36, 7);
setReveal(section, "reveal-b", revealB, 42, 7);
setReveal(section, "reveal-c", revealC, 34, 5);
    });
  };

  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(update);
  };

  update();

  window.addEventListener("scroll", schedule, {
    passive: true,
  });

  window.addEventListener("resize", schedule);

  return () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);

    if (frame) cancelAnimationFrame(frame);

    clear();
  };
}, []);
const goToSection = (id: string) => {
  const target = document.getElementById(id);
  if (!target) return;

  let top = 0;
  let node: HTMLElement | null = target;

  while (node) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }

  setMenuOpen(false);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo({
        top: Math.max(0, top - 12),
        behavior: "smooth",
      });
    });
  });
};
   return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessStructuredData) }}
      />
<header
  className={`mobile-fixed-nav ${menuOpen ? "is-menu-open" : ""} ${
    headerOnLight ? "on-light" : "on-dark"
  }`}
>
  <div className="mobile-fixed-brand">
  <a
    className="brand"
    href="#home"
    aria-label="O’BLOCK — на главную"
  >
    O’BLOCK
  </a>

  <span className="mobile-fixed-label">
    {headerLabel}
  </span>
</div>
  <button
    ref={menuButtonRef}
    className="menu-button"
    type="button"
    onClick={() => setMenuOpen(!menuOpen)}
    aria-expanded={menuOpen}
    aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
  >
    <i />
    <i />
  </button>
</header>
      <div className="chapter-transition">
      <section className="hero transition-hero" id="home">
        <div className="scene-wrap" aria-hidden="true"><HookahScene /></div>
        <div className="grain" />
        <header className="nav shell">
          <a className="brand" href="#home" aria-label="O’BLOCK — на главную">O’BLOCK</a>
          <nav aria-label="Основная навигация">
            <a href="#experience">Атмосфера</a>
            <a href="#menu">Меню</a>
            <a href="#story">О нас</a>
            <a href="#contacts">Контакты</a>
          </nav>
          <a className="book-link" href="#booking">Забронировать</a>
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}><i /><i /></button>
        </header>

        {menuOpen && (
  <div
    ref={menuDialogRef}
    className="mobile-menu"
    role="dialog"
    aria-modal="true"
    aria-label="Мобильное меню"
  >
    <div className="mobile-menu-head">
      <div className="mobile-menu-brand">
        <button
          className="mobile-menu-home"
          type="button"
          onClick={() => goToSection("home")}
        >
          O’BLOCK
        </button>

        <span>LOUNGE BAR</span>
      </div>

      <button
        className="menu-close"
        type="button"
        aria-label="Закрыть меню"
        onClick={() => setMenuOpen(false)}
      >
        <i />
        <i />
      </button>
    </div>

    <nav className="mobile-menu-links" aria-label="Разделы сайта">
      <button type="button" onClick={() => goToSection("experience")}>
        Атмосфера
      </button>

      <button type="button" onClick={() => goToSection("menu")}>
        Меню
      </button>

      <button type="button" onClick={() => goToSection("story")}>
        О нас
      </button>

      <button type="button" onClick={() => goToSection("contacts")}>
        Контакты
      </button>

      <button
        className="mobile-menu-book"
        type="button"
        onClick={() => goToSection("booking")}
      >
        Забронировать стол
      </button>
    </nav>
  </div>
)}

        <div className="hero-copy shell">
           <h1>Искусство<br />замедлять <em>время.</em></h1>
          <p className="hero-intro">Авторские паровые коктейли, камерная музыка и атмосфера, в которой вечер становится личной историей.</p>
          <div className="hero-actions">
            <a className="button primary" href="#booking">Забронировать стол <b>↗</b></a>
            <a className="text-link" href="#menu">Смотреть меню <span>↓</span></a>
          </div>
        </div>
        <div className="hero-foot shell">
          <VenueHours />
          <p className="scene-hint">Двигайте курсором <i>↔</i></p>
          <p className="age">18+</p>
        </div>
      </section>
      <AtmosphereSection />
 <section className="menu-section" id="menu">
        <div className="shell">
          <div className="section-head">
            <div><p className="section-index">02 · Меню</p><h2>Вкусы, которые<br /><em>остаются.</em></h2></div>
            <p>Мы не делим вкусы на простые и сложные.<br />Только на те, к которым хочется вернуться.</p>
          </div>
          <div className="menu-layout">
            <div className="menu-list">
              {menu.map((item, index) => <article className="menu-item" key={item.name}>
                <span className="number">0{index + 1}</span><div><small>{item.tag}</small><h3>{item.name}</h3><p>{item.note}</p></div><strong>{item.price} ₽</strong>
              </article>)}
            </div>
            <div className="menu-feature">
              <div className="coal-art"><span /><span /><span /><i /></div>
              <div><small>Выбор мастера</small><p>Расскажите о настроении — остальное мы возьмём на себя.</p></div>
            </div>
          </div>
          <div className="drinks">
            <div className="drinks-title"><span>BAR</span><h3>Коктейльная<br />карта</h3></div>
            {drinks.map((drink) => <div className="drink" key={drink.name}><div><h4>{drink.name}</h4><p>{drink.note}</p></div><strong>{drink.price} ₽</strong></div>)}
          </div>
        </div>
      </section>

      <section className="story" id="story">
        <div className="story-orb"><i /><i /><i /></div>
        <div className="shell story-content">
          <p className="section-index">03 · История</p>
          <div>
            <h2>Мы начинали<br />с одной <em>идеи.</em></h2>
            <p>Создать место, в которое хочется возвращаться не ради статуса, а ради ощущения. С 2021 года мы меняемся, пробуем новое и растём вместе с нашими гостями.</p>
            <div className="metrics"><div><strong>4,9</strong><span>средняя оценка гостей</span></div><div><strong>4+</strong><span>года создаём атмосферу</span></div><div><strong>70</strong><span>авторских вкусов</span></div></div>
          </div>
        </div>
      </section>

      <section className="booking" id="booking">
        <div className="shell booking-grid">
          <div><p className="section-index">04 · Бронирование</p><h2>Ваш вечер<br />начинается <em>здесь.</em></h2><p>Оставьте заявку — администратор свяжется с вами и поможет выбрать лучший стол.</p></div>
          <form className="booking-form" onSubmit={(e) => e.preventDefault()}>
            <label><span>Ваше имя</span><input type="text" placeholder="Как к вам обращаться?" /></label>
            <label><span>Телефон</span><input type="tel" placeholder="+7 (___) ___-__-__" /></label>
            <div className="field-row"><label><span>Дата</span><input type="date" /></label><label><span>Гостей</span><select defaultValue="2"><option>1</option><option>2</option><option>3</option><option>4</option><option>5+</option></select></label></div>
            <button className="button primary" type="submit">Отправить заявку <b>↗</b></button>
            <small>Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности</small>
          </form>
        </div>
      </section>

      <section className="reviews" id="reviews">
        <div className="shell reviews-inner"><div><p className="section-index">Говорят гости</p><blockquote>«В O’BLOCK приходишь за вкусом, а остаёшься из-за ощущения, что ты именно там, где должен быть».</blockquote></div><div className="rating"><strong>4,9</strong><div>★★★★★<span>327 отзывов</span></div></div></div>
        <div className="shell review-links"><a href="#" aria-label="Отзывы O’BLOCK на Яндекс Картах"><b>Я</b><span>Яндекс Карты<small>Читать отзывы ↗</small></span></a><a href="#" aria-label="Отзывы O’BLOCK в 2ГИС"><b>2</b><span>2ГИС<small>Читать отзывы ↗</small></span></a></div>
      </section>

      <footer id="contacts">
        <div className="shell footer-top"><div className="footer-brand">O’BLOCK<small>Private lounge</small></div><div><small>Адрес</small><p>{VENUE_ADDRESS}</p><a href={mapUrl} target="_blank" rel="noreferrer" aria-label={`Открыть адрес O’BLOCK: ${VENUE_ADDRESS} на карте`}>Построить маршрут ↗</a></div><div><small>Связаться</small><p>+7 (900) 000-00-00</p><p>@oblock_lounge</p></div><div><small>Режим работы</small><p>Вс–Чт · {weeklySchedule.sunday.open}–{weeklySchedule.sunday.close}</p><p>Пт–Сб · {weeklySchedule.friday.open}–{weeklySchedule.friday.close}</p></div></div>
        <div className="shell footer-bottom"><span>© 2026 O’BLOCK</span><span>18+ · Курение вредит вашему здоровью</span><a href="#">Политика конфиденциальности</a></div>
       </footer>

</div>

</main>
   );
}
