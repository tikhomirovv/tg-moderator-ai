// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-08-11",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@nuxt/fonts"],
  runtimeConfig: {
    // Переменные только для сервера
    llmApiKey: process.env.LLM_API_KEY,
    llmBaseUrl: process.env.LLM_BASE_URL,
    llmModel: process.env.LLM_MODEL || "gpt-4.1-nano-2025-04-14",
    llmProvider: process.env.LLM_PROVIDER || "openai",
    databaseUrl:
      process.env.DATABASE_URL ||
      "postgresql://tgmoderator:tgmoderator@localhost:5432/tgmoderator",
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    betterAuthUrl: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  },
  routeRules: {
    "/api/auth/**": { cors: true },
  },
  nitro: {
    preset: "node-server",
  },
  typescript: {
    strict: true,
  },
  // Настройки для прослушивания всех интерфейсов
  devServer: {
    host: "0.0.0.0",
    port: 3001,
  },
});
