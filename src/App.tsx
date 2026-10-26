import { useEffect, useMemo, useState } from "react";
import Booking from "./components/Booking";
import OwnerPanel from "./components/OwnerPanel";
import { barber, config, gallery, money, services } from "./data";
import type { ServiceCategory } from "./data";
import { bookedSlots, seedDemo, useBookings } from "./lib/bookings";
import {
  findNextAvailable,
  getStatus,
  hoursTable,
  isTodayRow,
} from "./lib/schedule";

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 19 19 5M7 5h12v12" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a8 8 0 01-8 8H4l2.3-2.9A8 8 0 1121 12z" />
      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="17" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

interface Pref {
  service?: string;
  day?: string;
  time?: string;
  n: number;
}

const FILTERS: { id: "all" | ServiceCategory; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "cabelo", label: "Cabelo" },
  { id: "barba", label: "Barba" },
  { id: "combo", label: "Combo" },
];

export default function App() {
  const [now, setNow] = useState(() => new Date());
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | ServiceCategory>("all");
  const [lightbox, setLightbox] = useState<number | null>(null);
  // Posição inicial do toque, para o gesto de arrastar no celular.
  const [swipeFrom, setSwipeFrom] = useState<number | null>(null);
  const [pref, setPref] = useState<Pref>({ n: 0 });

  const bookings = useBookings();
  const booked = useMemo(() => bookedSlots(bookings), [bookings]);
  const status = getStatus(now);
  const next = useMemo(() => findNextAvailable(now, booked), [now, booked]);
  const pending = bookings.filter((b) => b.status === "pendente").length;

  useEffect(() => {
    if (import.meta.env.DEV || import.meta.env.VITE_SEED_DEMO === "true") seedDemo(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (lightbox === null) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight")
        setLightbox((i) => (i === null ? null : (i + 1) % gallery.length));
      if (e.key === "ArrowLeft")
        setLightbox((i) =>
          i === null ? null : (i - 1 + gallery.length) % gallery.length,
        );
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox]);

  const goBooking = (p?: { service?: string; day?: string; time?: string }) => {
    setMenuOpen(false);
    setPref({ ...p, n: pref.n + 1 });
    requestAnimationFrame(() => {
      document
        .getElementById("agendar")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const bookNext = () => {
    if (!next) return goBooking();
    goBooking({ service: "corte", day: next.dayISO, time: next.time });
  };

  const openOwner = () => {
    setMenuOpen(false);
    setOwnerOpen(true);
  };

  const filteredServices =
    filter === "all" ? services : services.filter((s) => s.category === filter);

  return (
    <>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>

      <div className="topbar">
        <div className="page-width topbar-inner">
          <p>
            <span
              className={`status-dot ${status.open ? "on" : "off"}`}
              aria-hidden="true"
            />
            {status.label}
          </p>
          <a
            href={config.waLink(`Oi, ${barber.firstName}! Vim pelo site.`)}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp
          </a>
        </div>
      </div>

      <header className={`site-header ${solid ? "is-solid" : ""}`}>
        <div className="page-width header-inner">
          <a
            className="brand"
            href="#inicio"
            aria-label={`${config.brandFull}, início`}
          >
            <span>
              {config.brand}
              <span className="brand-period">.</span>
            </span>
            <small>HAIR STUDIO</small>
          </a>
          <nav
            className={`main-nav ${menuOpen ? "nav-open" : ""}`}
            aria-label="Navegação principal"
          >
            <a href="#servicos" onClick={() => setMenuOpen(false)}>
              Serviços
            </a>
            <a href="#agendar" onClick={() => setMenuOpen(false)}>
              Agendar
            </a>
            <a href="#trabalhos" onClick={() => setMenuOpen(false)}>
              Trabalhos
            </a>
            <a href="#contato" onClick={() => setMenuOpen(false)}>
              Contato
            </a>
            <button type="button" className="nav-owner" onClick={openOwner}>
              Área do barbeiro
              {pending > 0 && <span className="owner-badge">{pending}</span>}
            </button>
          </nav>
          <div className="header-actions">
            <button
              type="button"
              className="btn btn-lime btn-sm"
              onClick={() => goBooking()}
            >
              Agendar <ArrowIcon />
            </button>
            <button
              type="button"
              className="menu-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
            >
              <span className={menuOpen ? "active" : ""} />
              <span className={menuOpen ? "active" : ""} />
            </button>
          </div>
        </div>
      </header>

      <main id="conteudo">
        <section className="hero" id="inicio" aria-labelledby="hero-heading">
          <div
            className="hero-image"
            role="img"
            aria-label="Barbeiro cortando o cabelo de um cliente"
          />
          <div className="hero-shade" aria-hidden="true" />
          <div className="page-width hero-content">
            <div className="hero-copy">
              <p className="hero-eyebrow">
                {barber.name} · Junqueirópolis, SP
              </p>
              <h1 id="hero-heading">
                {config.brand}
                <span>.</span>
              </h1>
              <p className="hero-sub">
                Hair Studio · Corte e barba com hora marcada.
              </p>
              <div className="hero-ctas">
                <button
                  type="button"
                  className="btn btn-lime"
                  onClick={() => goBooking()}
                >
                  Agendar horário <ArrowIcon />
                </button>
                <a className="btn btn-outline-light" href="#servicos">
                  Ver preços
                </a>
              </div>
              {next && (
                <button
                  type="button"
                  className="hero-availability"
                  onClick={bookNext}
                >
                  <span>Próximo horário livre</span>
                  <strong>
                    {next.label} · {next.time}
                  </strong>
                  <ArrowIcon />
                </button>
              )}
            </div>
          </div>
        </section>

        <section
          className="section services"
          id="servicos"
          aria-labelledby="servicos-h"
        >
          <div className="page-width">
            <div className="section-head">
              <h2 id="servicos-h">Serviços</h2>
              <div
                className="filters"
                role="group"
                aria-label="Filtrar serviços"
              >
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={filter === f.id ? "active" : ""}
                    aria-pressed={filter === f.id}
                    onClick={() => setFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="service-list">
              {filteredServices.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="service-row"
                  onClick={() => goBooking({ service: s.id })}
                  aria-label={`Agendar ${s.name}, ${money(s.price)}`}
                >
                  <span className="service-main">
                    <strong>{s.name}</strong>
                    {s.description && <small>{s.description}</small>}
                  </span>
                  <span className="service-dur">{s.durationLabel}</span>
                  <span className="service-price">{money(s.price)}</span>
                  <span className="service-arrow" aria-hidden="true">
                    <ArrowIcon />
                  </span>
                </button>
              ))}
            </div>
            <p className="services-note">
              Pagamento no local: dinheiro, cartão de crédito ou débito.
            </p>
          </div>
        </section>

        <section
          className="section booking-section"
          id="agendar"
          aria-labelledby="agendar-h"
        >
          <div className="page-width">
            <div className="section-head">
              <h2 id="agendar-h">Agendar</h2>
              <p className="section-note">
                O pedido vai para o WhatsApp do {barber.firstName}.
              </p>
            </div>
            <Booking
              now={now}
              preService={pref.service}
              preDay={pref.day}
              preTime={pref.time}
              requestId={pref.n}
            />
          </div>
        </section>

        <section
          className="section gallery-section"
          id="trabalhos"
          aria-labelledby="trabalhos-h"
        >
          <div className="page-width">
            <div className="section-head">
              <h2 id="trabalhos-h">Trabalhos</h2>
              <a
                className="text-link"
                href={config.instagramUrl}
                target="_blank"
                rel="noreferrer"
              >
                Instagram <ArrowIcon />
              </a>
            </div>
            <div className="gallery-grid">
              {gallery.map((g, i) => (
                <button
                  key={g.src}
                  type="button"
                  className="gallery-item"
                  onClick={() => setLightbox(i)}
                  aria-label={`Ampliar: ${g.label}`}
                >
                  <img src={g.src} alt={g.alt} loading="lazy" />
                  <span className="gallery-overlay">
                    <em>{g.tag}</em>
                    <strong>{g.label}</strong>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section
          className="section contact"
          id="contato"
          aria-labelledby="contato-h"
        >
          <div className="page-width contact-grid">
            <div>
              <h2 id="contato-h">Contato</h2>
              <div className="barber-row">
                <img
                  src={barber.photo}
                  alt={`Retrato de ${barber.name}`}
                  loading="lazy"
                />
                <div>
                  <strong>{barber.name}</strong>
                  <span>{barber.role}</span>
                </div>
              </div>
              <address>
                <strong>{config.street}</strong>
                {config.district}
              </address>
              <div className="contact-ctas">
                <button
                  type="button"
                  className="btn btn-lime"
                  onClick={() => goBooking()}
                >
                  Agendar horário <ArrowIcon />
                </button>
                <a
                  className="btn btn-outline-light"
                  href={config.waLink(`Oi, ${barber.firstName}! Vim pelo site.`)}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </div>
              <div className="contact-links">
                <a href={config.mapsUrl} target="_blank" rel="noreferrer">
                  Google Maps <ArrowIcon />
                </a>
                <a href={config.wazeUrl} target="_blank" rel="noreferrer">
                  Waze <ArrowIcon />
                </a>
                <a href={config.instagramUrl} target="_blank" rel="noreferrer">
                  Instagram <ArrowIcon />
                </a>
              </div>
            </div>
            <div className="hours-card">
              <p className="hours-title">Horários</p>
              <ul>
                {hoursTable.map((row) => (
                  <li
                    key={row.day}
                    className={isTodayRow(row, now) ? "today" : ""}
                  >
                    <span>
                      {row.day}
                      {isTodayRow(row, now) && <em>hoje</em>}
                    </span>
                    <strong className={row.closed ? "closed" : ""}>
                      {row.time}
                    </strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="page-width footer-inner">
          <span>
            © {now.getFullYear()} {config.brandFull} · {config.street},{" "}
            {config.district}
          </span>
          <button type="button" className="owner-link" onClick={openOwner}>
            Área do barbeiro
            {pending > 0 && <span className="owner-badge">{pending}</span>}
          </button>
        </div>
      </footer>

      {lightbox !== null && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={gallery[lightbox].label}
          onClick={() => setLightbox(null)}
          onTouchStart={(e) => setSwipeFrom(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (swipeFrom === null) return;
            const dx = e.changedTouches[0].clientX - swipeFrom;
            setSwipeFrom(null);
            if (Math.abs(dx) < 45) return;
            setLightbox((i) =>
              i === null
                ? null
                : (i + (dx < 0 ? 1 : -1) + gallery.length) % gallery.length,
            );
          }}
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={() => setLightbox(null)}
            aria-label="Fechar"
          >
            ×
          </button>
          <button
            type="button"
            className="lightbox-nav prev"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((lightbox - 1 + gallery.length) % gallery.length);
            }}
            aria-label="Foto anterior"
          >
            ←
          </button>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={gallery[lightbox].src} alt={gallery[lightbox].alt} />
            <figcaption>
              <span>
                <em>{gallery[lightbox].tag}</em>
                {gallery[lightbox].label}
                <i className="lightbox-count">
                  {lightbox + 1} de {gallery.length}
                </i>
              </span>
              <button
                type="button"
                className="btn btn-lime btn-sm"
                onClick={() => {
                  setLightbox(null);
                  goBooking({ service: "corte" });
                }}
              >
                Agendar <ArrowIcon />
              </button>
            </figcaption>
          </figure>
          <button
            type="button"
            className="lightbox-nav next"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((lightbox + 1) % gallery.length);
            }}
            aria-label="Próxima foto"
          >
            →
          </button>
        </div>
      )}

      <OwnerPanel
        open={ownerOpen}
        now={now}
        onClose={() => setOwnerOpen(false)}
      />

      <a
        className="wa-float"
        href={config.waLink(`Oi, ${barber.firstName}! Vim pelo site.`)}
        target="_blank"
        rel="noreferrer"
        aria-label={`WhatsApp do ${barber.firstName}`}
        title={`WhatsApp do ${barber.firstName}`}
      >
        <ChatIcon />
      </a>
    </>
  );
}
