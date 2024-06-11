/*
  Copyright 2024 Teal Penguin

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

  import { WeatherProvider } from "./getweather.js"

/**
  * More icons than there currently are available because they follow
  * the Breeze icon set, which I can't get working right now, so everything
  * is mapped to available Adwaita icons.
  * @enum {string}
  */
const WeatherIcons =
{
  CLEAR: "clear",
  CLOUDS: "few-clouds",
  FEW_CLOUDS: "few-clouds",
  FOG: "fog",
  FREEZING_RAIN: "freezing-rain",
  FREEZING_SCATTERED_RAIN: "freezing-rain",
  FREEZING_SCATTERED_RAIN_STORM: "freezing-rain",
  FREEZING_STORM: "freezing-storm",
  HAIL: "snow",
  MANY_CLOUDS: "overcast",
  MIST: "fog",
  OVERCAST: "overcast",
  SHOWERS: "showers",
  SHOWERS_SCATTERED: "showers-scattered",
  SHOWERS_SCATTERED_STORM: "storm",
  SNOW: "snow",
  SNOW_RAIN: "snow",
  SNOW_SCATTERED: "snow",
  SNOW_SCATTERED_STORM: "snow",
  SNOW_STORM: "snow",
  STORM: "storm",
  WINDY: "windy",
  TORNADO: "tornado"
};

// Map OpenWeatherMap icon codes to icon names
/**
  * @enum {string}
  */
const OpenWeatherMapIconMap =
{
  "01d": WeatherIcons.CLEAR, // "clear sky"
  "02d": WeatherIcons.FEW_CLOUDS, // "few clouds"
  "03d": WeatherIcons.FEW_CLOUDS, // "scattered clouds"
  "04d": WeatherIcons.CLOUDS, // "broken clouds"
  "09d": WeatherIcons.SHOWERS_SCATTERED, // "shower rain"
  "10d": WeatherIcons.SHOWERS, // "rain"
  "11d": WeatherIcons.STORM, // "thunderstorm"
  "13d": WeatherIcons.SNOW, // "snow"
  "50d": WeatherIcons.MIST, // "mist"
  "01n": WeatherIcons.CLEAR, // "clear sky night"
  "02n": WeatherIcons.FEW_CLOUDS, // "few clouds night"
  "03n": WeatherIcons.FEW_CLOUDS, // "scattered clouds night"
  "04n": WeatherIcons.CLOUDS, // "broken clouds night"
  "09n": WeatherIcons.SHOWERS_SCATTERED, // "shower rain night"
  "10n": WeatherIcons.SHOWERS, // "rain night"
  "11n": WeatherIcons.STORM, // "thunderstorm night"
  "13n": WeatherIcons.SNOW, // "snow night"
  "50n": WeatherIcons.MIST, // "mist night"
};

/**
  * @enum {string}
  */
