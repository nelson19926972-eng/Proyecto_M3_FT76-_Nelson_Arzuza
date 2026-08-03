import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { callAI } from "./src/engine/aiClient.js";

// Helper para construir un Response-like falso, similar a lo que
// devuelve fetch en el navegador.
function fakeResponse({ ok, status, json }) {
  return {
    ok,
    status,
    json: json ?? (() => Promise.resolve({})),
  };
}

describe("callAI", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("hace POST a /api/chat con headers y body correctos", async () => {
    const payload = { model: "x", messages: [] };
    fetch.mockResolvedValue(
      fakeResponse({ ok: true, status: 200, json: () => Promise.resolve({ reply: "hola" }) })
    );

    await callAI(payload);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  });

  it("devuelve el JSON parseado cuando la respuesta es ok", async () => {
    const data = { reply: "Habla, chico." };
    fetch.mockResolvedValue(
      fakeResponse({ ok: true, status: 200, json: () => Promise.resolve(data) })
    );

    const result = await callAI({});
    expect(result).toEqual(data);
  });

  it("si la respuesta es ok pero el JSON falla, devuelve un objeto vacio", async () => {
    fetch.mockResolvedValue(
      fakeResponse({ ok: true, status: 200, json: () => Promise.reject(new Error("bad json")) })
    );

    const result = await callAI({});
    expect(result).toEqual({});
  });

  it("lanza un error usando data.error y conserva status/retryAfterSeconds", async () => {
    fetch.mockResolvedValue(
      fakeResponse({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: "Demasiadas peticiones", retryAfterSeconds: 30 }),
      })
    );

    await expect(callAI({})).rejects.toMatchObject({
      message: "Demasiadas peticiones",
      status: 429,
      retryAfterSeconds: 30,
    });
  });

  it("si la respuesta no es ok y no hay data.error, usa 'HTTP {status}' como mensaje", async () => {
    fetch.mockResolvedValue(
      fakeResponse({ ok: false, status: 500, json: () => Promise.resolve({}) })
    );

    await expect(callAI({})).rejects.toMatchObject({
      message: "HTTP 500",
      status: 500,
      retryAfterSeconds: undefined,
    });
  });

  it("si la respuesta no es ok y el JSON tambien falla, usa 'HTTP {status}' como mensaje", async () => {
    fetch.mockResolvedValue(
      fakeResponse({
        ok: false,
        status: 503,
        json: () => Promise.reject(new Error("invalid json")),
      })
    );

    await expect(callAI({})).rejects.toMatchObject({
      message: "HTTP 503",
      status: 503,
    });
  });

  it("si fetch lanza TypeError (servidor caido), lanza un error amigable con status 503", async () => {
    fetch.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(callAI({})).rejects.toMatchObject({
      message: "El servidor no está activo. Ejecuta: >>npm run local<< antes de usar el chat.",
      status: 503,
    });
  });

  it("si fetch lanza un error que NO es TypeError, lo relanza tal cual (sin envolver)", async () => {
    const original = new Error("algo raro paso");
    fetch.mockRejectedValue(original);

    await expect(callAI({})).rejects.toBe(original);
  });

  it("un error HTTP normal (no TypeError) no se confunde con el error de 'servidor caido'", async () => {
    fetch.mockResolvedValue(
      fakeResponse({ ok: false, status: 400, json: () => Promise.resolve({ error: "Bad request" }) })
    );

    await expect(callAI({})).rejects.toMatchObject({
      message: "Bad request",
      status: 400,
    });
  });
});