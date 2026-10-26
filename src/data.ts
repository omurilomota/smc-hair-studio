export type ServiceCategory = "cabelo" | "barba" | "combo";

export interface DetailOption {
  label: string;
  options: string[];
}

export interface Service {
  id: string;
  name: string;
  /** Opcional: alguns serviços não têm texto explicativo. */
  description?: string;
  price: number;
  durationMin: number;
  durationLabel: string;
  category: ServiceCategory;
  details?: DetailOption[];
}

// Preços e durações conforme a tabela do estúdio.
export const services: Service[] = [
  {
    id: "barba",
    name: "Barba",
    price: 15,
    durationMin: 10,
    durationLabel: "10 min",
    category: "barba",
  },
  {
    id: "corte",
    name: "Corte",
    price: 30,
    durationMin: 30,
    durationLabel: "30 min",
    category: "cabelo",
  },
  {
    id: "corte-barba",
    name: "Corte e barba",
    price: 43,
    durationMin: 40,
    durationLabel: "40 min",
    category: "combo",
  },
  {
    id: "corte-sobrancelhas",
    name: "Corte e sobrancelhas",
    price: 30,
    durationMin: 30,
    durationLabel: "30 min",
    category: "combo",
  },
  {
    id: "pezinho-sobrancelha",
    name: "Pezinho e sobrancelha",
    price: 10,
    durationMin: 10,
    durationLabel: "10 min",
    category: "barba",
  },
];

/** Maior duração entre os serviços: usada para não oferecer horário que não caiba. */
export const longestServiceMin = services.reduce(
  (max, s) => Math.max(max, s.durationMin),
  0,
);

export const barber = {
  name: "Samuca",
  firstName: "Samuca",
  role: "Barbeiro",
  photo: "/images/team-rafa.jpg",
};

export interface GalleryItem {
  src: string;
  alt: string;
  tag: string;
  label: string;
}

// Fotos de exemplo (Pexels). Troque pelas fotos reais dos cortes do barbeiro.
const pexels = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=900`;

export const gallery: GalleryItem[] = [
  {
    src: pexels(18503604),
    alt: "Degradê feito com máquina",
    tag: "Máquina",
    label: "Mid fade",
  },
  {
    src: pexels(12464845),
    alt: "Corte na tesoura com pente",
    tag: "Tesoura",
    label: "Clássico na tesoura",
  },
  {
    src: pexels(33461079),
    alt: "Degradê detalhado",
    tag: "Degradê",
    label: "Fade baixo",
  },
  {
    src: pexels(39559261),
    alt: "Finalização com máquina",
    tag: "Máquina",
    label: "Taper fade",
  },
  {
    src: pexels(12464846),
    alt: "Contorno com navalha",
    tag: "Navalha",
    label: "Contorno na navalha",
  },
  {
    src: pexels(9971240),
    alt: "Acabamento com máquina de contorno",
    tag: "Acabamento",
    label: "Acabamento",
  },
];

/**
 * Telefone do estúdio, montado em partes de propósito: o número completo não
 * fica literal no HTML/JS entregue, o que dificulta colheita automática por
 * scrapers. Ele só existe dentro de links (wa.me) — nunca é exibido como
 * texto no site e não vai para o JSON-LD.
 */
const WA_PARTS = ["55", "18", "99610", "8963"];
const whatsappNumber = WA_PARTS.join("");

/**
 * Handle do Instagram, montado em partes pelo mesmo motivo: só existe dentro
 * do href, nunca aparece escrito na página.
 */
const IG_USER = ["samuel", "rods"].join(".");

export interface StudioDayHours {
  open: number;
  close: number;
}

export interface StudioHoursConfig {
  break: { start: number; end: number };
  byWeekday: Record<number, StudioDayHours | null>;
  allSlots: string[];
}

export const hoursConfig: StudioHoursConfig = {
  break: { start: 13.75, end: 15 },
  byWeekday: {
    0: null,
    1: { open: 11, close: 20 },
    2: { open: 11, close: 20 },
    3: { open: 11, close: 20 },
    4: { open: 11, close: 20 },
    5: { open: 11, close: 20 },
    6: { open: 11, close: 18.25 },
  },
  allSlots: ["11:00", "12:00", "13:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
};

export const config = {
  brand: "SMC",
  brandFull: "SMC HAIR STUDIO",
  whatsappNumber,
  waLink: (message: string) =>
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
  street: "Rua Ipiranga, 1110",
  district: "Alto do Cene · Junqueirópolis/SP · CEP 17890-000",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Rua+Ipiranga+1110+Junqueiropolis+SP",
  wazeUrl: "https://waze.com/ul?q=Rua+Ipiranga+1110+Junqueiropolis+SP",
  instagramUrl: `https://www.instagram.com/${IG_USER}/`,
  /**
   * Atenção: tudo que começa com VITE_ é embutido no bundle pelo Vite, então
   * este PIN é legível por qualquer visitante. O painel é conveniência de
   * organização, não uma barreira de segurança — não guarde dado sensível
   * nos pedidos (eles ficam no localStorage do próprio navegador).
   */
  ownerPin: (import.meta.env.VITE_OWNER_PIN as string | undefined) || "2024",
};

export const money = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
