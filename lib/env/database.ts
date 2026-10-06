import { z } from "zod";

const databaseUrl = z.url().refine((value) => /^postgres(?:ql)?:\/\//.test(value));
const schema = z.object({
  DATABASE_URL: databaseUrl,
  DATABASE_MIGRATION_URL: databaseUrl.optional(),
});

export function parseDatabaseEnv(input: Record<string, string | undefined>) {
  const result = schema.safeParse({
    ...input,
    DATABASE_MIGRATION_URL: input.DATABASE_MIGRATION_URL?.trim() || undefined,
  });
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path[0]))];
    throw new Error(`Invalid configuration: ${fields.join(", ")}`);
  }
  return {
    databaseUrl: result.data.DATABASE_URL,
    migrationUrl: result.data.DATABASE_MIGRATION_URL ?? result.data.DATABASE_URL,
  };
}
