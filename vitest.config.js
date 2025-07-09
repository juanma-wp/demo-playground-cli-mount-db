import { defineConfig } from 'vitest/config';
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts'],
        testTimeout: 60000, // 60 seconds for Playground initialization
        hookTimeout: 60000,
    },
});
//# sourceMappingURL=vitest.config.js.map