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
import Soup from "gi://Soup";
import Geoclue from "gi://Geoclue";

// Chrome 120.0 on Windows (common user agent)
export const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.3";

let soupSession = null;
let locationInfo = null;
let locationTime = new Date(0);
let locationRefreshInterval = new Date(0).setMinutes(60);
let lastMylocProv = -1;

let fetchingLocation = false;

export const MyLocProv =
{
  GEOCLUE: 0,
  INFOIPIO: 1
}

const DEF_LOC_INFO =
{
  lat: 0.0,
  lon: 0.0,
  city: "Unknown",
  state: "Unknown",
  country: "Unknown",
  countryShort: "Unknown",
  name: "Unknown"
};

function initSoup()
{
  soupSession = new Soup.Session();
  soupSession.user_agent = USER_AGENT;
}

export function freeSoup()
{
  if(soupSession) soupSession.abort();
  soupSession = null;
}

export function getSoupSession()
{
  if(soupSession === null) initSoup();
  return soupSession;
}

export function setLocationRefreshIntervalM(minutes)
{
  locationRefreshInterval = new Date(0).setMinutes(minutes);
}

/**
  * @param {string} countryShort
  * @param {string | null} city
  * @param {string | null} state
  * @returns {string}
  */
function getNameFromCountryShort(countryShort, city, state)
{
  switch(countryShort)
  {
    case "US":
      return `${city}, ${state}`;
    default:
      if(city === "Unknown") return "Unknown";
      else return `${locationInfo.city}, ${locationInfo.country}`;
  }
}

/**
  * @param {MyLocProv} locProv
  * @returns {Promise<object>}
  */
async function httpGetLoc(locProv)
{
  let addr;
  switch(locProv)
  {
    case MyLocProv.INFOIPIO:
      addr = "https://api.infoip.io";
      break;
    default:
      console.error(`OpenWeather Refined: HTTP Get Loc called when it shouldn't have been.`);
      return Promise.reject("Illegal call");
  }

  fetchingLocation = true;
  let sess = getSoupSession();
  let msg = Soup.Message.new("GET", addr);
  return new Promise((resolve, reject) => {
    sess.send_and_read_async(
      msg,
      GLib.PRIORITY_DEFAULT,
      null,
      (s, m) =>
      {
        let response;
        try
        {
          response = s.send_and_read_finish(m);
        }
        catch(e)
        {
          locationInfo = null;
          fetchingLocation = false;
          locationTime = new Date();
          reject(e);
          return;
        }
        if(!response || !(response = response.get_data()))
        {
          locationInfo = null;
          fetchingLocation = false;
          locationTime = new Date();
          reject("OpenWeather Refined: Invalid response");
          return;
        }

        let str = new TextDecoder().decode(response);
        if(!str)
        {
          locationInfo = null;
          fetchingLocation = false;
          locationTime = new Date();
          reject("OpenWeather Refined: No data in JSON My Location HTTP response.");
          return;
        }
        let obj = JSON.parse(str);

        locationTime = new Date();
        locationInfo =
        {
          lat: obj.latitude,
          lon: obj.longitude,
          city: obj.city,
          state: obj.region,
          country: obj.country_long,
          countryShort: obj.country_short,
          name: getNameFromCountryShort(obj.country_short, obj.city, obj.region)
        };

        fetchingLocation = false;
        resolve(locationInfo);
      }
    );
  });
}

export async function geoclueGetLoc(useNominatim = true)
{
  let locInfo = await new Promise((resolve, reject) => {
    fetchingLocation = true;
    Geoclue.Simple.new(
      "gnome-shell-extension-openweatherrefined",
      Geoclue.AccuracyLevel.NEIGHBORHOOD,
      null,
      (_s, result) => {
        let loc;
        try
        {
          let simple = Geoclue.Simple.new_finish(result);
          loc = simple.get_location();
        }
        catch(e)
        {
          fetchingLocation = false;
          locationTime = new Date();
          reject(`OpenWeather Refined: ${e}`);
          return;
        }

        let locI =
        {
          lat: loc.latitude,
          lon: loc.longitude,
          city: "Unknown",
          state: "Unknown",
          country: "Unknown",
          countryShort: "Unknown",
          name: "Unknown"
        };

        resolve(locI);
      }
    );
  });

  if(!useNominatim) return locInfo;

  return await new Promise((resolve, reject) => {
    let sess = Soup.Session.new();
    // Policy mandates specific user agent
    sess.user_agent = "openweather-extension@penguin-teal.github.io";

    let params =
    {
      lat: String(locInfo.lat),
      lon: String(locInfo.lon),
      format: "json",
      // Zoom 13: "Village/suburb"
      zoom: "13"
    };
    let paramsHash = Soup.form_encode_hash(params);
    let msg = Soup.Message.new_from_encoded_form(
      "GET",
      "https://nominatim.openstreetmap.org/reverse",
      paramsHash
    );

    sess.send_and_read_async(
      msg,
      GLib.PRIORITY_DEFAULT,
      null,
      (s, m) =>
      {
        let response;
        try
        {
          response = s.send_and_read_finish(m);
        }
        catch(e)
        {
          locationInfo = locInfo;
          fetchingLocation = false;
          locationTime = new Date();
          reject(e);
          return;
        }
        if(!response || !(response = response.get_data()))
        {
          locationInfo = locInfo;
          fetchingLocation = false;
          locationTime = new Date();
          reject("OpenWeather Refined: Invalid response from Nominatim.");
          return;
        }

        let str = new TextDecoder().decode(response);
        if(!str)
        {
          locationInfo = locInfo;
          fetchingLocation = false;
          locationTime = new Date();
          reject("OpenWeather Refined: No data in JSON Nominatim HTTP response.");
          return;
        }
        let obj = JSON.parse(str);
        let addr = obj.address;

        fetchingLocation = false;
        locationTime = new Date();

        let city = addr?.city ?? "Unknown";
        let state = addr?.state ?? "Unknown";
        let countryShort = addr?.country_code?.toUpperCase() ?? "Unknown";
        locationInfo =
        {
          lat: locInfo.lat,
          lon: locInfo.lon,
          city: city,
          state: state,
          country: addr?.country ?? "Unknown",
          countryShort: countryShort,
          name: getNameFromCountryShort(countryShort, city, state)
        };

        resolve(locationInfo);
      }
    );
  });
}

export async function getLocationInfo(settings, forceRefresh = false)
{
  if(settings === undefined)
  {
    console.error("OpenWeather Refined: getLocationInfo did not receive a settings argument. Pass 'null' to get settings automatically.");
    console.trace("OpenWeather Refined backtrace");
  }

  let now = new Date();
  if(fetchingLocation)
  {
    console.warn("OpenWeather Refined: Location requested while fetching it; returning cached location.");
  }
  else
  {
    let myLocProv = settings ? settings.get_enum("my-loc-prov") : MyLocProv.GEOCLUE;
    if(forceRefresh || now - locationTime > locationRefreshInterval || lastMylocProv !== myLocProv)
    {
      try
      {
        if(myLocProv === MyLocProv.GEOCLUE)
        {
          return await geoclueGetLoc();
        }
        else
        {
          return httpGetLoc(myLocProv);
        }
      }
      catch(e)
      {
        console.error(e);
      }
    }
  }
  return locationInfo ?? DEF_LOC_INFO;
}

export function getCachedLocInfo()
{
  return locationInfo ?? DEF_LOC_INFO;
}

