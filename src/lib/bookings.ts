import { useSyncExternalStore } from "react";
import { barber, config, money, services } from "../data";
import { dateLong, fromISO, nextOpenDays, toISO } from "./schedule";

export type BookingStatus = "pendente" | "confirmado" | "recusado";

export interface BookingDetail {
  label: string;
  value: string;
}

export interface BookingRecord {
  protocol: string;
  createdAt: number;
  serviceId: string;
  serviceName: string;
  price: number;
  durationMin: number;
  durationLabel: string;
  details: BookingDetail[];
  dayISO: string;
  time: string;
  name: string;
  phone: string;
  notes: string;
  status: BookingStatus;
}

const KEY = "oficio:pedidos";
const listeners = new Set<() => void>();
let cache: BookingRecord[] | null = null;

function readRaw(): BookingRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BookingRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(list: BookingRecord[]) {
  cache = list;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* armazenamento indisponível: segue só em memória */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshot(): BookingRecord[] {
  if (cache === null) cache = readRaw();
  return cache;
}

export function useBookings(): BookingRecord[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function listBookings(): BookingRecord[] {
  return snapshot();
}

export function addBooking(record: BookingRecord) {
  write([record, ...snapshot()]);
}

export function setBookingStatus(protocol: string, status: BookingStatus) {
  write(
    snapshot().map((b) => (b.protocol === protocol ? { ...b, status } : b)),
  );
}

export function clearBookings() {
  write([]);
}

export function bookedSlots(list: BookingRecord[]): Set<string> {
  return new Set(
    list
      .filter((b) => b.status !== "recusado")
      .map((b) => `${b.dayISO}@${b.time}`),
  );
}

/**
 * Mensagem que chega no WhatsApp do barbeiro, montada conforme o corte escolhido.
 * Usa *negrito* do próprio WhatsApp para ele bater o olho e entender.
 */
export function buildMessage(b: BookingRecord): string {
  const lines: string[] = [];
  lines.push(`*${b.protocol}* — pedido de horário`);
  lines.push(`${config.brandFull} · ${barber.firstName}`);
  lines.push("");
  lines.push(
    `*Serviço:* ${b.serviceName} (${b.durationLabel}) — ${money(b.price)}`,
  );
  b.details.forEach((d) => lines.push(`*${d.label}:* ${d.value}`));
  lines.push("");
  lines.push(`*Quando:* ${dateLong(b.dayISO)} · ${b.time}`);
  lines.push(`*Nome:* ${b.name}`);
  if (b.phone) lines.push(`*WhatsApp:* ${b.phone}`);
  if (b.notes.trim()) lines.push(`*Obs.:* ${b.notes.trim()}`);
  lines.push("");
  lines.push(config.street);
  lines.push("Se der, confirma por aqui. Valeu!");
  return lines.join("\n");
}

export function waHref(message: string): string {
  return config.waLink(message);
}

export function summarize(list: BookingRecord[]) {
  const active = list.filter((b) => b.status !== "recusado");
  const pending = list.filter((b) => b.status === "pendente").length;
  const confirmed = list.filter((b) => b.status === "confirmado").length;
  const revenue = active.reduce((sum, b) => sum + b.price, 0);
  const minutes = active.reduce((sum, b) => sum + b.durationMin, 0);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return {
    total: list.length,
    pending,
    confirmed,
    revenue,
    hoursLabel:
      hours > 0
        ? `${hours}h${rest > 0 ? String(rest).padStart(2, "0") : ""}`
        : `${rest} min`,
  };
}

export function sortBookings(list: BookingRecord[]): BookingRecord[] {
  return [...list].sort((a, b) => {
    const da = `${a.dayISO}T${a.time}`;
    const db = `${b.dayISO}T${b.time}`;
    return da < db ? -1 : da > db ? 1 : 0;
  });
}

export function isInPeriod(
  b: BookingRecord,
  period: "hoje" | "7" | "todos",
  now: Date,
): boolean {
  if (period === "todos") return true;
  const day = fromISO(b.dayISO).getTime();
  const today = fromISO(toISO(now)).getTime();
  if (period === "hoje") return day === today;
  return day >= today && day <= today + 7 * 24 * 3600 * 1000;
}

function loadClient() {
  try {
    const raw = localStorage.getItem("oficio:ultimoCliente");
    if (raw) {
      const parsed = JSON.parse(raw) as { name?: string; phone?: string };
      return { name: parsed.name ?? "", phone: parsed.phone ?? "" };
    }
  } catch {
    /* ignora */
  }
  return { name: "", phone: "" };
}

export function saveClient(name: string, phone: string) {
  try {
    localStorage.setItem(
      "oficio:ultimoCliente",
      JSON.stringify({ name, phone }),
    );
  } catch {
    /* ignora */
  }
}

export const lastClient = loadClient;

/**
 * Pedidos de exemplo para o painel não abrir vazio na primeira visita.
 * São marcados como demonstração e podem ser limpos pelo barbeiro.
 */
export function seedDemo(now: Date) {
  if (snapshot().length > 0) return;
  const days = nextOpenDays(6, now);
  if (days.length < 4) return;

  const demo: BookingRecord[] = [
    {
      protocol: "OF-K7QP",
      createdAt: now.getTime() - 3600 * 1000 * 5,
      serviceId: "corte",
      serviceName: "Corte",
      price: 75,
      durationMin: 50,
      durationLabel: "50 min",
      details: [
        { label: "Laterais", value: "Máquina 2" },
        { label: "Topo", value: "Médio" },
        { label: "Acabamento", value: "Navalha" },
      ],
      dayISO: days[0].iso,
      time: "16:00",
      name: "Marcos Tavares",
      phone: "(11) 98765-1122",
      notes: "",
      status: "confirmado",
    },
    {
      protocol: "OF-M3XZ",
      createdAt: now.getTime() - 3600 * 1000 * 26,
      serviceId: "corte-barba",
      serviceName: "Corte + barba",
      price: 115,
      durationMin: 80,
      durationLabel: "1h20",
      details: [
        { label: "Laterais", value: "Máquina 1" },
        { label: "Barba", value: "Contorno marcado" },
      ],
      dayISO: days[1].iso,
      time: "12:00",
      name: "Felipe Rocha",
      phone: "(11) 99640-8877",
      notes: "Casamento no sábado à noite, capricha.",
      status: "pendente",
    },
    {
      protocol: "OF-T9BW",
      createdAt: now.getTime() - 3600 * 1000 * 50,
      serviceId: "infantil",
      serviceName: "Corte infantil",
      price: 60,
      durationMin: 40,
      durationLabel: "40 min",
      details: [
        { label: "Idade", value: "6 a 9" },
        { label: "Primeira vez na barbearia", value: "Sim" },
      ],
      dayISO: days[2].iso,
      time: "11:00",
      name: "João Pedro Martins",
      phone: "(11) 98455-7019",
      notes: "Ele tem medo de máquina, vamos com calma.",
      status: "pendente",
    },
    {
      protocol: "OF-R4HD",
      createdAt: now.getTime() - 3600 * 1000 * 74,
      serviceId: "barba",
      serviceName: "Barba",
      price: 55,
      durationMin: 35,
      durationLabel: "35 min",
      details: [
        { label: "Toalha quente", value: "Sim" },
        { label: "Desenho", value: "Natural" },
      ],
      dayISO: days[3].iso,
      time: "15:00",
      name: "André Lima",
      phone: "(11) 97711-2233",
      notes: "",
      status: "recusado",
    },
  ];

  write(demo);
}

export const serviceById = (id: string) => services.find((s) => s.id === id);
