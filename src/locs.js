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
import { notify } from "resource:///org/gnome/shell/ui/main.js";
import {
    gettext as _
} from "resource:///org/gnome/shell/extensions/extension.js";

import { getLocationInfo } from "./myloc.js";

const THIS_SCHEMA_ID   = "org.gnome.shell.extensions.openweatherrefined";
const OICKLE_SCHEMA_ID = "org.gnome.shell.extensions.openweather";

export const NAME_TYPE = {
  CUSTOM: 0,
  MY_LOC: 1
};

export const PLACE_TYPE = {
  COORDS: 0,
  MY_LOC: 1
};

export class Loc
{
  #nameType;
  #name;
  #placeType;
  #place;

  /**
    * Creates a location.
    * @param {number} nameType The {@link NAME_TYPE}.
    * @param {string} name The name string.
    * @param {number} placeType The {@link PLACE_TYPE}.
    * @param {string} place The place string.
    * @see Loc.myLoc @see Loc.fromNameCoords
    */
  constructor(nameType, name, placeType, place)
  {
    this.#nameType = nameType;
    this.#name = name;
    this.#placeType = placeType;
    this.#place = place;
  }

  /**
    * The name of the location to display.
    * @returns {string} The name to display.
    */
  getName()
  {
    switch(this.#nameType)
    {
      case NAME_TYPE.CUSTOM:
        return this.#name;
      case NAME_TYPE.MY_LOC:
        return _("My Location");
      default:
        console.warn(`OpenWeather Refined: Invalid name type (${this.#nameType}).`);
        return null;
    }
  }

  /**
    * Tests if the name is not special (i.e. not user-entered).
    * @returns {boolean} If the name is not a user-specified string.
    */
  isSpecialName()
  {
    return this.#nameType !== NAME_TYPE.CUSTOM;
  }

  /**
    * Gets the coordinates of the location.
    * @returns {Promise<[number, number]>} The [ latitude, longitude ].
    */
  async getCoords()
  {
    let info;
    switch(this.#placeType)
    {
      case PLACE_TYPE.COORDS:
        return this.#place.split(",");
      case PLACE_TYPE.MY_LOC:
        info = await getLocationInfo();
        return [ info.lat, info.lon ];
      default:
        console.warn(`OpenWeather Refined: Invalid place type (${this.#placeType}).`);
        return null;
    }
  }

  /**
    * Gets if this is a "My Location" type.
    * @returns {boolean} If this has a "My Location" place type.
    */
  isMyLoc()
  {
    return this.#placeType === PLACE_TYPE.MY_LOC;
  }

  /**
    * Checks if this and another {@link Loc} are equal.
    * @param {Loc} other The location to compare this to.
    * @returns {boolean} `true` if the two are equal.
    */
  equals(other)
  {
    return this.#nameType === other.#nameType &&
      this.#name === other.#name &&
      this.#placeType === other.#placeType &&
      this.#place === other.#place;
  }

  toArrayForm()
  {
    return [ this.#nameType, this.#name, this.#placeType, this.#place ];
  }

  static myLoc()
  {
    return new Loc(NAME_TYPE.MY_LOC, "", PLACE_TYPE.MY_LOC, "");
  }

  static fromNameCoords(name, lat, lon)
  {
    return new Loc(NAME_TYPE.CUSTOM, name, PLACE_TYPE.COORDS, `${lat},${lon}`);
  }

}

function locsToJs(val)
{
  val.get_data();
  let locCount = val.n_children();

  let arr = [ ];

  for(let i = 0; i < locCount; i++)
  {
    let tuple = val.get_child_value(i);
    tuple.get_data();

    let tupleCount = tuple.n_children();
    if(tupleCount !== 4)
    {
      console.error(`OpenWeather Refined: 'locs' tuple of count ${tupleCount}, not 4.`);
      return [ ];
    }

    let nameTy  = tuple.get_child_value(0).get_uint32();
    let name    = tuple.get_child_value(1).get_string();
    let placeTy = tuple.get_child_value(2).get_uint32();
    let place   = tuple.get_child_value(3).get_string();
    arr.push([ nameTy, name, placeTy, place ]);
  }

  return arr;
}

function jsToLocs(arr)
{
  // TODO: Convert 2-D array to GVariant array and tuples
}

export function settingsGetLocs(settings)
{
  let gvariant = settings.get_value("locs");
  if(!gvariant) return [ ];

  let arr = locsToJs(gvariant);

  let locs = [ ];
  for(let a of arr)
  {
    locs.push(new Loc(a[0], a[1], a[2], a[3]));
  }

  return locs;
}

export function settingsSetLocs(settings, locs)
{
  let arr = [ ];
  for(let l of locs)
  {
    arr.push(l.toArrayForm());
  }
  
  settings.set_value(arr);
}

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

  notify("OpenWeather Refined", _("Imported settings from original extension."));
  console.log("OpenWeather Refined: Imported settings from original extension.");
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
    let name  = l.split(">")[1];
    let isMyLoc = place === "here";
    let isMyLocName = isMyLoc && !name;
    arr.push([isMyLocName ? 1 : 0, name, isMyLoc, isMyLoc ? "" : place]);
  }

  settings.reset("city");
  settings.set_value("locs", arr);

  console.log("OpenWeather Refined: Migrated from cities to v128 locs.");
  return true;
}

/**
  * Migrates settings if needed.
  * Imports from original OpenWeather extension.
  * Migrates 'cities' (127-) -> 'locs' (v128+).
  * @param {Gio.Settings} Settings to read/modify.
  * @returns {boolean} `true` if settings were IMPORTED (NOT just if migrated).
  */
export function tryMigrate(settings)
{
  let imported = tryMigrateOickle(settings);
  tryMigratePre128(settings);
  return imported;
}

