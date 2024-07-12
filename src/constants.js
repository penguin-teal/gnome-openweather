const LanguagePreference = {
  SYSTEM: 0,
  ARABIC: 1,
  BASQUE: 2,
  BELARUSIAN: 3,
  BULGARIAN: 4,
  CATALAN: 5,
  "CHINESE-SIMPLIFIED": 6,
  "CHINESE-TRADITIONAL": 7,
  CZECH: 8,
  DANISH: 9,
  DUTCH: 10,
  ENGLISH: 11,
  FINNISH: 12,
  FRENCH: 13,
  GERMAN: 14,
  GREEK: 15,
  HEBREW: 16,
  HUNGARIAN: 17,
  INDONESIAN: 18,
  ITALIAN: 19,
  JAPANESE: 20,
  LITHUANIAN: 21,
  "NORWEGIAN-BOKMÅL": 22,
  POLISH: 23,
  PORTUGUESE: 24,
  "PORTUGUESE-BRAZIL": 25,
  ROMANIAN: 26,
  RUSSIAN: 27,
  SERBIAN: 28,
  "SERBIAN-LATIN": 29,
  SLOVAK: 30,
  SPANISH: 31,
  SWEDISH: 32,
  TURKISH: 33,
  UKRAINIAN: 34,
  VIETNAMESE: 35,
};

const WeatherUnits = {
  CELSIUS: 0,
  FAHRENHEIT: 1,
  KELVIN: 2,
  RANKINE: 3,
  REAUMUR: 4,
  ROEMER: 5,
  DELISLE: 6,
  NEWTON: 7,
};

const WeatherWindSpeedUnits = {
  KPH: 0,
  MPH: 1,
  MPS: 2,
  KNOTS: 3,
  FPS: 4,
  BEAUFORT: 5,
};

const WeatherPressureUnits = {
  HPA: 0,
  INHG: 1,
  BAR: 2,
  PA: 3,
  KPA: 4,
  ATM: 5,
  AT: 6,
  TORR: 7,
  PSI: 8,
  MMHG: 9,
  MBAR: 10,
};

const HiContrastStyle = {
  NONE: 0,
  WHITE: 1,
  BLACK: 2,
};

const ClockFormat = {
  _24H: 0,
  _12H: 1,
  SYSTEM: 2,
};

const WeatherPosition = {
  CENTER: 0,
  RIGHT: 1,
  LEFT: 2,
};

// Keep enums in sync with GSettings schemas
const GeolocationProvider = {
  OPENSTREETMAPS: 0,
  /* Geocode.Farm is no longer valid but kept here for migration. */
  GEOCODE: 1,
  MAPQUEST: 2,
};

export {
  LanguagePreference,
  WeatherUnits,
  WeatherWindSpeedUnits,
  WeatherPressureUnits,
  HiContrastStyle,
  ClockFormat,
  WeatherPosition,
  GeolocationProvider,
};
