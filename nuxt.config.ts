// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-08-11",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@nuxt/fonts"],
  runtimeConfig: {
    // Переменные только для сервера
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL || "gpt-4.1-nano-2025-04-14",
    mongodbUri:
      process.env.MONGODB_URI || "mongodb://localhost:27017/tg-moderator",
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
