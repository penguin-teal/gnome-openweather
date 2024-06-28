/*
   This file is part of OpenWeather Refined (gnome-shell-extension-openweatherrefined).

   OpenWeather Refined is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by the
   Free Software Foundation, either version 3 of the License, or (at your
   option) any later version.

   OpenWeather Refined is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
   See the GNU General Public License for more details.

   You should have received a copy of the GNU General Public License along with
   OpenWeather Refined. If not, see <https://www.gnu.org/licenses/>.

   Copyright 2024 TealPenguin
*/

import Gio from "gi://Gio";

import { GeolocationProvider, WeatherPressureUnits } from "./constants.js";
import { Loc, NAME_TYPE, PLACE_TYPE, settingsSetLocs, settingsGetLocsCount, settingsSetKeys } from "./locs.js";
import { WeatherProvider } from "./getweather.js";

const THIS_SCHEMA_ID   = "org.gnome.shell.extensions.openweatherrefined";
const OICKLE_SCHEMA_ID = "org.gnome.shell.extensions.openweather";

function tryMigrateOickle(settings)
{
  let keys = settings.list_keys();
  if(!keys || !keys.length) return false;

  let schemaSrc = Gio.SettingsSchemaSource.get_default();
  let oldSchema = schemaSrc.lookup(OICKLE_SCHEMA_ID, true);
  if(!oldSchema) return false;

  let oldSettings = Gio.Settings.new(oldSchema.get_id());
  let oldKs = oldSettings.list_keys();
  if(!oldKs || !oldKs.length) return false;

  let schema = schemaSrc.lookup(THIS_SCHEMA_ID, true);
  for(let k of oldKs)
  {
    if(!schema.has_key(k) && k !== "city") continue;

    settings.set_value(k.get_value());
  }

  console.log("OpenWeather Refined: Imported settings from old extension.");
  return true;
}

function tryMigratePre128(settings)
{
  let city = settings.get_string("city");
  if(!city) return false;

  let arr = [ ];
  let sections = city.split(" && ");
  for(let l of sections)
  {
    let place = l.split(">")[0];
    place = place.replace(/\s/g, "");
    let name  = l.split(">")[1];
    let isMyLoc = place === "here";
    let isMyLocName = isMyLoc && !name;
    arr.push(
      new Loc(
        isMyLocName ? NAME_TYPE.MY_LOC : NAME_TYPE.CUSTOM,
        name,
        isMyLoc ? PLACE_TYPE.MY_LOC : PLACE_TYPE.COORDS,
        isMyLoc ? "" : place
      )
    );
  }

  settings.reset("city");
  settingsSetLocs(settings, arr);

  console.log("OpenWeather Refined: Migrated from cities to v128 locs.");
  return true;
}

function tryMigratePre130(settings)
{
  if(settings.get_enum("pressure-unit") === WeatherPressureUnits.HPA)
  {
    settings.set_enum("pressure-unit", WeatherPressureUnits.MBAR);
  }

  let locCount = settingsGetLocsCount(settings);
  let selIndex = settings.get_int("actual-city");
  if(selIndex < 0 || selIndex > locCount)
  {
    settings.set_int("actual-city", selIndex < 0 ? 0 : locCount - 1);
  }

}

function tryMigratePre136(settings)
{
  // Create an array of empty strings with the length of weather
  // providers available
  let keys = Array.from({ length: WeatherProvider.COUNT }, () => "");

  let owmKey = settings.get_string("appid");
  if(!settings.get_boolean("use-default-owm-key"))
  {
    keys[0] = owmKey;
    settings.reset("appid");
    settings.reset("use-default-owm-key");
  }
  let weatherApiKey = settings.get_string("weatherapidotcom-key");
  if(!settings.get_boolean("use-default-weatherapidotcom-key"))
  {
    keys[1] = weatherApiKey;
    settings.reset("weatherapidotcom-key");
    settings.reset("use-default-weatherapidotcom-key");
  }

  if(keys[0] !== "" || keys[1] !== "") settingsSetKeys(keys);
}

function migrateProviders(settings)
{
  let geoSearch = settings.get_enum("geolocation-provider");
  if(geoSearch === GeolocationProvider.GEOCODE) settings.set_enum("geolocation-provider", GeolocationProvider.OPENSTREETMAPS);
}

/**
  * Migrates settings if needed.
  * Imports from original OpenWeather extension.
  * Migrates 'cities' (127-) -> 'locs' (v128+).
  * Migrates 'pressure-unit' (130+).
  * Migrates custom keys (136+).
  * @param {Gio.Settings} Settings to read/modify.
  * @returns {boolean} `true` if settings were IMPORTED (NOT just if migrated).
  */
export function tryImportAndMigrate(settings)
{
  let imported = tryMigrateOickle(settings);
  tryMigrateFromOldVersion(settings);
  return imported;
}

export function tryMigrateFromOldVersion(settings)
{
  tryMigratePre128(settings);
  tryMigratePre130(settings);
  tryMigratePre136(settings);
  migrateProviders(settings);
}
