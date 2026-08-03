import { describe, it, expect } from "vitest";
import { normalizeAIResponse, extractUsage } from "./src/engine/normalizer.js";

describe("normalizeAIResponse", () => {
  it("extrae el texto de un unico bloque de tipo text", () => {
    const raw = { content: [{ type: "text", text: "Habla, chico." }] };
    expect(normalizeAIResponse(raw)).toEqual({ text: "Habla, chico.", truncated: false });
  });

  it("concatena varios bloques de texto en orden", () => {
    const raw = {
      content: [
        { type: "text", text: "No lo hagas. " },
        { type: "text", text: "Somos mejores que esto." },
      ],
    };
    expect(normalizeAIResponse(raw).text).toBe("No lo hagas. Somos mejores que esto.");
  });

  it("ignora bloques que no son de tipo text", () => {
    const raw = {
      content: [
        { type: "text", text: "Cierra la boca." },
        { type: "tool_use", name: "algo", input: {} },
        { type: "image", source: "x" },
      ],
    };
    expect(normalizeAIResponse(raw).text).toBe("Cierra la boca.");
  });

  it("ignora bloques de tipo text cuyo campo text no es string", () => {
    const raw = {
      content: [
        { type: "text", text: 123 },
        { type: "text", text: null },
        { type: "text", text: "Basta." },
      ],
    };
    expect(normalizeAIResponse(raw).text).toBe("Basta.");
  });

  it("recorta espacios en blanco al inicio y al final del texto final", () => {
    const raw = { content: [{ type: "text", text: "   El chico tiene razon.   " }] };
    expect(normalizeAIResponse(raw).text).toBe("El chico tiene razon.");
  });

  it("devuelve texto vacio si content no es un array", () => {
    expect(normalizeAIResponse({ content: "no es array" }).text).toBe("");
    expect(normalizeAIResponse({ content: null }).text).toBe("");
    expect(normalizeAIResponse({ content: undefined }).text).toBe("");
  });

  it("devuelve texto vacio si content esta ausente", () => {
    expect(normalizeAIResponse({}).text).toBe("");
  });

  it("no revienta si raw es undefined o null (optional chaining)", () => {
    expect(normalizeAIResponse(undefined)).toEqual({ text: "", truncated: false });
    expect(normalizeAIResponse(null)).toEqual({ text: "", truncated: false });
  });

  it("devuelve texto vacio si content es un array vacio", () => {
    expect(normalizeAIResponse({ content: [] }).text).toBe("");
  });

  it("truncated es true cuando stop_reason es 'max_tokens'", () => {
    const raw = { content: [], stop_reason: "max_tokens" };
    expect(normalizeAIResponse(raw).truncated).toBe(true);
  });

  it("truncated es false para cualquier otro stop_reason", () => {
    expect(normalizeAIResponse({ content: [], stop_reason: "end_turn" }).truncated).toBe(false);
    expect(normalizeAIResponse({ content: [], stop_reason: "stop_sequence" }).truncated).toBe(false);
  });

  it("truncated es false si stop_reason esta ausente", () => {
    expect(normalizeAIResponse({ content: [] }).truncated).toBe(false);
  });

  it("BUG: un bloque null en content hace que la funcion lance un error", () => {
    // block.type se lee sin optional chaining dentro del filter,
    // asi que un bloque null revienta con TypeError en vez de ser ignorado.
    const raw = { content: [{ type: "text", text: "ok" }, null] };
    expect(() => normalizeAIResponse(raw)).toThrow(TypeError);
  });

  it("caso realista completo: texto + truncado", () => {
    const raw = {
      content: [
        { type: "text", text: "No. Hay caminos que ya he recorrido." },
        { type: "tool_use", name: "buscar_dioses" },
      ],
      stop_reason: "max_tokens",
    };
    expect(normalizeAIResponse(raw)).toEqual({
      text: "No. Hay caminos que ya he recorrido.",
      truncated: true,
    });
  });
});

describe("extractUsage", () => {
  it("extrae inputTokens y outputTokens cuando estan presentes", () => {
    const raw = { usage: { input_tokens: 42, output_tokens: 17 } };
    expect(extractUsage(raw)).toEqual({ inputTokens: 42, outputTokens: 17 });
  });

  it("devuelve 0 en ambos campos si usage no esta presente", () => {
    expect(extractUsage({})).toEqual({ inputTokens: 0, outputTokens: 0 });
  });

  it("devuelve 0 en ambos campos si raw es undefined o null", () => {
    expect(extractUsage(undefined)).toEqual({ inputTokens: 0, outputTokens: 0 });
    expect(extractUsage(null)).toEqual({ inputTokens: 0, outputTokens: 0 });
  });

  it("devuelve 0 solo para el campo faltante si usage esta parcialmente presente", () => {
    expect(extractUsage({ usage: { input_tokens: 5 } })).toEqual({
      inputTokens: 5,
      outputTokens: 0,
    });
    expect(extractUsage({ usage: { output_tokens: 8 } })).toEqual({
      inputTokens: 0,
      outputTokens: 8,
    });
  });

  it("respeta el valor 0 explicito (no lo confunde con ausente)", () => {
    expect(extractUsage({ usage: { input_tokens: 0, output_tokens: 0 } })).toEqual({
      inputTokens: 0,
      outputTokens: 0,
    });
  });
});