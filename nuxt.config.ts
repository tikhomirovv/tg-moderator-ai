// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-08-11",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@nuxt/fonts"],
  runtimeConfig: {
    // Переменные только для сервера
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL || "gpt-4.1-nano-2025-04-14",
    databaseUrl:
      process.env.DATABASE_URL ||
      "postgresql://tgmoderator:tgmoderator@localhost:5432/tgmoderator",
  },
  nitro: {
    preset: "node-server",
    serverAssets: [
      {
        baseName: "database-migrations",
        dir: "./server/database/migrations",
      },
    ],
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
