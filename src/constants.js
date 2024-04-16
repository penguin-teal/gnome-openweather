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
  BLACK: 2
};

const ClockFormat = {
  _24H: 0,
  _12H: 1,
  SYSTEM: 2
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
  WeatherUnits,
  WeatherWindSpeedUnits,
  WeatherPressureUnits,
  HiContrastStyle,
  ClockFormat,
  WeatherPosition,
  GeolocationProvider,
};
