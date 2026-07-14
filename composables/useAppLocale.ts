export type AppLocaleCode = "en" | "ru";

/** Thin wrapper around @nuxtjs/i18n locale switching (cookie persisted by module). */
export function useAppLocale() {
  const { locale, setLocale } = useI18n();

  async function switchLocale(code: AppLocaleCode) {
    if (locale.value === code) {
      return;
    }
    await setLocale(code);
  }

  return {
    locale,
    switchLocale,
  };
}
