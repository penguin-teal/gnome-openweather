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

import GLib from "gi://GLib";

import { getLocationInfo, getCachedLocInfo } from "./myloc.js";
import { WeatherProvider } from "./getweather.js";

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
    let error = false;

    if(typeof nameType !== "number")
    {
      error = true;
      console.error(`OpenWeather Refined: NameType (${nameType}) not a number.`);
    }
    this.#nameType = nameType;

    if(typeof name !== "string")
    {
      error = true;
      console.error(`OpenWeather Refined: Name (${name}) not a string.`);
    }
    this.#name = name;

    if(typeof placeType !== "number")
    {
      error = true;
      console.error(`OpenWeather Refined: PlaceType (${placeType}) not a number.`);
    }
    this.#placeType = placeType;

    if(typeof place !== "string")
    {
      error = true;
      console.error(`OpenWeather Refined: Place (${place}) not a string.`);
    }
    this.#place = place;

    if(error) console.trace("OpenWeather Refined: Loc ctor backtrace");
  }

  /**
    * The name of the location to display.
    * @returns {string} The name to display.
    */
  getName(gettext)
  {
    if(gettext === undefined)
    {
      console.error("OpenWeather Refined: Loc#getName did not receive a gettext argument. Pass 'null' for no gettext.");
      console.trace("OpenWeather Refined backtrace");
    }

    switch(this.#nameType)
    {
      case NAME_TYPE.CUSTOM:
        return this.#name;
      case NAME_TYPE.MY_LOC:
        return gettext ? gettext("My Location") : "My Location";
      default:
        console.warn(`OpenWeather Refined: Invalid name type (${this.#nameType}).`);
        return null;
    }
  }

  /**
    * Tests if the name is special (i.e. not user-entered).
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
  async getCoords(settings)
  {
    let info;
    switch(this.#placeType)
    {
      case PLACE_TYPE.COORDS:
        return this.#place.split(",");
      case PLACE_TYPE.MY_LOC:
        try
        {
          info = await getLocationInfo(settings);
          return [ info.lat, info.lon ];
        }
        catch(e)
        {
          console.error(e);
          if(!settings) return [ 0.0, 0.0 ];
          let locs = settingsGetLocs(settings);
          for(let l of locs)
          {
            if(!l.isMyLoc()) return l.getCoords();
          }
          return [ 0.0, 0.0 ];
        }
      default:
        console.warn(`OpenWeather Refined: Invalid place type (${this.#placeType}).`);
        return null;
    }
  }

  /**
    * Does a best chance at getting coords without doing any async calls.
    * @returns {[number, number]} The [ latitude, longitude ].
    */
  getKnownCoordsSync()
  {
    let info;
    switch(this.#placeType)
    {
      case PLACE_TYPE.COORDS:
        return this.#place.split(",");
      case PLACE_TYPE.MY_LOC:
        info = getCachedLocInfo();
        return info ? [ 0, 0 ] : [ info.lat, info.lon ];
      default:
        console.warn(`OpenWeather Refined: Invalid place type (${this.#placeType}).`);
        return null;
    }
  }

  getPlaceDisplay(gettext)
  {
    if(gettext === undefined)
    {
      console.error("OpenWeather Refined: Loc#getPlaceDisplay did not receive a gettext argument. Pass 'null' for no gettext.");
    }

    let coords;
    switch(this.#placeType)
    {
      case PLACE_TYPE.COORDS:
        coords = this.#place.split(",");
        return `${coords[0]}, ${coords[1]}`;
      case PLACE_TYPE.MY_LOC:
        return gettext ? gettext("My Location") : "My Location";
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

  getNameType()
  {
    return this.#nameType;
  }

  getPlaceType()
  {
    return this.#placeType;
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

  static arrsEqual(locArr1, locArr2)
  {
    // If one is null/undefined but the other is not not equal
    if(Boolean(locArr1) !== Boolean(locArr2)) return false;
    // If they compare true they must be equal
    else if(locArr1 === locArr2) return true;
    // If their lengths are different they're definitely not equal
    else if(locArr1.length !== locArr2.length) return false;

    for(let i in locArr1)
    {
      if(!locArr1[i].equals(locArr2[i])) return false;
    }
    return true;
  }

}

function fromLocsGVariant(val)
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
    let name    = tuple.get_child_value(1).get_string()[0];
    let placeTy = tuple.get_child_value(2).get_uint32();
    let place   = tuple.get_child_value(3).get_string()[0];
    arr.push([ nameTy, name, placeTy, place ]);
  }

  return arr;
}

function fromKeysGVariant(val)
{
  val.get_data();
  let keyCount = val.n_children();

  let arr = Array.from({ length: WeatherProvider.COUNT }, () => "");
  for(let i = 0; i < keyCount; i++)
  {
    let k = val.get_child_value(i);
    arr[i] = k.get_string()[0];
  }

  return arr;
}

function getLocsGVariantCount(val)
{
  val.get_data();
  return val.n_children();
}

export function toLocsGVariant(arr)
{
  let tuples = [ ];
  for(let l of arr)
  {
    let locArr = l.toArrayForm();
    let info =
    [
      GLib.Variant.new_uint32(locArr[0]),
      GLib.Variant.new_string(locArr[1]),
      GLib.Variant.new_uint32(locArr[2]),
      GLib.Variant.new_string(locArr[3])
    ];
    tuples.push(GLib.Variant.new_tuple(info));
  }
  
  let gArray = GLib.Variant.new_array(null, tuples);

  return gArray;
}

export function toKeysGVariant(arr)
{
  let strings = [ ];
  for(let s of arr)
  {
    strings.push(GLib.Variant.new_string(s));
  }
  return GLib.Variant.new_array(null, strings);
}

export function settingsGetLocs(settings)
{
  let gvariant = settings.get_value("locs");
  if(!gvariant) return [ ];

  let arr = fromLocsGVariant(gvariant);

  let locs = [ ];
  for(let a of arr)
  {
    locs.push(new Loc(a[0], a[1], a[2], a[3]));
  }

  return locs;
}

export function settingsGetKeys(settings)
{
  return fromKeysGVariant(settings.get_value("custom-keys"));
}

export function settingsGetLocsCount(settings)
{
  let gvariant = settings.get_value("locs");
  return gvariant ? getLocsGVariantCount(gvariant) : 0;
}

export function settingsSetLocs(settings, locs)
{
  if(!locs || !locs.length)
  {
    locs = [ Loc.myLoc() ];
  }
  settings.set_value("locs", toLocsGVariant(locs));
}

export function settingsSetKeys(settings, keys)
{
  if(!keys || !keys.length)
  {
    keys = [ ];
  }
  settings.set_value("custom-keys", toKeysGVariant(keys));
}

