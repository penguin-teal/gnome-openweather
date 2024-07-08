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

/**
  * This function doesn't actually do anything and returns the input.
  * `xgettext` will pass this into the `--keyword` option which will make it
  * appear in the translations `.pot` file.
  * Essentially if you need text to be translated at some point but are not
  * yet putting it through `gettext` put it in here.
  *
  * @param {string} x
  * @returns {string} The input x.
  */
function XGT(x)
{
    return x;
}

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
  200: XGT("Thunderstorm with Light Rain"), // Thunderstorm with light rain
  201: XGT("Thunderstorm with Rain"), // Thunderstorm with rain
  202: XGT("Thunderstorm with Heavy Rain"), // Thunderstorm with heavy rain
  210: XGT("Light Thunderstorm"),
  211: XGT("Heavy Thunderstorm"),
  212: XGT("Ragged Thunderstorm"),
  230: XGT("Thunderstorm with Light Drizzle"), // Thunderstorm with light drizzle
  231: XGT("Thunderstorm with Drizzle"), // Thunderstorm with drizzle
  232: XGT("Thunderstorm with Heavy Drizzle"), // Thunderstorm with heavy drizzle
  300: XGT("Light Drizzle"),
  301: XGT("Drizzle"),
  302: XGT("Heavy Drizzle"),
  310: XGT("Light Drizzle Rain"),
  311: XGT("Drizzle Rain"),
  312: XGT("Heavy Drizzle Rain"),
  313: XGT("Shower Rain and Drizzle"),
  314: XGT("Heavy Rain and Drizzle"),
  321: XGT("Shower Drizzle"),
  500: XGT("Light Rain"),
  501: XGT("Moderate Rain"),
  502: XGT("Heavy Rain"),
  503: XGT("Very Heavy Rain"),
  504: XGT("Extreme Rain"),
  511: XGT("Freezing Rain"),
  520: XGT("Light Shower Rain"),
  521: XGT("Shower Rain"),
  522: XGT("Heavy Shower Rain"),
  531: XGT("Ragged Shower Rain"),
  600: XGT("Light Snow"),
  601: XGT("Snow"),
  602: XGT("Heavy Snow"),
  611: XGT("Sleet"),
  612: XGT("Light Shower Sleet"),
  613: XGT("Shower Sleet"),
  615: XGT("Light Rain and Snow"),
  616: XGT("Rain and Snow"),
  620: XGT("Light Shower Snow"),
  621: XGT("Shower Snow"),
  622: XGT("Heavy Shower Snow"),
  701: XGT("Mist"),
  711: XGT("Smoke"),
  721: XGT("Haze"),
  731: XGT("Sand/Dust Whirls"),
  741: XGT("Fog"),
  751: XGT("Sand"),
  761: XGT("Dust"),
  762: XGT("Volcanic Ash"),
  771: XGT("Squalls"),
  781: XGT("Tornado"),
  800: XGT("Clear Sky"),
  801: XGT("Few Clouds"),
  802: XGT("Scattered Clouds"),
  803: XGT("Broken Clouds"),
  804: XGT("Overcast Clouds")
};

/**
  * @enum {string}
  */
const WeatherApiComConditionMap =
{
  1000: XGT("Clear"),
  1003: XGT( "Partly Cloudy"),
  1006: XGT( "Cloudy"),
  1009: XGT( "Overcast"),
  1030: XGT( "Mist"),
  1063: XGT( "Patchy Rain Possible"),
  1066: XGT( "Patchy Snow Possible"),
  1069: XGT( "Patchy Sleet Possible"),
  1072: XGT( "Patchy Freezing Drizzle Possible"),
  1087: XGT( "Thundery Outbreaks Possible"),
  1114: XGT( "Blowing Snow"),
  1117: XGT( "Blizzard"),
  1135: XGT( "Fog"),
  1147: XGT( "Freezing Fog"),
  1150: XGT( "Patchy Light Drizzle"),
  1153: XGT( "Light Drizzle"),
  1168: XGT( "Freezing Drizzle"),
  1171: XGT( "Heavy Freezing Drizzle"),
  1180: XGT( "Patchy Light Rain"),
  1183: XGT( "Light Rain"),
  1186: XGT( "Moderate Rain At Times"),
  1189: XGT( "Moderate Rain"),
  1192: XGT( "Heavy Rain At Times"),
  1195: XGT( "Heavy Rain"),
  1198: XGT( "Light Freezing Rain"),
  1201: XGT( "Heavy Freezing Rain"), // Moderate or heavy freezing rain
  1204: XGT( "Light Sleet"),
  1207: XGT( "Moderate Or Heavy Sleet"),
  1210: XGT( "Patchy Light Snow"),
  1213: XGT( "Light Snow"),
  1216: XGT( "Patchy Moderate Snow"),
  1219: XGT( "Moderate Snow"),
  1222: XGT( "Patchy Heavy Snow"),
  1225: XGT( "Heavy Snow"),
  1237: XGT( "Hail"), // Ice pellets
  1240: XGT( "Light Shower"), // Light Rain Shower
  1243: XGT( "Heavy Shower"), // Moderate or heavy rain shower
  1246: XGT( "Torrential Rain Shower"),
  1249: XGT( "Light Sleet Showers"),
  1252: XGT( "Heavy Sleet Showers"), // Moderate or Heavy Sleet Showers
  1255: XGT( "Light Snow Showers"),
  1258: XGT( "Heavy Snow Showers"), // Moderate or heavy snow showers
  1261: XGT( "Light Hail"), // Light showers of ice pellets
  1264: XGT( "Heavy Hail"), // Moderate Or Heavy Showers Of Ice Pellets
  1273: XGT( "Patchy Light Rain With Thunder"),
  1276: XGT( "Heavy Rain with Thunder"), // Moderate or heavy rain with thunder
  1279: XGT( "Patchy Light Snow with Thunder"),
  1282: XGT("Heavy Snow with Thunder") // Moderate or heavy snow with thunder
};

