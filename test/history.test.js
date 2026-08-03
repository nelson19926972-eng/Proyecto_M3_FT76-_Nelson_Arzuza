import { describe, it, expect } from "vitest";
import {
  appendUserMessage,
  appendAssistantMessage,
  getTrimmedHistory,
  resetHistory,
} from "./src/engine/history.js";

describe("appendUserMessage", () => {
  it("agrega un mensaje de usuario al final", () => {
    const messages = [{ role: "assistant", content: "hola" }];
    const result = appendUserMessage(messages, "Kratos, ayudame");

    expect(result).toEqual([
      { role: "assistant", content: "hola" },
      { role: "user", content: "Kratos, ayudame" },
    ]);
  });

  it("no muta el array original", () => {
    const messages = [{ role: "assistant", content: "hola" }];
    const result = appendUserMessage(messages, "nuevo");

    expect(messages).toHaveLength(1);
    expect(result).not.toBe(messages);
  });

  it("funciona con un historial vacio", () => {
    const result = appendUserMessage([], "primer mensaje");
    expect(result).toEqual([{ role: "user", content: "primer mensaje" }]);
  });
});

describe("appendAssistantMessage", () => {
  it("agrega un mensaje de assistant al final", () => {
    const messages = [{ role: "user", content: "hola" }];
    const result = appendAssistantMessage(messages, "Habla.");

    expect(result).toEqual([
      { role: "user", content: "hola" },
      { role: "assistant", content: "Habla." },
    ]);
  });

  it("no muta el array original", () => {
    const messages = [{ role: "user", content: "hola" }];
    const result = appendAssistantMessage(messages, "respuesta");

    expect(messages).toHaveLength(1);
    expect(result).not.toBe(messages);
  });

  it("funciona con un historial vacio", () => {
    const result = appendAssistantMessage([], "primera respuesta");
    expect(result).toEqual([{ role: "assistant", content: "primera respuesta" }]);
  });
});

describe("getTrimmedHistory", () => {
  const buildMessages = (n) =>
    Array.from({ length: n }, (_, i) => ({ role: "user", content: `msg-${i}` }));

  it("devuelve el historial completo si tiene menos mensajes que maxTurns", () => {
    const messages = buildMessages(3);
    expect(getTrimmedHistory(messages, 10)).toEqual(messages);
  });

  it("devuelve solo los ultimos maxTurns mensajes", () => {
    const messages = buildMessages(15);
    const result = getTrimmedHistory(messages, 10);

    expect(result).toHaveLength(10);
    expect(result[0]).toEqual({ role: "user", content: "msg-5" });
    expect(result[result.length - 1]).toEqual({ role: "user", content: "msg-14" });
  });

  it("usa 10 como maxTurns por defecto", () => {
    const messages = buildMessages(25);
    const result = getTrimmedHistory(messages);
    expect(result).toHaveLength(10);
    expect(result[0]).toEqual({ role: "user", content: "msg-15" });
  });

  it("no muta el array original", () => {
    const messages = buildMessages(15);
    getTrimmedHistory(messages, 10);
    expect(messages).toHaveLength(15);
  });

  it("devuelve un array vacio si el historial de entrada esta vacio", () => {
    expect(getTrimmedHistory([], 10)).toEqual([]);
  });

  it("con maxTurns exactamente igual a la cantidad de mensajes, devuelve todos", () => {
    const messages = buildMessages(10);
    expect(getTrimmedHistory(messages, 10)).toEqual(messages);
  });

  it("BUG: con maxTurns=0 devuelve el historial COMPLETO, no vacio", () => {
    // slice(-0) equivale a slice(0), asi que no recorta nada.
    // Si se espera que maxTurns=0 signifique "sin historial", hay que
    // manejar ese caso aparte (ver nota en la respuesta).
    const messages = buildMessages(5);
    const result = getTrimmedHistory(messages, 0);
    expect(result).toEqual(messages);
  });

  it("con maxTurns negativo, el comportamiento sigue el de Array.slice(-maxTurns)", () => {
    const messages = buildMessages(5);
    // maxTurns = -2 => slice(-(-2)) => slice(2): todo desde el indice 2
    // en adelante, NO "los ultimos 2". Se documenta el comportamiento real.
    const result = getTrimmedHistory(messages, -2);
    expect(result).toEqual(messages.slice(2));
    expect(result).toEqual([
      { role: "user", content: "msg-2" },
      { role: "user", content: "msg-3" },
      { role: "user", content: "msg-4" },
    ]);
  });
});

describe("resetHistory", () => {
  it("devuelve un array vacio", () => {
    expect(resetHistory()).toEqual([]);
  });

  it("devuelve una nueva referencia cada vez que se llama", () => {
    const first = resetHistory();
    const second = resetHistory();
    expect(first).not.toBe(second);
  });
});

describe("integracion: append + trim", () => {
  it("agregar mensajes de user y assistant y luego recortar mantiene el orden", () => {
    let history = resetHistory();
    history = appendUserMessage(history, "hola");
    history = appendAssistantMessage(history, "Habla.");
    history = appendUserMessage(history, "quien eres");
    history = appendAssistantMessage(history, "Soy Kratos.");

    const trimmed = getTrimmedHistory(history, 2);

    expect(trimmed).toEqual([
      { role: "user", content: "quien eres" },
      { role: "assistant", content: "Soy Kratos." },
    ]);
  });
});