import { describe, it, expect, vi, afterEach } from "vitest";

import { NO_TOKENS_MESSAGE, getHttpStatus, isRateLimitError } from "./api/utils/errors.js";
import { toGeminiContents } from "./api/utils/gemini.js";
import { parseJsonBody, getMessages, getGenerationSettings } from "./api/utils/request.js";
import { createChatResponse } from "./api/utils/response.js";

// ============================================================
// errors.js
// ============================================================

describe("errors", () => {
  describe("NO_TOKENS_MESSAGE", () => {
    it("es un mensaje de texto no vacio", () => {
      expect(typeof NO_TOKENS_MESSAGE).toBe("string");
      expect(NO_TOKENS_MESSAGE.length).toBeGreaterThan(0);
    });
  });

  describe("getHttpStatus", () => {
    it("devuelve error.status cuando es un numero", () => {
      expect(getHttpStatus({ status: 429 })).toBe(429);
      expect(getHttpStatus({ status: 0 })).toBe(0);
    });

    it("devuelve 500 si status no es numero", () => {
      expect(getHttpStatus({ status: "429" })).toBe(500);
      expect(getHttpStatus({ status: null })).toBe(500);
    });

    it("devuelve 500 si falta status", () => {
      expect(getHttpStatus({})).toBe(500);
    });

    it("devuelve 500 si error es undefined o null", () => {
      expect(getHttpStatus(undefined)).toBe(500);
      expect(getHttpStatus(null)).toBe(500);
    });
  });

  describe("isRateLimitError", () => {
    it("devuelve true cuando status es 429", () => {
      expect(isRateLimitError({ status: 429, message: "algo distinto" })).toBe(true);
    });

    it("devuelve true cuando el mensaje contiene '429'", () => {
      expect(isRateLimitError({ message: "Error HTTP 429 recibido" })).toBe(true);
    });

    it("devuelve true cuando el mensaje contiene 'quota'", () => {
      expect(isRateLimitError({ message: "Quota exceeded for this project" })).toBe(true);
    });

    it("devuelve true cuando el mensaje contiene 'resource_exhausted'", () => {
      expect(isRateLimitError({ message: "RESOURCE_EXHAUSTED: try later" })).toBe(true);
    });

    it("devuelve true cuando el mensaje contiene 'exhausted' (sin importar mayusculas)", () => {
      expect(isRateLimitError({ message: "Rate EXHAUSTED" })).toBe(true);
    });

    it("es case-insensitive para el texto del mensaje", () => {
      expect(isRateLimitError({ message: "QUOTA superada" })).toBe(true);
    });

    it("devuelve false para un error normal sin relacion a rate limit", () => {
      expect(isRateLimitError({ status: 500, message: "Internal Server Error" })).toBe(false);
    });

    it("devuelve false si error es undefined o null", () => {
      expect(isRateLimitError(undefined)).toBe(false);
      expect(isRateLimitError(null)).toBe(false);
    });

    it("devuelve false si error no tiene status ni message", () => {
      expect(isRateLimitError({})).toBe(false);
    });
  });
});

// ============================================================
// gemini.js
// ============================================================

describe("gemini", () => {
  describe("toGeminiContents", () => {
    it("convierte role 'user' a 'user' y mueve el texto a parts", () => {
      const result = toGeminiContents([{ role: "user", content: "Hola" }]);
      expect(result).toEqual([{ role: "user", parts: [{ text: "Hola" }] }]);
    });

    it("convierte role 'assistant' a 'model'", () => {
      const result = toGeminiContents([{ role: "assistant", content: "Habla." }]);
      expect(result).toEqual([{ role: "model", parts: [{ text: "Habla." }] }]);
    });

    it("filtra mensajes con un role invalido (ej. 'system')", () => {
      const result = toGeminiContents([
        { role: "system", content: "instrucciones" },
        { role: "user", content: "hola" },
      ]);
      expect(result).toEqual([{ role: "user", parts: [{ text: "hola" }] }]);
    });

    it("filtra mensajes sin role", () => {
      const result = toGeminiContents([{ content: "sin role" }, { role: "user", content: "ok" }]);
      expect(result).toEqual([{ role: "user", parts: [{ text: "ok" }] }]);
    });

    it("filtra mensajes null o undefined sin lanzar error", () => {
      const result = toGeminiContents([null, undefined, { role: "user", content: "hola" }]);
      expect(result).toEqual([{ role: "user", parts: [{ text: "hola" }] }]);
    });

    it("convierte content ausente a texto vacio", () => {
      const result = toGeminiContents([{ role: "user" }]);
      expect(result).toEqual([{ role: "user", parts: [{ text: "" }] }]);
    });

    it("convierte content no-string a string", () => {
      const result = toGeminiContents([{ role: "user", content: 42 }]);
      expect(result).toEqual([{ role: "user", parts: [{ text: "42" }] }]);
    });

    it("mantiene el orden original de los mensajes validos", () => {
      const result = toGeminiContents([
        { role: "user", content: "1" },
        { role: "assistant", content: "2" },
        { role: "user", content: "3" },
      ]);
      expect(result.map((m) => m.parts[0].text)).toEqual(["1", "2", "3"]);
    });

    it("devuelve un array vacio si no hay mensajes", () => {
      expect(toGeminiContents([])).toEqual([]);
    });
  });
});

// ============================================================
// request.js
// ============================================================