const WeatherApiComIconMap =
{
  1000: WeatherIcons.CLEAR, // "Sunny" / "Clear"
  1003: WeatherIcons.FEW_CLOUDS, // "Partly cloudy"
  1006: WeatherIcons.CLOUDS, // "Cloudy"
  1009: WeatherIcons.OVERCAST, // "Overcast"
  1030: WeatherIcons.MIST, // "Mist"
  1063: WeatherIcons.SHOWERS_SCATTERED, // "Patchy rain possible"
  1066: WeatherIcons.SNOW, // "Patchy snow possible"
  1069: WeatherIcons.SNOW_RAIN, // "Patchy sleet possible"
  1072: WeatherIcons.FREEZING_SCATTERED_RAIN, // "Patchy freezing drizzle possible"
  1087: WeatherIcons.STORM, // "Thundery outbreaks possible"
  1114: WeatherIcons.SNOW_SCATTERED, // "Blowing snow"
  1117: WeatherIcons.SNOW_STORM, // "Blizzard"
  1135: WeatherIcons.FOG, // "Fog"
  1147: WeatherIcons.FOG, // "Freezing fog"
  1150: WeatherIcons.SHOWERS_SCATTERED, // "Patchy light drizzle"
  1153: WeatherIcons.SHOWERS_SCATTERED, // "Light drizzle"
  1168: WeatherIcons.FREEZING_RAIN, // "Freezing drizzle"
  1171: WeatherIcons.FREEZING_RAIN, // "Heavy freezing drizzle"
  1180: WeatherIcons.SHOWERS_SCATTERED, // "Patchy light rain"
  1183: WeatherIcons.SHOWERS_SCATTERED, // "Light rain"
  1186: WeatherIcons.SHOWERS, // "Moderate rain at times"
  1189: WeatherIcons.SHOWERS, // "Moderate rain"
  1192: WeatherIcons.SHOWERS, // "Heavy rain at times"
  1195: WeatherIcons.SHOWERS, // "Heavy rain"
  1198: WeatherIcons.FREEZING_SCATTERED_RAIN, // "Light freezing rain"
  1201: WeatherIcons.FREEZING_RAIN, // "Moderate or heavy freezing rain"
  1204: WeatherIcons.SNOW_RAIN, // "Light sleet"
  1207: WeatherIcons.SNOW_RAIN, // "Moderate or heavy sleet"
  1210: WeatherIcons.SNOW_SCATTERED, // "Patchy light snow"
  1213: WeatherIcons.SNOW_SCATTERED, // "Light snow"
  1216: WeatherIcons.SNOW, // "Patchy moderate snow"
  1219: WeatherIcons.SNOW, // "Moderate snow"
  1222: WeatherIcons.SNOW, // "Patchy heavy snow"
  1225: WeatherIcons.SNOW, // "Heavy snow"
  1237: WeatherIcons.HAIL, // "Ice pellets"
  1240: WeatherIcons.SHOWERS_SCATTERED, // "Light rain shower"
  1243: WeatherIcons.SHOWERS, // "Moderate or heavy rain shower"
  1246: WeatherIcons.SHOWERS, // "Torrential rain shower"
  1249: WeatherIcons.SNOW_RAIN, // "Light sleet showers"
  1252: WeatherIcons.SNOW_RAIN, // "Moderate or heavy sleet showers"
  1255: WeatherIcons.SNOW_SCATTERED, // "Light snow showers"
  1258: WeatherIcons.SNOW, // "Moderate or heavy snow showers"
  1261: WeatherIcons.HAIL, // "Light showers of ice pellets"
  1264: WeatherIcons.HAIL, // "Moderate or heavy showers of ice pellets"
  1273: WeatherIcons.STORM, // "Patchy light rain with thunder"
  1276: WeatherIcons.STORM, // "Moderate or heavy rain with thunder"
  1279: WeatherIcons.SNOW_SCATTERED_STORM, // "Patchy light snow with thunder"
  1282: WeatherIcons.SNOW_STORM, // "Moderate or heavy snow with thunder"
};

/**
  * @enum {string}
  */
const VisualCrossingIconMap =
{
  "snow": WeatherIcons.SNOW,
  "rain": WeatherIcons.SHOWERS,
  "fog": WeatherIcons.FOG,
  "wind": WeatherIcons.WINDY,
  "cloudy": WeatherIcons.CLOUDS,
  "partly-cloudy-day": WeatherIcons.FEW_CLOUDS,
  "partly-cloudy-night": WeatherIcons.FEW_CLOUDS,
  "clear-day": WeatherIcons.CLEAR,
  "clear-night": WeatherIcons.CLEAR
};

function hasNightVariant(name)
{
  return name === "clear" || name === "few-clouds";
}

/**
  * @param {boolean} isNight
  * @param {boolean} useSymbolic
  */
export function getIconName(provider, key, isNight, useSymbolic)
{
  let name;
  switch(provider)
  {
    case WeatherProvider.OPENWEATHERMAP:
      name = OpenWeatherMapIconMap[key];
      break;
    case WeatherProvider.WEATHERAPICOM:
      name = WeatherApiComIconMap[key];
      break;
    case WeatherProvider.VISUALCROSSING:
      name = VisualCrossingIconMap[key];
      break;
  }

  let fullName = "weather-" + name;

  if(isNight && hasNightVariant(name)) fullName += "-night";

  // Ignore useSymbolic for now because we only package symbolic icons
  fullName += "-symbolic";

  return fullName;
}

/**
  * @enum {string}
  */
