import GLib from "gi://GLib";
import { LanguagePreference } from "./constants.js";

export function getLocale() {
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
  switch(language) {
    case LanguagePreference.ARABIC:
      return "ar";
    case LanguagePreference.BASQUE:
      return "eu";
    case LanguagePreference.BELARUSIAN:
      return "be";
    case LanguagePreference.BULGARIAN:
      return "bg";
    case LanguagePreference.CATALAN:
      return "ca";
    case LanguagePreference["CHINESE-SIMPLIFIED"]:
      return "zh_cn";
    case LanguagePreference["CHINESE-TRADITIONAL"]:
      return "zh_tw";
    case LanguagePreference.CZECH:
      return "cs";
    case LanguagePreference.DANISH:
      return "da";
    case LanguagePreference.DUTCH:
      return "nl";
    case LanguagePreference.ENGLISH:
      return "en";
    case LanguagePreference.FINNISH:
      return "fi";
    case LanguagePreference.FRENCH:
      return "fr";
    case LanguagePreference.GERMAN:
      return "de";
    case LanguagePreference.GREEK:
      return "el";
    case LanguagePreference.HEBREW:
      return "he";
    case LanguagePreference.HUNGARIAN:
      return "hu";
    case LanguagePreference.INDONESIAN:
      return "id";
    case LanguagePreference.ITALIAN:
      return "it";
    case LanguagePreference.JAPANESE:
      return "ja";
    case LanguagePreference.LITHUANIAN:
      return "lt";
    case LanguagePreference["NORWEGIAN-BOKMÅL"]:
      return "nb";
    case LanguagePreference.POLISH:
      return "pl";
    case LanguagePreference.PORTUGUESE:
      return "pt";
    case LanguagePreference["PORTUGUESE-BRAZIL"]:
      return "pt_br";
    case LanguagePreference.ROMANIAN:
      return "ro";
    case LanguagePreference.RUSSIAN:
      return "ru";
    case LanguagePreference.SERBIAN:
      return "sr";
    case LanguagePreference["SERBIAN-LATIN"]:
      return "sr@latin";
    case LanguagePreference.SLOVAK:
      return "sk";
    case LanguagePreference.SPANISH:
      return "es";
    case LanguagePreference.SWEDISH:
      return "sv";
    case LanguagePreference.SYSTEM:
      return "system";
    case LanguagePreference.TURKISH:
      return "tr";
    case LanguagePreference.UKRAINIAN:
      return "uk";
    case LanguagePreference.VIETNAMESE:
      return "vi";
    default:
      return "en";
  }
}

/**
 * Compares a string against all the keys in an object/enum
 * and returns the value of the key matched.
 * 
 * @param {string} str String to compare with the object/enum
 * @param {object} obj Object/enum that will be compared
 * @returns {number} Value of the key that matched with the string, should be an index. 
 */
export function getEnumIndex(str, obj) {
  str = str.toLowerCase();

  for (let key in obj) {
    let k = key.toLowerCase();
    if (str.includes(k)) {
      return obj[key]
    }
  }
  return 0;
}
