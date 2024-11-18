import { configureLocalization, LocaleModule } from '@lit/localize';
import * as templates_es from '../generated/locales/es';
import * as templates_zh_CN from '../generated/locales/zh-CN';
import * as templates_zh_TW from '../generated/locales/zh-TW';
import { allLocales, sourceLocale, targetLocales } from '../generated/locale-codes';

const localizedTemplates = new Map([
  ['es', templates_es],
  ['zh-CN', templates_zh_CN],
  ['zh-TW', templates_zh_TW],
]);

const { setLocale } = configureLocalization({
  sourceLocale,
  targetLocales,
  loadLocale: async (locale) => localizedTemplates.get(locale) as LocaleModule,
});

setLocale(getLocale());

function getLanguageFromCookie() {
  const match = document.cookie.match(new RegExp('(^| )language=([^;]+)'));
  const matchedLanguage = allLocales.find((locale) => locale === match?.[2]);
  return matchedLanguage;
}

function getLanguageFromBrowser() {
  const language = allLocales.find((locale) => locale === navigator.language);
  return language;
}

export function getLocale() {
  return getLanguageFromCookie() || getLanguageFromBrowser() || sourceLocale;
}
