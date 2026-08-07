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
  const menuDialogRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    if (!menuOpen) return () => { document.body.style.overflow = ""; };

    const dialog = menuDialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
    focusable?.[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [menuOpen]);
   useEffect(() => {
  const atmosphere = document.getElementById("experience");
  if (!atmosphere) return;

  const updateHeaderTheme = () => {
    const rect = atmosphere.getBoundingClientRect();

    setHeaderOnLight(
      rect.top <= 95 &&
      rect.bottom > 95
    );
  };

  updateHeaderTheme();

  window.addEventListener("scroll", updateHeaderTheme, { passive: true });
  window.addEventListener("resize", updateHeaderTheme);

  return () => {
    window.removeEventListener("scroll", updateHeaderTheme);
    window.removeEventListener("resize", updateHeaderTheme);
  };
}, []);

  useEffect(() => {
    // TODO: Replace placeholder review, map and privacy URLs once verified venue data is provided.
    // TODO: Replace the placeholder address, phone and social handle with verified venue details.
    const placeholders = document.querySelectorAll<HTMLAnchorElement>('a[href="#"]');
    const preventPlaceholderNavigation = (event: Event) => event.preventDefault();
    placeholders.forEach((link) => {
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("data-placeholder-link", "true");
      link.setAttribute("title", "Ссылка будет добавлена после уточнения данных");
      link.addEventListener("click", preventPlaceholderNavigation);
    });
    return () => placeholders.forEach((link) => link.removeEventListener("click", preventPlaceholderNavigation));
  }, []);

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
      className="brand"
    href="#home"
    aria-label="O’BLOCK — на главную"
  >
    O’BLOCK
  </a>

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

        {menuOpen && <div ref={menuDialogRef} className="mobile-menu" role="dialog" aria-modal="true" aria-label="Мобильное меню">
          <div className="mobile-menu-head"><a className="brand" href="#home" onClick={() => setMenuOpen(false)} aria-label="O’BLOCK — на главную">O’BLOCK</a><button className="menu-close" type="button" aria-label="Закрыть меню" onClick={() => setMenuOpen(false)}><i /><i /></button></div>
          {["Атмосфера", "Меню", "О нас", "Контакты"].map((item, i) => <a key={item} href={["#experience", "#menu", "#story", "#contacts"][i]} onClick={() => setMenuOpen(false)}>{item}</a>)}
          <a href="#booking" onClick={() => setMenuOpen(false)}>Забронировать стол</a>
        </div>}

        <div className="hero-copy shell">
          <p className="eyebrow">Private lounge <span aria-hidden="true">·</span> since 2026</p>
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
      </div>

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

      <section className="reviews">
        <div className="shell reviews-inner"><div><p className="section-index">Говорят гости</p><blockquote>«В O’BLOCK приходишь за вкусом, а остаёшься из-за ощущения, что ты именно там, где должен быть».</blockquote></div><div className="rating"><strong>4,9</strong><div>★★★★★<span>327 отзывов</span></div></div></div>
        <div className="shell review-links"><a href="#" aria-label="Отзывы O’BLOCK на Яндекс Картах"><b>Я</b><span>Яндекс Карты<small>Читать отзывы ↗</small></span></a><a href="#" aria-label="Отзывы O’BLOCK в 2ГИС"><b>2</b><span>2ГИС<small>Читать отзывы ↗</small></span></a></div>
      </section>

      <footer id="contacts">
        <div className="shell footer-top"><div className="footer-brand">O’BLOCK<small>Private lounge</small></div><div><small>Адрес</small><p>{VENUE_ADDRESS}</p><a href={mapUrl} target="_blank" rel="noreferrer" aria-label={`Открыть адрес O’BLOCK: ${VENUE_ADDRESS} на карте`}>Построить маршрут ↗</a></div><div><small>Связаться</small><p>+7 (900) 000-00-00</p><p>@oblock_lounge</p></div><div><small>Режим работы</small><p>Вс–Чт · {weeklySchedule.sunday.open}–{weeklySchedule.sunday.close}</p><p>Пт–Сб · {weeklySchedule.friday.open}–{weeklySchedule.friday.close}</p></div></div>
        <div className="shell footer-bottom"><span>© 2026 O’BLOCK</span><span>18+ · Курение вредит вашему здоровью</span><a href="#">Политика конфиденциальности</a></div>
      </footer>
    </main>
  );
}
