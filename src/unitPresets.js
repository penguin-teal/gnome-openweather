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

import { WeatherUnits, WeatherPressureUnits, WeatherWindSpeedUnits } from "./constants.js";

export class UnitSet
{
  #temp;
  #press;
  #speed;

  /**
    * @param {number} temp Temperature unit from `WeatherUnits`
    * @param {number} press Pressure unit from `WeatherPressureUnits`
    * @param {number} speed Speed unit from `WeatherWindSpeedUnits`
    *
    */
  constructor(temp, press, speed)
  {
    this.#temp = temp;
    this.#press = press;
    this.#speed = speed;
  }

  /** @returns {number} Temperature unit */
  get temp() { return this.#temp; }
  /** @returns {number} Pressure unit */
  get press() { return this.#press; }
  /** @returns {number} Speed unit */
  get speed() { return this.#speed; }

  /**
    * @param {UnitSet} other
    * @returns {boolean}
    */
  equals(other)
  {
    return other && this.temp === other.temp && this.press === other.press &&
      this.speed === other.speed;
  }
}

export const UnitPresets = {
  US: new UnitSet(WeatherUnits.FAHRENHEIT, WeatherPressureUnits.INHG, WeatherWindSpeedUnits.MPH),
  UK: new UnitSet(WeatherUnits.CELSIUS, WeatherPressureUnits.MBAR, WeatherWindSpeedUnits.MPH),
  METRIC: new UnitSet(WeatherUnits.CELSIUS, WeatherPressureUnits.MBAR, WeatherWindSpeedUnits.KPH),
};

/**
  * @param {UnitSet} unitSet
  * @returns {(string|null)}
  */
export function unitSetMatchesPreset(unitSet)
{
  let keys = Object.keys(UnitPresets);
  for(let i = 0; i < keys.length; i++)
  {
    if(UnitPresets[keys[i]].equals(unitSet)) return keys[i];
  }
  return null;
}

export function getUnitSetFromSettings(settings)
{
  return new UnitSet(settings.get_enum("unit"),
    settings.get_enum("pressure-unit"), settings.get_enum("wind-speed-unit"));
}

export function setUnitSetFromSettings(settings, unitSet)
{
  settings.set_enum("unit", unitSet.temp);
  settings.set_enum("pressure-unit", unitSet.press);
  settings.set_enum("wind-speed-unit", unitSet.speed);
}

