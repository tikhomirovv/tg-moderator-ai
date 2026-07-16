// https://nuxt.com/docs/api/configuration/nuxt-config
import pkg from "./package.json";

export default defineNuxtConfig({
  compatibilityDate: "2025-08-11",
  app: {
    head: {
      htmlAttrs: {
        lang: "en",
      },
    },
  },
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@nuxt/fonts", "@nuxtjs/i18n"],
  i18n: {
    defaultLocale: "en",
    locales: [
      { code: "en", language: "en-US", name: "English", file: "en.json" },
      { code: "ru", language: "ru-RU", name: "Русский", file: "ru.json" },
    ],
    lazy: true,
    langDir: "locales",
    strategy: "no_prefix",
    vueI18n: "./i18n.config.ts",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_locale",
      fallbackLocale: "en",
      redirectOn: "root",
    },
    compilation: {
      strictMessage: false,
    },
  },
  runtimeConfig: {
    public: {
      appVersion: pkg.version,
      telegramLoginBotUsername: process.env.TELEGRAM_LOGIN_BOT_USERNAME || "",
      deploymentMode: process.env.DEPLOYMENT_MODE || "self-hosted",
      baseUrl: process.env.BASE_URL || "",
    },
    // Переменные только для сервера
    llmApiKey: process.env.LLM_API_KEY,
    llmBaseUrl: process.env.LLM_BASE_URL,
    llmModel: process.env.LLM_MODEL || "gpt-4.1-nano-2025-04-14",
    databaseUrl:
      process.env.DATABASE_URL ||
      "postgresql://tgmoderator:tgmoderator@localhost:5432/tgmoderator",
    telegramLoginBotId: process.env.TELEGRAM_LOGIN_BOT_ID,
    telegramLoginClientSecret: process.env.TELEGRAM_LOGIN_CLIENT_SECRET,
  },
  routeRules: {
    "/api/auth/**": { cors: true },
  },
  nitro: {
    preset: "node-server",
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      "0 3 * * *": [
        "retention:user-messages",
        "retention:moderation-actions",
        "retention:moderation-decisions",
        "billing:reconcile-credits",
      ],
    },
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