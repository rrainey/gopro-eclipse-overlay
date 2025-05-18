import { defineConfig } from 'vitest/config';
export default defineConfig({
    test: {
        include: ['./build/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude: ['**/node_modules/**', './__tests__/**', '**/src/**'],
    },
});
//# sourceMappingURL=vitest.config.js.map