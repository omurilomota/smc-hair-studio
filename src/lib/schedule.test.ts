import { describe, expect, it } from "vitest";
import {
  findNextAvailable,
  formatPhone,
  getSlots,
  getStatus,
  isOpenDay,
  slotsForDay,
  toISO,
} from "./schedule";

// 26/10/2026 é uma segunda-feira; 01/11/2026 é domingo.
const monday = new Date(2026, 9, 26, 12, 0);
const sunday = new Date(2026, 10, 1, 10, 0);
const saturday = new Date(2026, 9, 31, 12, 0);

describe("horários de funcionamento", () => {
  it("fecha aos domingos e abre de segunda a sábado", () => {
    expect(isOpenDay(sunday)).toBe(false);
    expect(isOpenDay(monday)).toBe(true);
    expect(isOpenDay(saturday)).toBe(true);
  });

  it("não oferece horário durante o intervalo de almoço", () => {
    const slots = slotsForDay(monday);
    expect(slots).toContain("11:00");
    expect(slots).toContain("13:00");
    expect(slots).toContain("15:00");
    expect(slots).not.toContain("14:00");
  });

  it("só oferece horário se o serviço mais longo couber até o fechamento", () => {
    // Sábado fecha 18h15; o último slot com 40 min é 17h.
    const saturdaySlots = slotsForDay(saturday);
    expect(saturdaySlots).toContain("17:00");
    expect(saturdaySlots).not.toContain("18:00");
    // Segunda fecha 20h, então 19h ainda cabe.
    expect(slotsForDay(monday)).toContain("19:00");
  });

  it("marca como passado o horário que já começou ou começa em menos de 45 min", () => {
    const slots = getSlots("2026-10-26", monday, new Set(["2026-10-26@16:00"]));
    const byTime = Object.fromEntries(slots.map((slot) => [slot.time, slot]));
    expect(byTime["11:00"].past).toBe(true);
    expect(byTime["12:00"].past).toBe(true);
    expect(byTime["15:00"].past).toBe(false);
    expect(byTime["16:00"].available).toBe(false);
    expect(byTime["17:00"].available).toBe(true);
  });

  it("encontra o próximo horário livre pulando o domingo", () => {
    const next = findNextAvailable(sunday);
    expect(next).not.toBeNull();
    expect(next?.dayISO).toBe("2026-11-02");
    expect(next?.time).toBe("11:00");
    expect(next?.label).toBe("Amanhã");
  });

  it("informa aberto, intervalo e fechado corretamente", () => {
    expect(getStatus(new Date(2026, 9, 26, 10, 0))).toEqual({
      open: false,
      label: "Fechado · abre hoje às 11h",
    });
    expect(getStatus(new Date(2026, 9, 26, 12, 0))).toEqual({
      open: true,
      label: "Aberto agora · até 13h45",
    });
    expect(getStatus(new Date(2026, 9, 26, 14, 0))).toEqual({
      open: false,
      label: "Intervalo · voltamos às 15h",
    });
    expect(getStatus(new Date(2026, 9, 26, 21, 0)).open).toBe(false);
  });
});

describe("utilitários", () => {
  it("converte data local para ISO sem deslocar o dia", () => {
    expect(toISO(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });

  it("formata telefone brasileiro com DDD", () => {
    expect(formatPhone("18999990119")).toBe("(18) 99999-0119");
    expect(formatPhone("1833334444")).toBe("(18) 3333-4444");
    expect(formatPhone("18")).toBe("(18");
    expect(formatPhone("")).toBe("");
  });
});
