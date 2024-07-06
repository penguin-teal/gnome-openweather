import GLib from "gi://GLib";
import { LanguagePreference } from "./constants.js";

export function getLocale() {
  // Get locale from the system
  let locale = GLib.get_language_names()[0];
  if (locale.indexOf("_") !== -1)
    locale = locale.split("_")[0];
  // Fallback for 'C', 'C.UTF-8', and unknown locales.
  else locale = "en";
  return locale;
}

export function toLocale(lang) {
  if (lang.indexOf("@") !== -1) lang = lang.split("@")[0];
  if (lang.indexOf("_") !== -1) lang = lang.split("_")[0];
  return lang;
}

export function toLanguageCode(language) {
  let lang;
  switch(language.toLowerCase()) {
    case LanguagePreference.SYSTEM:
    lang = "system";
    break;
    case LanguagePreference.ARABIC:
      lang = "ar";
      break;
    case LanguagePreference.BELARUSIAN:
      lang = "be";
      break;
    case LanguagePreference.BULGARIAN:
      lang = "bg";
      break;
    case LanguagePreference.CATALAN:
      lang = "ca";
      break;
    case LanguagePreference.CZECH:
      lang = "cs";
      break;
    case LanguagePreference.DANISH:
      lang = "da";
      break;
    case LanguagePreference.GERMAN:
      lang = "de";
      break;
    case LanguagePreference.GREEK:
      lang = "el";
      break;
    case LanguagePreference.ENGLISH:
      lang = "en";
      break;
    case LanguagePreference.SPANISH:
      lang = "es";
      break;
    case LanguagePreference.BASQUE:
      lang = "eu";
      break;
    case LanguagePreference.FINNISH:
      lang = "fi";
      break;
    case LanguagePreference.FRENCH:
      lang = "fr";
      break;
    case LanguagePreference.HEBREW:
      lang = "he";
      break;
    case LanguagePreference.HUNGARIAN:
      lang = "hu";
      break;
    case LanguagePreference.INDONESIAN:
      lang = "id";
      break;
    case LanguagePreference.ITALIAN:
      lang = "it";
      break;
    case LanguagePreference.JAPANESE:
      lang = "ja";
      break;
    case LanguagePreference.LITHUANIAN:
      lang = "lt";
      break;
    case LanguagePreference["NORWEGIAN BOKMÅL"]:
      lang = "nb";
      break;
    case LanguagePreference.DUTCH:
      lang = "nl";
      break;
    case LanguagePreference.POLISH:
      lang = "pl";
      break;
    case LanguagePreference["PORTUGUESE (BRAZIL)"]:
      lang = "pt_br";
      break;
    case LanguagePreference.PORTUGUESE:
      lang = "pt";
      break;
    case LanguagePreference.ROMANIAN:
      lang = "ro";
      break;
    case LanguagePreference.RUSSIAN:
      lang = "ru";
      break;
    case LanguagePreference.SLOVAK:
      lang = "sk";
      break;
    case LanguagePreference.SERBIAN:
      lang = "sr";
      break;
    case LanguagePreference["SERBIAN (LATIN)"]:
      lang = "sr@latin";
      break;
    case LanguagePreference.SWEDISH:
      lang = "sv"
      break;
    case LanguagePreference.TURKISH:
      lang = "tr"
      break;
    case LanguagePreference.UKRAINIAN:
      lang = "uk"
      break;
    case LanguagePreference.VIETNAMESE:
      lang = "vi"
      break;
    case LanguagePreference["CHINESE (SIMPLIFIED)"]:
      lang = "zh_cn";
      break;
    case LanguagePreference["CHINESE (TRADITIONAL)"]:
      lang = "zh_tw"
      break;
    default:
      lang = "en"
      break;
  }
    return lang;
}
