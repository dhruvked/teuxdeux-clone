import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  // During local development drizzle-kit loads from dotenv or process.env.
  // We can gracefully fall back to prevent syntax errors during build time.
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