const OpenWeatherMapConditionMap =
{
  200: "Thunderstorm with Light Rain", // Thunderstorm with light rain
  201: "Thunderstorm with Rain", // Thunderstorm with rain
  202: "Thunderstorm with Heavy Rain", // Thunderstorm with heavy rain
  210: "Light Thunderstorm",
  211: "Heavy Thunderstorm",
  212: "Ragged Thunderstorm",
  230: "Thunderstorm with Light Drizzle", // Thunderstorm with light drizzle
  231: "Thunderstorm with Drizzle", // Thunderstorm with drizzle
  232: "Thunderstorm with Heavy Drizzle", // Thunderstorm with heavy drizzle
  300: "Light Drizzle",
  301: "Drizzle",
  302: "Heavy Drizzle",
  310: "Light Drizzle Rain",
  311: "Drizzle Rain",
  312: "Heavy Drizzle Rain",
  313: "Shower Rain and Drizzle",
  314: "Heavy Rain and Drizzle",
  321: "Shower Drizzle",
  500: "Light Rain",
  501: "Moderate Rain",
  502: "Heavy Rain",
  503: "Very Heavy Rain",
  504: "Extreme Rain",
  511: "Freezing Rain",
  520: "Light Shower Rain",
  521: "Shower Rain",
  522: "Heavy Shower Rain",
  531: "Ragged Shower Rain",
  600: "Light Snow",
  601: "Snow",
  602: "Heavy Snow",
  611: "Sleet",
  612: "Light Shower Sleet",
  613: "Shower Sleet",
  615: "Light Rain and Snow",
  616: "Rain and Snow",
  620: "Light Shower Snow",
  621: "Shower Snow",
  622: "Heavy Shower Snow",
  701: "Mist",
  711: "Smoke",
  721: "Haze",
  731: "Sand/Dust Whirls",
  741: "Fog",
  751: "Sand",
  761: "Dust",
  762: "Volcanic Ash",
  771: "Squalls",
  781: "Tornado",
  800: "Clear Sky",
  801: "Few Clouds",
  802: "Scattered Clouds",
  803: "Broken Clouds",
  804: "Overcast Clouds"
};

/**
  * @enum {string}
  */
const WeatherApiComConditionMap =
{
  1000: "Clear",
  1003: "Partly Cloudy",
  1006: "Cloudy",
  1009: "Overcast",
  1030: "Mist",
  1063: "Patchy Rain Possible",
  1066: "Patchy Snow Possible",
  1069: "Patchy Sleet Possible",
  1072: "Patchy Freezing Drizzle Possible",
  1087: "Thundery Outbreaks Possible",
  1114: "Blowing Snow",
  1117: "Blizzard",
  1135: "Fog",
  1147: "Freezing Fog",
  1150: "Patchy Light Drizzle",
  1153: "Light Drizzle",
  1168: "Freezing Drizzle",
  1171: "Heavy Freezing Drizzle",
  1180: "Patchy Light Rain",
  1183: "Light Rain",
  1186: "Moderate Rain At Times",
  1189: "Moderate Rain",
  1192: "Heavy Rain At Times",
  1195: "Heavy Rain",
  1198: "Light Freezing Rain",
  1201: "Heavy Freezing Rain", // Moderate or heavy freezing rain
  1204: "Light Sleet",
  1207: "Moderate Or Heavy Sleet",
  1210: "Patchy Light Snow",
  1213: "Light Snow",
  1216: "Patchy Moderate Snow",
  1219: "Moderate Snow",
  1222: "Patchy Heavy Snow",
  1225: "Heavy Snow",
  1237: "Hail", // Ice pellets
  1240: "Light Shower", // Light Rain Shower
  1243: "Heavy Shower", // Moderate or heavy rain shower
  1246: "Torrential Rain Shower",
  1249: "Light Sleet Showers",
  1252: "Heavy Sleet Showers", // Moderate or Heavy Sleet Showers
  1255: "Light Snow Showers",
  1258: "Heavy Snow Showers", // Moderate or heavy snow showers
  1261: "Light Hail", // Light showers of ice pellets
  1264: "Heavy Hail", // Moderate Or Heavy Showers Of Ice Pellets
  1273: "Patchy Light Rain With Thunder",
  1276: "Heavy Rain with Thunder", // Moderate or heavy rain with thunder
  1279: "Patchy Light Snow with Thunder",
  1282: "Heavy Snow with Thunder" // Moderate or heavy snow with thunder
};

/**
  * @enum {string}
  */
