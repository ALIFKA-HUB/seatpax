import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
// Hosted fixtures include many sequential network round trips; domain SQL timeouts stay unchanged.
export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},test:{environment:'node',include:['tests/integration/**/*.test.ts'],testTimeout:120000,hookTimeout:15000,fileParallelism:false}});
