import { defineConfig } from '@prisma/config';

export default defineConfig({
  migrations: {
    seed: 'npx tsx prisma/seed-from-mysql.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});