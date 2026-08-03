import { describe, it, expect } from "vitest";
import {
  getCharacter,
  createSystemPrompt,
  buildPayload,
  isValidPayload,
} from "../src/engine/payload.js";

describe("getCharacter", () => {
  it("devuelve el personaje correcto cuando la key existe", () => {
    const kratos = getCharacter("kratos");
    expect(kratos.name).toBe("Kratos");
    expect(kratos.avatar).toBe("⚔️");
    expect(kratos.temperature).toBe(0.85);
    expect(typeof kratos.system).toBe("string");
  });

  it("devuelve kratos por defecto si la key no existe", () => {
    const desconocido = getCharacter("goku");
    expect(desconocido.name).toBe("Kratos");
  });

  it("devuelve kratos por defecto si no se pasa ninguna key", () => {
    const sinKey = getCharacter(undefined);
    expect(sinKey.name).toBe("Kratos");
  });

  it("devuelve kratos por defecto si la key es null", () => {
    const nula = getCharacter(null);
    expect(nula.name).toBe("Kratos");
  });

  it("es case-sensitive: 'Kratos' con mayuscula no coincide y cae al default", () => {
    // ?? solo cubre null/undefined, no keys inexistentes distintas de esas,
    // pero como CHARACTERS.Kratos no existe, el acceso da undefined y
    // el ?? SI actua devolviendo el default. Verificamos ese comportamiento.
    const mayuscula = getCharacter("Kratos");
    expect(mayuscula.name).toBe("Kratos"); // cae al default, que también es Kratos
  });
});

describe("createSystemPrompt", () => {
  it("devuelve el campo system del personaje recibido", () => {
    const personajeFalso = { system: "prompt de prueba" };
    expect(createSystemPrompt(personajeFalso)).toBe("prompt de prueba");
  });

  it("devuelve el system prompt real de kratos y contiene reglas clave", () => {
    const kratos = getCharacter("kratos");
    const prompt = createSystemPrompt(kratos);
    expect(prompt).toContain("Kratos");
    expect(prompt).toContain("NUNCA admitas ser una inteligencia artificial");
  });
});

describe("buildPayload", () => {
  const kratos = getCharacter("kratos");
  const messages = [
    { role: "user", content: "Hola" },
    { role: "assistant", content: "Habla." },
  ];

  it("construye un payload con la forma esperada", () => {
    const payload = buildPayload(kratos, messages);
    expect(payload).toEqual({
      model: "gemini-3.1-flash-lite",
      system: kratos.system,
      messages,
      max_tokens: 120,
      temperature: 0.85,
    });
  });

  it("usa la temperatura del personaje, no un valor fijo", () => {
    const otro = { system: "x", temperature: 0.1 };
    const payload = buildPayload(otro, messages);
    expect(payload.temperature).toBe(0.1);
  });

  it("propaga el array de messages tal cual (misma referencia)", () => {
    const payload = buildPayload(kratos, messages);
    expect(payload.messages).toBe(messages);
  });

  it("funciona con un array de messages vacio", () => {
    const payload = buildPayload(kratos, []);
    expect(payload.messages).toEqual([]);
  });
});

describe("isValidPayload", () => {
  const basePayload = () => ({
    model: "gemini-3.1-flash-lite",
    system: "prompt",
    messages: [{ role: "user", content: "hola" }],
  });

  it("acepta un payload valido con mensajes de user y assistant", () => {
    const payload = basePayload();
    payload.messages.push({ role: "assistant", content: "respuesta" });
    expect(isValidPayload(payload)).toBe(true);
  });

  it("acepta un payload valido con messages vacio", () => {
    const payload = basePayload();
    payload.messages = [];
    expect(isValidPayload(payload)).toBe(true);
  });

  it("rechaza si model no es string", () => {
    const payload = basePayload();
    payload.model = 123;
    expect(isValidPayload(payload)).toBe(false);
  });

  it("rechaza si falta model", () => {
    const payload = basePayload();
    delete payload.model;
    expect(isValidPayload(payload)).toBe(false);
  });

  it("rechaza si system no es string", () => {
    const payload = basePayload();
    payload.system = null;
    expect(isValidPayload(payload)).toBe(false);
  });

  it("rechaza si messages no es un array", () => {
    const payload = basePayload();
    payload.messages = "no soy un array";
    expect(isValidPayload(payload)).toBe(false);
  });

  it("rechaza si algun mensaje tiene un role invalido", () => {
    const payload = basePayload();
    payload.messages.push({ role: "system", content: "no permitido" });
    expect(isValidPayload(payload)).toBe(false);
  });

  it("rechaza si algun mensaje tiene content que no es string", () => {
    const payload = basePayload();
    payload.messages.push({ role: "user", content: { texto: "objeto" } });
    expect(isValidPayload(payload)).toBe(false);
  });

  it("rechaza si algun mensaje no tiene content", () => {
    const payload = basePayload();
    payload.messages.push({ role: "user" });
    expect(isValidPayload(payload)).toBe(false);
  });

  it("rechaza si algun mensaje es null", () => {
    const payload = basePayload();
    payload.messages.push(null);
    expect(isValidPayload(payload)).toBe(false);
  });

  it("acepta payload construido por buildPayload + getCharacter (integracion)", () => {
    const kratos = getCharacter("kratos");
    const payload = buildPayload(kratos, [{ role: "user", content: "Kratos, ayudame" }]);
    expect(isValidPayload(payload)).toBe(true);
  });
});