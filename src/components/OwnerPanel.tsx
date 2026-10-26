import { useEffect, useMemo, useRef, useState } from "react";
import { config, money } from "../data";
import {
  buildMessage,
  clearBookings,
  isInPeriod,
  setBookingStatus,
  sortBookings,
  summarize,
  useBookings,
} from "../lib/bookings";
import type { BookingRecord, BookingStatus } from "../lib/bookings";
import { dateLong, dayShort, fromISO, toISO } from "../lib/schedule";

interface OwnerPanelProps {
  open: boolean;
  now: Date;
  onClose: () => void;
}

type Period = "hoje" | "7" | "todos";
type StatusFilter = "todos" | BookingStatus;

const STATUS_LABEL: Record<BookingStatus, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  recusado: "Recusado",
};

const SESSION_KEY = "oficio:painel";

export default function OwnerPanel({ open, now, onClose }: OwnerPanelProps) {
  const bookings = useBookings();
  const [unlocked, setUnlocked] = useState(
    () =>
      typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem(SESSION_KEY) === "1",
  );
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [period, setPeriod] = useState<Period>("7");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [expanded, setExpanded] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const todayISO = toISO(now);
    return sortBookings(bookings).filter((b) => {
      if (!isInPeriod(b, period, now)) return false;
      if (statusFilter !== "todos" && b.status !== statusFilter) return false;
      if (period === "hoje") return b.dayISO === todayISO;
      return true;
    });
  }, [bookings, period, statusFilter, now]);

  const stats = useMemo(() => summarize(filtered), [filtered]);
  const pendingTotal = bookings.filter((b) => b.status === "pendente").length;

  const unlock = () => {
    if (pin.trim() === config.ownerPin) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
      setPinError(false);
      setPin("");
    } else {
      setPinError(true);
    }
  };

  const answer = (b: BookingRecord, status: BookingStatus) =>
    setBookingStatus(b.protocol, status);

  if (!open) return null;

  return (
    <div
      className="owner-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Painel do barbeiro"
    >
      <div className="owner-panel" tabIndex={-1} ref={panelRef}>
        <header className="owner-top">
          <div>
            <p className="owner-kicker">Painel da barbearia</p>
            <h2>
              Pedidos
              <span className="dot">.</span>
            </h2>
          </div>
          <button
            type="button"
            className="owner-close"
            onClick={onClose}
            aria-label="Fechar painel"
          >
            ×
          </button>
        </header>

        {!unlocked ? (
          <div className="owner-gate">
            <p>Digite o PIN para ver os pedidos.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                unlock();
              }}
            >
              <label htmlFor="owner-pin">PIN</label>
              <div className="gate-row">
                <input
                  id="owner-pin"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setPinError(false);
                  }}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="••••"
                  className={pinError ? "error" : ""}
                />
                <button
                  type="submit"
                  className="btn btn-lime"
                  disabled={pin.length < 4}
                >
                  Entrar
                </button>
              </div>
              {pinError && (
                <p className="gate-error">PIN errado. Tenta de novo.</p>
              )}
              <p className="gate-hint">Demonstração · PIN {config.ownerPin}</p>
            </form>
          </div>
        ) : (
          <>
            <div className="owner-stats">
              <div>
                <span>Pedidos</span>
                <strong>{stats.total}</strong>
              </div>
              <div>
                <span>Pendentes</span>
                <strong className={stats.pending > 0 ? "warn" : ""}>
                  {stats.pending}
                </strong>
              </div>
              <div>
                <span>Confirmados</span>
                <strong>{stats.confirmed}</strong>
              </div>
              <div>
                <span>Previsão no caixa</span>
                <strong>{money(stats.revenue)}</strong>
              </div>
              <div>
                <span>Cadeira ocupada</span>
                <strong>{stats.hoursLabel}</strong>
              </div>
            </div>

            <div className="owner-filters">
              <div className="filter-group" role="group" aria-label="Período">
                {(
                  [
                    ["hoje", "Hoje"],
                    ["7", "7 dias"],
                    ["todos", "Tudo"],
                  ] as [Period, string][]
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={period === id ? "active" : ""}
                    aria-pressed={period === id}
                    onClick={() => setPeriod(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="filter-group" role="group" aria-label="Situação">
                {(
                  [
                    ["todos", "Todos"],
                    ["pendente", "Pendentes"],
                    ["confirmado", "Confirmados"],
                    ["recusado", "Recusados"],
                  ] as [StatusFilter, string][]
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={statusFilter === id ? "active" : ""}
                    aria-pressed={statusFilter === id}
                    onClick={() => setStatusFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="owner-list">
              {filtered.length === 0 && (
                <p className="owner-empty">
                  Nenhum pedido nesse filtro.{" "}
                  {pendingTotal > 0 &&
                    `Há ${pendingTotal} pendente(s) em outros períodos.`}
                </p>
              )}

              {filtered.map((b) => {
                const isPast =
                  fromISO(b.dayISO).getTime() < fromISO(toISO(now)).getTime();
                const isOpenRow = expanded === b.protocol;
                return (
                  <article
                    key={b.protocol}
                    className={`owner-card ${b.status}`}
                  >
                    <div className="owner-card-when">
                      <strong>{b.time}</strong>
                      <span>{dayShort(b.dayISO, now)}</span>
                      <em className={`pill ${b.status}`}>
                        {STATUS_LABEL[b.status]}
                      </em>
                    </div>

                    <div className="owner-card-body">
                      <div className="owner-card-head">
                        <div>
                          <h3>{b.serviceName}</h3>
                          <p className="owner-card-sub">
                            {b.durationLabel} · {money(b.price)} · {b.protocol}
                            {isPast && b.status !== "recusado" && (
                              <span className="past"> · já passou</span>
                            )}
                          </p>
                        </div>
                        <div className="owner-card-client">
                          <strong>{b.name}</strong>
                          <a href={`tel:+55${b.phone.replace(/\D/g, "")}`}>
                            {b.phone}
                          </a>
                        </div>
                      </div>

                      {b.details.length > 0 && (
                        <ul className="owner-details">
                          {b.details.map((d) => (
                            <li key={d.label}>
                              <span>{d.label}</span>
                              <strong>{d.value}</strong>
                            </li>
                          ))}
                        </ul>
                      )}

                      {b.notes.trim() && (
                        <p className="owner-notes">“{b.notes.trim()}”</p>
                      )}

                      <div className="owner-card-actions">
                        {b.status !== "confirmado" && (
                          <button
                            type="button"
                            className="btn btn-lime btn-sm"
                            onClick={() => answer(b, "confirmado")}
                          >
                            Confirmar
                          </button>
                        )}
                        <a
                          className="btn btn-ghost-light btn-sm"
                          href={config.waLink(buildMessage(b))}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Abrir conversa
                        </a>
                        {b.status === "pendente" && (
                          <button
                            type="button"
                            className="btn btn-ghost-light btn-sm"
                            onClick={() => answer(b, "recusado")}
                          >
                            Recusar
                          </button>
                        )}
                        {b.status === "recusado" && (
                          <button
                            type="button"
                            className="btn btn-ghost-light btn-sm"
                            onClick={() => answer(b, "pendente")}
                          >
                            Reabrir
                          </button>
                        )}
                        <button
                          type="button"
                          className="owner-toggle"
                          onClick={() =>
                            setExpanded(isOpenRow ? null : b.protocol)
                          }
                          aria-expanded={isOpenRow}
                        >
                          {isOpenRow ? "Esconder mensagem" : "Ver mensagem"}
                        </button>
                      </div>

                      {isOpenRow && (
                        <div className="msg-preview dark">
                          <p className="msg-preview-title">
                            Texto enviado por {b.name} · {dateLong(b.dayISO)}
                          </p>
                          <pre>{buildMessage(b)}</pre>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <footer className="owner-foot">
              <p>
                Pedidos salvos neste navegador. Também chegam no WhatsApp do
                barbeiro.
              </p>
              <button
                type="button"
                className="owner-clear"
                onClick={clearBookings}
              >
                Limpar pedidos
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