/**
  * @enum {string}
  */
const VisualCrossingConditionMap =
{
  "clear": XGT("Clear"), // Clear conditions throughout the day
  "clearingpm": XGT("Clear Afternoon"), // Clearing in the afternoon
  "cloudcover": XGT("Cloud Cover"), // Cloud cover
  "cloudierpm": XGT("Coudy Afternoon"), // Becoming cloudy in the afternoon
  "coolingdown": XGT("Cooling Down"), // Cooling down
  "overcast": XGT("Overcast"), // Cloudy skies throughout the day
  "precip": XGT("Precipitation"), // Precipitation
  "precipcover": XGT("Precipitation Cover"), // Precipitation cover
  "rainallday": XGT("Rain All Day"), // A chance of rain throughout the day
  "rainam": XGT("Morning Rain"), // Morning rain
  "rainampm": XGT("Rain"), // Rain in the morning and afternoon
  "rainchance": XGT("Chance of Rain"), // A chance of rain
  "rainclearinglater": XGT("Rain Clearing Later"), // Rain clearing later
  "raindays": XGT("Chance of Rain"), // A chance of rain
  "raindefinite": XGT("Rain"), // Rain
  "rainearlyam": XGT("Early Morning Rain"), // Early morning rain
  "rainlatepm": XGT("Late Afternoon Rain"), // Late afternoon rain
  "rainpm": XGT("Afternoon Rain"), // Afternoon rain
  "type_1": XGT("Drifting Snow"), // Blowing or drifting snow
  "type_2": XGT("Drizzle"), // Drizzle
  "type_3": XGT("Heavy Drizzle"), // Heavy Drizzle
  "type_4": XGT("Light Drizzle"), // Light Drizzle
  "type_5": XGT("Heavy Rain"), // Heavy Drizzle/Rain
  "type_6": XGT("Light Rain"), // Light Drizzle/Rain
  "type_7": XGT("Dust Storm"), // Dust storm
  "type_8": XGT("Fog"), // Fog
  "type_9": XGT("Freezing Drizzle"), // Freezing Drizzle/Freezing Rain
  "type_10": XGT("Heavy Freezing Drizzle"), // Heavy Freezing Drizzle/Freezing Rain
  "type_11": XGT("Light Freezing Drizzle"), // Light Freezing Drizzle/Freezing Rain
  "type_12": XGT("Freezing Fog"), // Freezing Fog
  "type_13": XGT("Heavy Freezing Rain"), // Heavy Freezing Rain
  "type_14": XGT("Light Freezing Rain"), // Light Freezing Rain
  "type_15": XGT("Tornado"), // Funnel Cloud/Tornado
  "type_16": XGT("Hail Showers"), // Hail Showers
  "type_17": XGT("Ice"), // Ice
  "type_18": XGT("Lightning"), // Lightning Without Thunder
  "type_19": XGT("Mist"), // Mist
  "type_20": XGT("Precipitation"), // Precipitation In Vicinity
  "type_21": XGT("Rain"), // Rain
  "type_22": XGT("Heavy Rain & Snow"), // Heavy Rain And Snow
  "type_23": XGT("Light Rain & Snow"), // Light Rain And Snow
  "type_24": XGT("Rain Showers"), // Rain Showers
  "type_25": XGT("Heavy Rain"), // Heavy Rain
  "type_26": XGT("Light Rain"), // Light Rain
  "type_27": XGT("Sky Coverage Decreasing"), // Sky Coverage Decreasing
  "type_28": XGT("Sky Coverage Increasing"), // Sky Coverage Increasing
  "type_29": XGT("Sky Unchanged"), // Sky Unchanged
  "type_30": XGT("Haze"), // Smoke Or Haze
  "type_31": XGT("Snow"), // Snow
  "type_32": XGT("Snow & Rain Showers"), // Snow And Rain Showers
  "type_33": XGT("Snow Showers"), // Snow Showers
  "type_34": XGT("Heavy Snow"), // Heavy Snow
  "type_35": XGT("Light Snow"), // Light Snow
  "type_36": XGT("Squalls"), // Squalls
  "type_37": XGT("Thunderstorm"), // Thunderstorm
  "type_38": XGT("Storm No Rain"), // Thunderstorm Without Precipitation
  "type_39": XGT("Ice Crystals"), // Diamond Dust
  "type_40": XGT("Hail"), // Hail
  "type_41": XGT("Overcast"), // Overcast
  "type_42": XGT("Partially Cloudy"), // Partially cloudy
  "type_43": XGT("Clear") // Clear
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


