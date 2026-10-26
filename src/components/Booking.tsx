import { useEffect, useMemo, useState } from "react";
import { barber, config, money, services } from "../data";
import {
  addBooking,
  bookedSlots,
  buildMessage,
  lastClient,
  saveClient,
  useBookings,
} from "../lib/bookings";
import type { BookingDetail, BookingRecord } from "../lib/bookings";
import {
  dateLong,
  dayLabel,
  formatPhone,
  getSlots,
  makeProtocol,
  nextOpenDays,
} from "../lib/schedule";

interface BookingProps {
  now: Date;
  preService?: string;
  preDay?: string;
  preTime?: string;
  requestId: number;
}

const STEPS = ["Serviço", "Dia e hora", "Dados"];

function googleCalendarUrl(b: BookingRecord): string {
  const day = b.dayISO.replace(/-/g, "");
  const [hh, mm] = b.time.split(":").map(Number);
  const start = `${day}T${String(hh).padStart(2, "0")}${String(mm).padStart(2, "0")}00`;
  const total = hh * 60 + mm + b.durationMin;
  const endH = Math.floor(total / 60);
  const endM = total % 60;
  const end = `${day}T${String(endH).padStart(2, "0")}${String(endM).padStart(2, "0")}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${b.serviceName} · ${config.brandFull}`,
    dates: `${start}/${end}`,
    details: `Protocolo ${b.protocol}. ${b.notes}`.trim(),
    location: config.street,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function Booking({
  now,
  preService,
  preDay,
  preTime,
  requestId,
}: BookingProps) {
  const days = useMemo(() => nextOpenDays(7, now), [now]);
  const bookings = useBookings();
  const booked = useMemo(() => bookedSlots(bookings), [bookings]);

  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState("corte");
  const [detailChoices, setDetailChoices] = useState<Record<string, string>>(
    {},
  );
  const [dayISO, setDayISO] = useState(
    () => nextOpenDays(7, new Date())[0]?.iso ?? "",
  );
  const [time, setTime] = useState("");
  const [name, setName] = useState(() => lastClient().name);
  const [phone, setPhone] = useState(() => lastClient().phone);
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState<BookingRecord | null>(null);
  const [copied, setCopied] = useState(false);

  const service = services.find((s) => s.id === serviceId) ?? services[0];
  const slots = useMemo(
    () => (dayISO ? getSlots(dayISO, now, booked) : []),
    [dayISO, now, booked],
  );
  const freeCount = slots.filter((s) => s.available).length;

  const details: BookingDetail[] = useMemo(
    () =>
      (service.details ?? [])
        .filter((d) => detailChoices[d.label])
        .map((d) => ({ label: d.label, value: detailChoices[d.label] })),
    [service, detailChoices],
  );

  const draft: BookingRecord = useMemo(
    () => ({
      protocol: done?.protocol ?? "OF-••••",
      createdAt: Date.now(),
      serviceId: service.id,
      serviceName: service.name,
      price: service.price,
      durationMin: service.durationMin,
      durationLabel: service.durationLabel,
      details: done ? done.details : details,
      dayISO: done ? done.dayISO : dayISO,
      time: done ? done.time : time,
      name: done ? done.name : name.trim() || "Seu nome",
      phone: done ? done.phone : phone,
      notes: done ? done.notes : notes,
      status: "pendente",
    }),
    [done, service, details, dayISO, time, name, phone, notes],
  );

  const preview = buildMessage(draft);

  useEffect(() => {
    if (requestId === 0) return;
    setDone(null);
    setCopied(false);
    if (preService && services.some((s) => s.id === preService)) {
      setServiceId(preService);
      setDetailChoices({});
    }
    if (preDay && preTime) {
      setDayISO(preDay);
      setTime(preTime);
      setStep(2);
    } else if (preService) {
      setStep(0);
    }
  }, [requestId, preService, preDay, preTime]);

  useEffect(() => {
    if (dayISO && !days.some((d) => d.iso === dayISO)) {
      setDayISO(days[0]?.iso ?? "");
      setTime("");
    }
  }, [days, dayISO]);

  const phoneDigits = phone.replace(/\D/g, "");
  const canNext =
    step === 0 || step === 1
      ? step === 1
        ? dayISO !== "" && time !== ""
        : true
      : name.trim().length >= 2 && phoneDigits.length >= 10;

  const pickService = (id: string) => {
    setServiceId(id);
    setDetailChoices({});
    setTime("");
  };

  const confirm = () => {
    if (!canNext || step !== 2) return;
    const record: BookingRecord = {
      ...draft,
      protocol: makeProtocol(),
      name: name.trim(),
    };
    addBooking(record);
    saveClient(name.trim(), phone);
    setDone(record);
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(preview);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  if (done) {
    return (
      <div className="booking-success" role="status">
        <p className="booking-kicker">Pedido registrado</p>
        <h3>
          Pronto, {done.name.split(" ")[0]}
          <span className="dot">.</span>
        </h3>
        <p className="success-lead">
          Envie o pedido para o {barber.firstName} pelo WhatsApp.
        </p>
        <div className="ticket">
          <div className="ticket-row ticket-protocol">
            <span>Protocolo</span>
            <strong>{done.protocol}</strong>
          </div>
          <div className="ticket-row">
            <span>Serviço</span>
            <strong>
              {done.serviceName} · {money(done.price)}
            </strong>
          </div>
          {done.details.map((d) => (
            <div className="ticket-row" key={d.label}>
              <span>{d.label}</span>
              <strong>{d.value}</strong>
            </div>
          ))}
          <div className="ticket-row">
            <span>Quando</span>
            <strong>
              {dateLong(done.dayISO)} · {done.time}
            </strong>
          </div>
          <div className="ticket-row">
            <span>Contato</span>
            <strong>{done.phone}</strong>
          </div>
        </div>
        <div className="booking-actions">
          <a
            className="btn btn-lime"
            href={config.waLink(buildMessage(done))}
            target="_blank"
            rel="noreferrer"
          >
            Enviar no WhatsApp
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
          </a>
          <a
            className="btn btn-ghost-light"
            href={googleCalendarUrl(done)}
            target="_blank"
            rel="noreferrer"
          >
            Adicionar ao Google Agenda
          </a>
          <button
            type="button"
            className="btn btn-ghost-light"
            onClick={copyMessage}
          >
            {copied ? "Mensagem copiada" : "Copiar mensagem"}
          </button>
        </div>
        <button
          type="button"
          className="booking-again"
          onClick={() => {
            setDone(null);
            setCopied(false);
            setStep(0);
            setTime("");
            setNotes("");
          }}
        >
          Novo pedido
        </button>
      </div>
    );
  }

  return (
    <div className="booking">
      <ol className="booking-steps" aria-label="Etapas do pedido">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={i === step ? "current" : i < step ? "done" : ""}
          >
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i >= step}
              aria-current={i === step ? "step" : undefined}
            >
              <span className="step-num">{i < step ? "✓" : `0${i + 1}`}</span>
              <span className="step-label">{label}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="booking-body">
        <div className="booking-main">
          {step === 0 && (
            <div className="step-block">
              <div
                className="pick-grid"
                role="radiogroup"
                aria-label="Escolha o serviço"
              >
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={serviceId === s.id}
                    className={`pick ${serviceId === s.id ? "selected" : ""}`}
                    onClick={() => pickService(s.id)}
                  >
                    <span className="pick-top">
                      <strong>{s.name}</strong>
                      <span className="pick-price">{money(s.price)}</span>
                    </span>
                    {s.description && (
                      <span className="pick-desc">{s.description}</span>
                    )}
                    <span className="pick-meta">{s.durationLabel}</span>
                  </button>
                ))}
              </div>

              {service.details && service.details.length > 0 && (
                <div className="detail-block">
                  <p className="detail-title">
                    Detalhes do {service.name.toLowerCase()}
                    <span>opcional</span>
                  </p>
                  {service.details.map((group) => (
                    <div className="detail-group" key={group.label}>
                      <p>{group.label}</p>
                      <div
                        className="chip-row"
                        role="group"
                        aria-label={group.label}
                      >
                        {group.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            className={`chip ${detailChoices[group.label] === opt ? "selected" : ""}`}
                            aria-pressed={detailChoices[group.label] === opt}
                            onClick={() =>
                              setDetailChoices((prev) =>
                                prev[group.label] === opt
                                  ? { ...prev, [group.label]: "" }
                                  : { ...prev, [group.label]: opt },
                              )
                            }
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="datetime">
              <div
                className="day-pills"
                role="radiogroup"
                aria-label="Escolha o dia"
              >
                {days.map((d) => (
                  <button
                    key={d.iso}
                    type="button"
                    role="radio"
                    aria-checked={dayISO === d.iso}
                    className={`day-pill ${dayISO === d.iso ? "selected" : ""}`}
                    onClick={() => {
                      setDayISO(d.iso);
                      setTime("");
                    }}
                  >
                    <span>{d.weekdayShort}</span>
                    <strong>{d.dayNum}</strong>
                    <span>{d.monthShort}</span>
                  </button>
                ))}
              </div>
              <p className="slots-caption">
                {dateLong(dayISO)} · {freeCount}{" "}
                {freeCount === 1 ? "horário livre" : "horários livres"}
              </p>
              <div
                className="time-grid"
                role="radiogroup"
                aria-label="Escolha o horário"
              >
                {slots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    role="radio"
                    aria-checked={time === s.time}
                    disabled={!s.available}
                    className={`time-slot ${time === s.time ? "selected" : ""}`}
                    onClick={() => setTime(s.time)}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <form
              className="booking-form"
              onSubmit={(e) => {
                e.preventDefault();
                confirm();
              }}
            >
              <div className="field-row">
                <div className="field">
                  <label htmlFor="bk-name">Seu nome</label>
                  <input
                    id="bk-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="bk-phone">WhatsApp</label>
                  <input
                    id="bk-phone"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="bk-notes">
                  Alguma observação? <span>(opcional)</span>
                </label>
                <input
                  id="bk-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex.: manter o comprimento em cima"
                />
              </div>
            </form>
          )}
        </div>

        <aside className="booking-side" aria-label="Resumo do pedido">
          <div className="ticket">
            <p className="ticket-title">Seu pedido</p>
            <div className="ticket-row">
              <span>Serviço</span>
              <strong>{service.name}</strong>
            </div>
            {details.map((d) => (
              <div className="ticket-row" key={d.label}>
                <span>{d.label}</span>
                <strong>{d.value}</strong>
              </div>
            ))}
            <div className="ticket-row">
              <span>Quando</span>
              <strong>
                {dayISO && time ? `${dayLabel(dayISO, now)} · ${time}` : "—"}
              </strong>
            </div>
            <div className="ticket-row">
              <span>Duração</span>
              <strong>{service.durationLabel}</strong>
            </div>
            <div className="ticket-total">
              <span>Total</span>
              <strong>{money(service.price)}</strong>
            </div>
          </div>

          <div className="booking-nav">
            {step > 0 && (
              <button
                type="button"
                className="btn btn-ghost-light"
                onClick={() => setStep(step - 1)}
              >
                Voltar
              </button>
            )}
            {step < 2 ? (
              <button
                type="button"
                className="btn btn-lime"
                disabled={!canNext}
                onClick={() => canNext && setStep(step + 1)}
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-lime"
                disabled={!canNext}
                onClick={confirm}
              >
                Gerar pedido
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
