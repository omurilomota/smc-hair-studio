import { hoursConfig, longestServiceMin } from "../data";
import type { StudioDayHours } from "../data";

export type DayHours = StudioDayHours;

/** Intervalo de almoço, igual em todos os dias abertos (13h45 — 15h00). */
const BREAK = hoursConfig.break;
const HOURS = hoursConfig.byWeekday;
const ALL_SLOTS = hoursConfig.allSlots;

/** "13:30" → 810 (minutos desde a meia-noite). */
function slotMinutes(slot: string): number {
  const [h, m] = slot.split(":").map(Number);
  return h * 60 + m;
}

/** Hora decimal → "13h45", "11h", "18h15". */
function fmtHour(value: number): string {
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

const WEEKDAYS = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];
const WEEKDAYS_SHORT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MONTHS_SHORT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export const isOpenDay = (date: Date) => HOURS[date.getDay()] !== null;

export const slotsForDay = (date: Date): string[] => {
  const h = HOURS[date.getDay()];
  if (!h) return [];
  return ALL_SLOTS.filter((slot) => {
    const t = slotMinutes(slot);
    if (t < h.open * 60) return false; // antes de abrir
    if (t >= BREAK.start * 60 && t < BREAK.end * 60) return false; // almoço
    // O horário só é oferecido se o serviço mais longo couber até o fim do
    // turno — é assim que se chega em "fecha 13h45" e "fecha 18h15".
    return t + longestServiceMin <= h.close * 60;
  });
};

export const toISO = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

export const fromISO = (iso: string) => new Date(`${iso}T12:00:00`);

export interface SlotInfo {
  time: string;
  available: boolean;
  past: boolean;
}

export function getSlots(
  dayISO: string,
  now: Date,
  booked?: Set<string>,
): SlotInfo[] {
  const day = fromISO(dayISO);
  const isToday = toISO(now) === dayISO;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return slotsForDay(day).map((time) => {
    const [h, m] = time.split(":").map(Number);
    const past = isToday && h * 60 + m <= nowMinutes + 45;
    const taken = booked ? booked.has(`${dayISO}@${time}`) : false;
    return { time, available: !past && !taken, past };
  });
}

export interface OpenDay {
  iso: string;
  date: Date;
  weekdayShort: string;
  dayNum: string;
  monthShort: string;
}

export function nextOpenDays(
  count: number,
  from: Date = new Date(),
): OpenDay[] {
  const out: OpenDay[] = [];
  const cursor = new Date(from);
  let guard = 0;
  while (out.length < count && guard < 90) {
    if (isOpenDay(cursor)) {
      out.push({
        iso: toISO(cursor),
        date: new Date(cursor),
        weekdayShort: WEEKDAYS_SHORT[cursor.getDay()],
        dayNum: String(cursor.getDate()).padStart(2, "0"),
        monthShort: MONTHS_SHORT[cursor.getMonth()],
      });
    }
    cursor.setDate(cursor.getDate() + 1);
    guard++;
  }
  return out;
}

export function dayLabel(dayISO: string, now: Date): string {
  const today = toISO(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dayISO === today) return "Hoje";
  if (dayISO === toISO(tomorrow)) return "Amanhã";
  return WEEKDAYS[fromISO(dayISO).getDay()];
}

export function dayShort(dayISO: string, now: Date): string {
  const d = fromISO(dayISO);
  const label = dayLabel(dayISO, now);
  if (label === "Hoje" || label === "Amanhã")
    return `${label}, ${d.getDate()}/${d.getMonth() + 1}`;
  return `${WEEKDAYS_SHORT[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}`;
}

export function dateLong(dayISO: string): string {
  return fromISO(dayISO).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export interface NextSlot {
  dayISO: string;
  time: string;
  label: string;
}

export function findNextAvailable(
  now: Date,
  booked?: Set<string>,
): NextSlot | null {
  for (const day of nextOpenDays(14, now)) {
    const free = getSlots(day.iso, now, booked).find((s) => s.available);
    if (free)
      return {
        dayISO: day.iso,
        time: free.time,
        label: dayLabel(day.iso, now),
      };
  }
  return null;
}

export interface Status {
  open: boolean;
  label: string;
}

export function getStatus(now: Date): Status {
  const h = HOURS[now.getDay()];
  const minutes = now.getHours() * 60 + now.getMinutes();
  const breakStart = BREAK.start * 60;
  const breakEnd = BREAK.end * 60;

  if (h) {
    if (minutes >= h.open * 60 && minutes < breakStart) {
      return { open: true, label: `Aberto agora · até ${fmtHour(BREAK.start)}` };
    }
    if (minutes >= breakEnd && minutes < h.close * 60) {
      return { open: true, label: `Aberto agora · até ${fmtHour(h.close)}` };
    }
    if (minutes >= breakStart && minutes < breakEnd) {
      return { open: false, label: `Intervalo · voltamos às ${fmtHour(BREAK.end)}` };
    }
    if (minutes < h.open * 60) {
      return { open: false, label: `Fechado · abre hoje às ${fmtHour(h.open)}` };
    }
  }
  const days = nextOpenDays(1, new Date(now.getTime() + 24 * 3600 * 1000));
  if (days.length === 0) return { open: false, label: "Fechado no momento" };
  const next = days[0];
  const weekday = WEEKDAYS[next.date.getDay()];
  return {
    open: false,
    label: `Fechado · abre ${weekday} às ${fmtHour(HOURS[next.date.getDay()]?.open ?? 0)}`,
  };
}

export function makeProtocol(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const rand = new Uint32Array(4);
  crypto.getRandomValues(rand);
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[rand[i] % chars.length];
  return `OF-${code}`;
}

export function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length > 0 ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export interface HoursRow {
  day: string;
  time: string;
  closed: boolean;
  weekday: number;
}

export const hoursTable: HoursRow[] = [
  {
    day: "Segunda a sexta",
    time: "11h–13h45 · 15h–20h",
    closed: false,
    weekday: -1,
  },
  {
    day: "Sábado",
    time: "11h–13h45 · 15h–18h15",
    closed: false,
    weekday: 6,
  },
  { day: "Domingo", time: "Fechado", closed: true, weekday: 0 },
];

export const isTodayRow = (row: HoursRow, now: Date): boolean => {
  const dow = now.getDay();
  if (row.weekday >= 0) return dow === row.weekday;
  return dow >= 1 && dow <= 5;
};
