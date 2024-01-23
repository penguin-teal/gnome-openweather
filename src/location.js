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

// Chrome 120.0 on Windows (common user agent)
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.3";

const LOC_ADDR = "https://api.infoip.io/";

let soupSession = null;
let locationInfo = null;
let locationTime = new Date(0);
let locationRefreshInterval = new Date(0).setMinutes(60);

let fetchingLocation = false;

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

export async function getLocationInfo(forceRefresh)
{
  let sess = getSoupSession();

  let now = new Date();
  if(locationInfo === null || forceRefresh || now - locationTime > locationRefreshInterval)
  {
    let msg = Soup.Message.new("GET", LOC_ADDR);
    return new Promise((resolve) => {
      sess.send_and_read_async(
        msg,
        GLib.PRIORITY_DEFAULT,
        null,
        (s, m) =>
        {
          fetchingLocation = true;

          let response = s.send_and_read_finish(m).get_data();
          if(!response)
          {
            fetchingLocation = false;
            locationInfo = null;
            reject();
          }

          let str = new TextDecoder().decode(response);
          let obj = JSON.parse(str);

          locationTime = now;
          locationInfo =
          {
            lat: obj.latitude,
            lon: obj.longitude,
            city: obj.city,
            state: obj.region,
            country: obj.country_long
          };
          fetchingLocation = false;
          resolve(locationInfo);
        }
      );
    });
  }
  else if(fetchingLocation)
  {
    console.warn("OpenWeather Refined: Location requested while fetching it; returning cached location.");
  }

  return locationInfo;
}

export function getCachedLocInfo()
{
  return locationInfo;
}