describe("request", () => {
  describe("parseJsonBody", () => {
    it("parsea un string JSON valido", () => {
      expect(parseJsonBody('{"a":1}')).toEqual({ a: 1 });
    });

    it("devuelve {} para un string vacio", () => {
      expect(parseJsonBody("")).toEqual({});
    });

    it("devuelve {} para un string con JSON invalido", () => {
      expect(parseJsonBody("{invalido")).toEqual({});
    });

    it("devuelve el body tal cual si ya es un objeto", () => {
      const body = { messages: [] };
      expect(parseJsonBody(body)).toBe(body);
    });

    it("devuelve {} si el body es null o undefined", () => {
      expect(parseJsonBody(null)).toEqual({});
      expect(parseJsonBody(undefined)).toEqual({});
    });

    it("parsea arrays JSON validos tambien (no solo objetos)", () => {
      expect(parseJsonBody("[1,2,3]")).toEqual([1, 2, 3]);
    });
  });

  describe("getMessages", () => {
    it("devuelve messages cuando es un array no vacio", () => {
      const messages = [{ role: "user", content: "hola" }];
      expect(getMessages({ messages })).toBe(messages);
    });

    it("lanza un error 400 si messages esta vacio", () => {
      expect(() => getMessages({ messages: [] })).toThrow("El payload debe incluir messages[]");
      try {
        getMessages({ messages: [] });
      } catch (err) {
        expect(err.status).toBe(400);
      }
    });

    it("lanza un error 400 si falta messages", () => {
      expect(() => getMessages({})).toThrow();
      try {
        getMessages({});
      } catch (err) {
        expect(err.status).toBe(400);
      }
    });

    it("lanza un error 400 si messages no es un array", () => {
      expect(() => getMessages({ messages: "no es array" })).toThrow();
    });

    it("lanza un error 400 si payload es undefined", () => {
      expect(() => getMessages(undefined)).toThrow();
    });
  });

  describe("getGenerationSettings", () => {
    it("usa los valores del payload cuando tienen el tipo correcto", () => {
      const payload = {
        system: "Eres Kratos",
        model: "gemini-pro",
        temperature: 0.5,
        max_tokens: 300,
      };
      expect(getGenerationSettings(payload)).toEqual({
        system: "Eres Kratos",
        modelName: "gemini-pro",
        temperature: 0.5,
        maxOutputTokens: 300,
      });
    });

    it("usa los valores por defecto cuando el payload esta vacio", () => {
      expect(getGenerationSettings({})).toEqual({
        system: "",
        modelName: "gemini-3.1-flash-lite",
        temperature: 0.85,
        maxOutputTokens: 120,
      });
    });

    it("usa los valores por defecto cuando el payload es undefined", () => {
      expect(getGenerationSettings(undefined)).toEqual({
        system: "",
        modelName: "gemini-3.1-flash-lite",
        temperature: 0.85,
        maxOutputTokens: 120,
      });
    });

    it("ignora campos con el tipo incorrecto y cae al default", () => {
      const payload = {
        system: 123,
        model: 456,
        temperature: "0.9",
        max_tokens: "300",
      };
      expect(getGenerationSettings(payload)).toEqual({
        system: "",
        modelName: "gemini-3.1-flash-lite",
        temperature: 0.85,
        maxOutputTokens: 120,
      });
    });

    it("respeta temperature 0 explicito (no lo confunde con ausente)", () => {
      expect(getGenerationSettings({ temperature: 0 }).temperature).toBe(0);
    });
  });
});

// ============================================================
// response.js
// ============================================================

describe("response", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createChatResponse", () => {
    it("construye la forma esperada de un mensaje de chat", () => {
      vi.spyOn(Date, "now").mockReturnValue(1700000000000);
      const payload = { model: "x", messages: [] };
      const result = createChatResponse({ text: "Habla.", payload });

      expect(result).toEqual({
        id: "msg_gemini_1700000000000",
        type: "message",
        role: "assistant",
        content: [{ type: "text", text: "Habla." }],
        stop_reason: "end_turn",
        usage: {
          input_tokens: expect.any(Number),
          output_tokens: expect.any(Number),
        },
      });
    });

    it("el id incluye el timestamp de Date.now()", () => {
      vi.spyOn(Date, "now").mockReturnValue(123456789);
      const result = createChatResponse({ text: "hola", payload: {} });
      expect(result.id).toBe("msg_gemini_123456789");
    });

    it("calcula output_tokens como max(1, ceil(len(text)/4))", () => {
      const result = createChatResponse({ text: "12345678", payload: {} }); // 8 chars
      expect(result.usage.output_tokens).toBe(2); // ceil(8/4) = 2
    });

    it("output_tokens nunca es menor a 1, incluso con texto vacio", () => {
      const result = createChatResponse({ text: "", payload: {} });
      expect(result.usage.output_tokens).toBe(1);
    });

    it("calcula input_tokens en base a JSON.stringify(payload)", () => {
      const payload = { a: 1 }; // JSON.stringify => '{"a":1}' => 8 caracteres
      const result = createChatResponse({ text: "x", payload });
      expect(result.usage.input_tokens).toBe(Math.max(1, Math.ceil(8 / 4)));
    });

    it("input_tokens nunca es menor a 1 aunque el payload sea undefined", () => {
      // JSON.stringify(undefined) === undefined -> String(undefined) === "undefined" (9 chars)
      const result = createChatResponse({ text: "x", payload: undefined });
      expect(result.usage.input_tokens).toBe(Math.max(1, Math.ceil("undefined".length / 4)));
    });

    it("siempre usa stop_reason 'end_turn'", () => {
      const result = createChatResponse({ text: "cualquier cosa", payload: {} });
      expect(result.stop_reason).toBe("end_turn");
    });

    it("el content siempre es un array con un unico bloque de texto", () => {
      const result = createChatResponse({ text: "unico bloque", payload: {} });
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({ type: "text", text: "unico bloque" });
    });
  });
});