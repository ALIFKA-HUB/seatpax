import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "@/lib/env/public";
import { parseDatabaseEnv } from "@/lib/env/database";

const publicInput = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_demo",
};
const databaseUrl = "postgresql://user:password@localhost:5432/postgres";

describe("public configuration", () => {
  it("rejects missing public configuration by field name", () => {
    expect(() => parsePublicEnv({})).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
  it("returns only browser-safe values", () => {
    expect(parsePublicEnv({ ...publicInput, DATABASE_URL: databaseUrl })).toEqual({
      supabaseUrl: "https://example.supabase.co",
      supabasePublishableKey: "sb_publishable_demo",
    });
  });
  it.each(["invalid", "postgresql://localhost/db"])("rejects non-http project URL %s", (url) => {
    expect(() => parsePublicEnv({ ...publicInput, NEXT_PUBLIC_SUPABASE_URL: url })).toThrow();
  });
  it("rejects blank publishable keys", () => {
    expect(() => parsePublicEnv({ ...publicInput, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "  " })).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });
  it("does not echo invalid input in errors", () => {
    const secret = "PRIVATE_CANARY_DO_NOT_ECHO";
    let message = "";
    try { parsePublicEnv({ ...publicInput, NEXT_PUBLIC_SUPABASE_URL: secret }); }
    catch (error) { message = (error as Error).message; }
    expect(message).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(message).not.toContain(secret);
  });
});

describe("database configuration", () => {
  it("treats blank optional migration URL from env template as absent", () => {
    expect(parseDatabaseEnv({ DATABASE_URL: databaseUrl, DATABASE_MIGRATION_URL: "" }).migrationUrl).toBe(databaseUrl);
  });
  it("uses the runtime URL when migration URL is absent", () => {
    expect(parseDatabaseEnv({ DATABASE_URL: databaseUrl })).toEqual({ databaseUrl, migrationUrl: databaseUrl });
  });
  it("accepts an explicit migration URL", () => {
    const migrationUrl = "postgres://user:pass@localhost:5433/postgres";
    expect(parseDatabaseEnv({ DATABASE_URL: databaseUrl, DATABASE_MIGRATION_URL: migrationUrl })).toEqual({ databaseUrl, migrationUrl });
  });
  it.each([undefined, "", "https://example.com/SECRET"])("rejects missing/invalid database URLs without leaking values", (url) => {
    expect(() => parseDatabaseEnv({ DATABASE_URL: url })).toThrow(/DATABASE_URL/);
    expect(() => parseDatabaseEnv({ DATABASE_URL: url })).not.toThrow(/SECRET/);
  });
  it("rejects malformed migration override", () => {
    expect(() => parseDatabaseEnv({ DATABASE_URL: databaseUrl, DATABASE_MIGRATION_URL: "bad" })).toThrow(/DATABASE_MIGRATION_URL/);
  });
});
