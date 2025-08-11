// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  // Модули
  modules: ["@nuxtjs/tailwindcss", "@nuxt/fonts"],

  // Конфигурация для сервера
  runtimeConfig: {
    // Переменные только для сервера
    openaiApiKey: process.env.OPENAI_API_KEY,
  },

  // Настройки Nitro
  nitro: {
    preset: "node-server",
  },

  // Настройки TypeScript
  typescript: {
    strict: true,
  },
});
