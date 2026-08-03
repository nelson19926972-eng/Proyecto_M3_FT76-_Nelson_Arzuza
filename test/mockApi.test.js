import { describe, it, expect } from "vitest";

import handler from "../api/chat.js";
import { shouldUseMockApi, buildMockChatResponse } from "../api/utils/mockApi.js";

describe("mock API", () => {
  it("detecta que hay que usar mock cuando NODE_ENV es test", () => {
    expect(shouldUseMockApi({ NODE_ENV: "test" })).toBe(true);
    expect(shouldUseMockApi({ NODE_ENV: "production" })).toBe(false);
  });

  it("devuelve una respuesta mock sin requerir GEMINI_API_KEY", async () => {
    const req = {
      method: "POST",
      body: {
        model: "gemini-3.1-flash-lite",
        messages: [{ role: "user", content: "hola mock" }],
      },
    };

    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        return this;
      },
    };

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.role).toBe("assistant");
    expect(res.payload.content[0].type).toBe("text");
    expect(res.payload.content[0].text).toContain("hola mock");
  });

  it("genera una respuesta mock con la misma forma del chat real", () => {
    const response = buildMockChatResponse({
      payload: {
        model: "gemini-3.1-flash-lite",
        messages: [{ role: "user", content: "Prueba" }],
      },
      lastUserText: "Prueba",
    });

    expect(response.type).toBe("message");
    expect(response.role).toBe("assistant");
    expect(response.content[0].text).toContain("Prueba");
    expect(response.usage.input_tokens).toBeGreaterThan(0);
    expect(response.usage.output_tokens).toBeGreaterThan(0);
  });
});
