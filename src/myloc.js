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
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
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
  IPINFOIO: 1
}

const DEF_LOC_INFO =
{
  lat: 0.0,
  lon: 0.0,
  city: "Failed",
  state: "Failed",
  country: "Failed",
  countryShort: "Failed",
  name: "Failed"
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

async function httpGetLoc(locProv)
{
  let addr;
  switch(locProv)
  {
    case MyLocProv.IPINFOIO:
      addr = "https://api.ipinfo.io";
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
        }
        if(!response || !(response = response.get_data()))
        {
          locationInfo = null;
          fetchingLocation = false;
          locationTime = new Date();
          reject("OpenWeather Refined: Invalid response");
        }

        let str = new TextDecoder().decode(response);
        if(!str)
        {
          locationInfo = null;
          fetchingLocation = false;
          locationTime = new Date();
          reject("OpenWeather Refined: No data in JSON My Location HTTP response.");
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
          countryShort: obj.country_short
        };
        if(locationInfo.countryShort === "US")
        {
          locationInfo.name = `${locationInfo.city}, ${locationInfo.state}`;
        }
        else locationInfo.name = `${locationInfo.city}, ${locationInfo.country}`;

        fetchingLocation = false;
        resolve(locationInfo);
      }
    );
  });
}

async function geoclueGetLoc()
{
  return new Promise((resolve, reject) => {
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
          reject(`OpenWeather Refined: ${e}`);
        }

        fetchingLocation = false;
        locationTime = new Date();
        locationInfo =
        {
          lat: loc.latitude,
          lon: loc.longitude,
          city: "Unknown",
          state: "Unknown",
          country: "Unknown",
          countryShort: "Unknown"
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
      if(myLocProv === MyLocProv.GEOCLUE)
      {
        try
        {
          return await geoclueGetLoc();
        }
        catch(e)
        {
          console.warn(`OpenWeather Refined: Geoclue failed ('${e}'); changing provider to ipinfo.io.`);
          myLocProv = MyLocProv.IPINFOIO;
          if(settings) settings.set_enum("my-loc-prov", myLocProv);
        }
      }

      try
      {
        return httpGetLoc(myLocProv);
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

