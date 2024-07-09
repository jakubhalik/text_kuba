import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        env: {
            owner: 'kuba',
            ownerPassword: 'o18p4o9p8',
        },
    },
});
