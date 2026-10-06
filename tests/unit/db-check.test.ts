import { describe, expect, it } from "vitest";
import { checkDatabase } from "@/lib/db/check";

describe("database diagnostic", () => {
  it("returns success only after query and closes once", async () => {
    let closed = 0;
    let queried = 0;
    const result = await checkDatabase({
      query: async () => { queried += 1; return [{ ok: 1 }]; },
      close: async () => { closed += 1; },
    });
    expect(result).toEqual({ ok: true });
    expect(queried).toBe(1);
    expect(closed).toBe(1);
  });
  it("closes the connection after query failure without exposing the error", async () => {
    let closed = 0;
    const result = await checkDatabase({
      query: async () => { throw new Error("postgresql://private:SECRET@host/db"); },
      close: async () => { closed += 1; },
    });
    expect(result).toEqual({ ok: false });
    expect(JSON.stringify(result)).not.toContain("SECRET");
    expect(closed).toBe(1);
  });
  it("reports failure if connection cleanup fails", async () => {
    const result = await checkDatabase({
      query: async () => [{ ok: 1 }],
      close: async () => { throw new Error("SECRET"); },
    });
    expect(result).toEqual({ ok: false });
  });
});