const VisualCrossingConditionMap =
{
  "clear": "Clear", // Clear conditions throughout the day
  "clearingpm": "Clear Afternoon", // Clearing in the afternoon
  "cloudcover": "Cloud Cover", // Cloud cover
  "cloudierpm": "Coudy Afternoon", // Becoming cloudy in the afternoon
  "coolingdown": "Cooling Down", // Cooling down
  "overcast": "Overcast", // Cloudy skies throughout the day
  "precip": "Precipitation", // Precipitation
  "precipcover": "Precipitation Cover", // Precipitation cover
  "rainallday": "Rain All Day", // A chance of rain throughout the day
  "rainam": "Morning Rain", // Morning rain
  "rainampm": "Rain", // Rain in the morning and afternoon
  "rainchance": "Chance of Rain", // A chance of rain
  "rainclearinglater": "Rain Clearing Later", // Rain clearing later
  "raindays": "Chance of Rain", // A chance of rain
  "raindefinite": "Rain", // Rain
  "rainearlyam": "Early Morning Rain", // Early morning rain
  "rainlatepm": "Late Afternoon Rain", // Late afternoon rain
  "rainpm": "Afternoon Rain", // Afternoon rain
  "type_1": "Drifting Snow", // Blowing or drifting snow
  "type_2": "Drizzle", // Drizzle
  "type_3": "Heavy Drizzle", // Heavy Drizzle
  "type_4": "Light Drizzle", // Light Drizzle
  "type_5": "Heavy Rain", // Heavy Drizzle/Rain
  "type_6": "Light Rain", // Light Drizzle/Rain
  "type_7": "Dust Storm", // Dust storm
  "type_8": "Fog", // Fog
  "type_9": "Freezing Drizzle", // Freezing Drizzle/Freezing Rain
  "type_10": "Heavy Freezing Drizzle", // Heavy Freezing Drizzle/Freezing Rain
  "type_11": "Light Freezing Drizzle", // Light Freezing Drizzle/Freezing Rain
  "type_12": "Freezing Fog", // Freezing Fog
  "type_13": "Heavy Freezing Rain", // Heavy Freezing Rain
  "type_14": "Light Freezing Rain", // Light Freezing Rain
  "type_15": "Tornado", // Funnel Cloud/Tornado
  "type_16": "Hail Showers", // Hail Showers
  "type_17": "Ice", // Ice
  "type_18": "Lightning", // Lightning Without Thunder
  "type_19": "Mist", // Mist
  "type_20": "Precipitation", // Precipitation In Vicinity
  "type_21": "Rain", // Rain
  "type_22": "Heavy Rain & Snow", // Heavy Rain And Snow
  "type_23": "Light Rain & Snow", // Light Rain And Snow
  "type_24": "Rain Showers", // Rain Showers
  "type_25": "Heavy Rain", // Heavy Rain
  "type_26": "Light Rain", // Light Rain
  "type_27": "Sky Coverage Decreasing", // Sky Coverage Decreasing
  "type_28": "Sky Coverage Increasing", // Sky Coverage Increasing
  "type_29": "Sky Unchanged", // Sky Unchanged
  "type_30": "Haze", // Smoke Or Haze
  "type_31": "Snow", // Snow
  "type_32": "Snow & Rain Showers", // Snow And Rain Showers
  "type_33": "Snow Showers", // Snow Showers
  "type_34": "Heavy Snow", // Heavy Snow
  "type_35": "Light Snow", // Light Snow
  "type_36": "Squalls", // Squalls
  "type_37": "Thunderstorm", // Thunderstorm
  "type_38": "Storm No Rain", // Thunderstorm Without Precipitation
  "type_39": "Ice Crystals", // Diamond Dust
  "type_40": "Hail", // Hail
  "type_41": "Overcast", // Overcast
  "type_42": "Partially Cloudy", // Partially cloudy
  "type_43": "Clear" // Clear
};

/**
  * @returns {string}
  */
export function gettextCondition(provider, code, gettext)
{
  switch(provider)
  {
    case WeatherProvider.OPENWEATHERMAP:
      return gettext(OpenWeatherMapConditionMap[code] ?? "Not available");
    case WeatherProvider.WEATHERAPICOM:
      return gettext(WeatherApiComConditionMap[code] ?? "Not available");
    case WeatherProvider.VISUALCROSSING:
      return gettext(VisualCrossingConditionMap[code] ?? "Not available");
    default:
      return gettext("Not available");
  }
}


