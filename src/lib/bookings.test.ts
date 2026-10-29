import { describe, expect, it } from "vitest";
import type { BookingRecord } from "./bookings";
import { bookedSlots, buildMessage, sortBookings, summarize } from "./bookings";

const base: BookingRecord = {
  protocol: "OF-TEST",
  createdAt: 0,
  serviceId: "corte",
  serviceName: "Corte",
  price: 30,
  durationMin: 30,
  durationLabel: "30 min",
  details: [{ label: "Máquina", value: "2" }],
  dayISO: "2026-11-02",
  time: "11:00",
  name: "Cliente Teste",
  phone: "(18) 99999-0000",
  notes: "",
  status: "pendente",
};

describe("bookedSlots", () => {
  it("bloqueia horários pendentes e confirmados, mas libera os recusados", () => {
    const slots = bookedSlots([
      { ...base, protocol: "A" },
      { ...base, protocol: "B", time: "12:00", status: "confirmado" },
      { ...base, protocol: "C", time: "13:00", status: "recusado" },
    ]);
    expect(slots).toEqual(
      new Set(["2026-11-02@11:00", "2026-11-02@12:00"]),
    );
  });
});

describe("summarize", () => {
  it("soma receita e duração apenas dos pedidos ativos", () => {
    const summary = summarize([
      { ...base, protocol: "A" },
      { ...base, protocol: "B", price: 43, durationMin: 40, status: "confirmado" },
      { ...base, protocol: "C", price: 15, durationMin: 10, status: "recusado" },
    ]);
    expect(summary.total).toBe(3);
    expect(summary.pending).toBe(1);
    expect(summary.confirmed).toBe(1);
    expect(summary.revenue).toBe(73);
    expect(summary.hoursLabel).toBe("1h10");
  });
});

describe("buildMessage", () => {
  it("monta a mensagem com protocolo, serviço, horário e contato", () => {
    const message = buildMessage(base);
    expect(message).toContain("*OF-TEST*");
    expect(message).toContain("Corte (30 min)");
    expect(message).toContain("segunda-feira");
    expect(message).toContain("11:00");
    expect(message).toContain("Cliente Teste");
    expect(message).toContain("(18) 99999-0000");
    expect(message).toContain("Máquina");
  });

  it("omite a linha de observação quando ela está vazia", () => {
    expect(buildMessage(base)).not.toContain("*Obs.:*");
  });
});

describe("sortBookings", () => {
  it("ordena por dia e hora sem alterar o array original", () => {
    const list = [
      { ...base, protocol: "B", dayISO: "2026-11-03", time: "09:00" },
      { ...base, protocol: "A", dayISO: "2026-11-02", time: "17:00" },
    ];
    expect(sortBookings(list).map((item) => item.protocol)).toEqual(["A", "B"]);
    expect(list[0].protocol).toBe("B");
  });
});
