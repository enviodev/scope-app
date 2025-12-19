import { config } from 'dotenv';
config({ path: '.env.local' }); // <- important
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set');

export default defineConfig({
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
  schema: './src/db/schema.ts',
  out: './drizzle',
});