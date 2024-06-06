/*
   This file is part of OpenWeather (gnome-shell-extension-openweather).

   OpenWeather is free software: you can redistribute it and/or modify it under the terms of
   the GNU General Public License as published by the Free Software Foundation, either
   version 3 of the License, or (at your option) any later version.

   OpenWeather is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
   without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
   See the GNU General Public License for more details.

   You should have received a copy of the GNU General Public License along with OpenWeather.
   If not, see <https://www.gnu.org/licenses/>.

   Copyright 2022 Jason Oickle
*/
import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

import { getCachedLocInfo, getLocationInfo } from "./myloc.js";
import { getWeatherInfo, getWeatherProviderName, weatherProviderNotWorking } from "./getweather.js";

async function initWeatherData(refresh) {
  if (refresh) {
    this._lastRefresh = Date.now();
  }
  try {
    await this.refreshWeatherData().then(async () => {
      try 
      {
        if(this._city.isMyLoc())
        {
          await getLocationInfo(this.settings);
        }
        this.recalcLayout();

      } catch (e) {
        console.error(e);
      }
    });
  } catch (e) {
    console.error(e);
  }
}

async function reloadWeatherCache()
{
  try
  {
    await this.populateCurrentUI();
    if (!this._isForecastDisabled)
    {
      await this.populateTodaysUI();
      await this.populateForecastUI();
      this.recalcLayout();
    }
  }
  catch (e)
  {
    console.error(e);
  }
}

async function refreshWeatherData()
{
  try
  {
    let weather;
    try
    {
      weather = await getWeatherInfo(this, _);
    }
    catch(e)
    {
      let title, msg;
      if(e.name === "TooManyReqError")
      {
        let provName = getWeatherProviderName(e.provider);
        let tryAgain = weatherProviderNotWorking(this.settings);

        if(tryAgain)
        {
          this._provUrlButton.label = getWeatherProviderName(this.weatherProvider);
          this.reloadWeatherCurrent(1);
        }
        else
        {
          Main.notify(_("OpenWeather Refined Too Many Requests"),
            _("Provider %s has too many users. Try switching weather providers in settings.").format(provName));

          // Try reloading after 10 minutes
          this.reloadWeatherCurrent(600);
        }

        return;
      }
      else throw e;
    }

    if(!weather)
    {
      console.warn("OpenWeather Refined: getWeatherInfo failed without an error.");
      // Try reloading after 10 minutes
      this.reloadWeatherCurrent(600);
      return;
    }

    this.currentWeatherCache = weather;

    await this.populateCurrentUI();
    await this.populateTodaysUI();
    await this.populateForecastUI();
    this.reloadWeatherCurrent(this._refresh_interval_current);
  }
  catch(e)
  {
    console.error(`OpenWeather Refined: ${e}`);
    console.log(e.stack);
  }
}

function populateCurrentUI()
{
  return new Promise((resolve, reject) =>
  {
    try
    {
      /** @type {(Weather | null)} */
      let w = this.currentWeatherCache;
      if(!w) reject("OpenWeather Refined: No weather cached.");

      let location = this._city.getName(_);
      if(this._city.isMyLoc())
      {
        let locObj = getCachedLocInfo();
        let cityName = locObj.city;
        if(cityName === "Unknown") cityName = _("Unknown");
        location += ` (${cityName})`;
      }

      let iconName = w.getIconName();
      this._currentWeatherIcon.set_gicon(this.getGIcon(iconName));
      this._weatherIcon.set_gicon(this.getGIcon(iconName));

      let sunrise = w.getSunriseDate();
      let sunset = w.getSunsetDate();
      let lastBuild = new Date();

      // Is sunset approaching before the sunrise?
      let ms = lastBuild.getTime();
      if(sunrise.getTime() - ms > sunset.getTime() - ms)
      {
        this.topBoxSunIcon.set_gicon(this.getGIcon("daytime-sunset-symbolic"));
        this.topBoxSunInfo.text = w.displaySunset(this);
      }
      else
      {
        this.topBoxSunIcon.set_gicon(this.getGIcon("daytime-sunrise-symbolic"));
        this.topBoxSunInfo.text = w.displaySunrise(this);
      }

      let weatherInfoC = "";
      let weatherInfoT = "";

      let condition = w.displayCondition();
      let temp = w.displayTemperature(this);

      if (this._comment_in_panel) weatherInfoC = condition;
      if (this._text_in_panel) weatherInfoT = temp;

      this._weatherInfo.text =
        weatherInfoC +
        (weatherInfoC && weatherInfoT ? _(", ") : "") +
        weatherInfoT;

      this._currentWeatherSummary.text = condition + (", ") + temp;

      let locText;
      if (this._loc_len_current !== 0 &&
        location.length > this._loc_len_current)
      {
        locText = location.substring(0, this._loc_len_current - 3) + "...";
      }
      else
      {
        locText = location;
      }

      let feelsLikeText = w.displayFeelsLike(this);
      let humidityText = w.displayHumidity();
      let pressureText = w.displayPressure(this);
      let windText = w.displayWind(this);

      this._currentWeatherSunrise.text = w.displaySunrise(this);
      this._currentWeatherSunset.text = w.displaySunset(this);
      this._currentWeatherBuild.text = this.formatTime(lastBuild);

      if(this._currentWeatherLocation) this._currentWeatherLocation.text = locText;
      if(this._currentWeatherFeelsLike) this._currentWeatherFeelsLike.text = feelsLikeText;
      if(this._currentWeatherHumidity) this._currentWeatherHumidity.text = humidityText;
      if(this._currentWeatherPressure) this._currentWeatherPressure.text = pressureText;
      if(this._currentWeatherWind) this._currentWeatherWind.text = windText;
      if(this._currentWeatherWindGusts)
      {
        let available = w.gustsAvailable();
        this.setGustsPanelVisibility(available);
        if(available)
        {
          this._currentWeatherWindGusts.text = w.displayGusts(this);
        }
      }

      if(this._forecast.length > this._forecastDays)
      {
        this._forecast.splice(this._forecastDays, this._forecast.length - this._forecastDays);
        this.rebuildFutureWeatherUi(this._forecastDays);
      }

      resolve(0);
    } catch (e) {
      reject(e);
    }
  });
}

function populateTodaysUI() {
  return new Promise((resolve, reject) => {
    try {
      // Populate today's forecast UI
      let weather = this.currentWeatherCache;
      if(!weather) reject("OpenWeather Refined: No weather cached.");
      if(!weather.hasForecast()) reject("OpenWeather Refined: No forecast.");

      for (let i = 0; i < 4; i++)
      {
        let h = weather.forecastHoursFromNow(i * 3);
        let w = h.weather();

        let forecastTodayUi = this._todays_forecast[i];
        forecastTodayUi.Time.text = h.displayTime(this);
        forecastTodayUi.Icon.set_gicon(this.getGIcon(w.getIconName()));
        forecastTodayUi.Temperature.text = w.displayTemperature(this);
        forecastTodayUi.Summary.text = w.displayCondition();
      }
      resolve(0);
    } catch (e) {
      reject(e);
    }
  });
}

function populateForecastUI() {
  return new Promise((resolve, reject) => {
    try {
      // Populate N day / 3 hour forecast UI
      let weather = this.currentWeatherCache;
      if(!weather) reject("OpenWeather Refined: No weather cached.");
      if(!weather.hasForecast()) reject("OpenWeather Refined: No forecast.");

      let hrsToMidnight = 24 - new Date().getHours();
      let dayCount = Math.min(this._days_forecast + 1, weather.forecastDayCount());
      for (let i = 0; i < dayCount - 1; i++)
      {
        let forecastUi = this._forecast[i];
        for (let j = 0; j < 8; j++)
        {
          let h = weather.forecastHoursFromNow(i * 24 + hrsToMidnight + j * 3);
          let w = h.weather();

          let forecastDate = h.getStart();
          if (j === 0)
          {
            let beginOfDay = new Date(new Date().setHours(0, 0, 0, 0));
            let dayLeft = Math.floor(
              (forecastDate.getTime() - beginOfDay.getTime()) / 86400000
            );

            if (dayLeft === 1) forecastUi.Day.text = "\n" + _("Tomorrow");
            else
              forecastUi.Day.text =
                "\n" + this.getLocaleDay(forecastDate.getDay());
          }

          forecastUi[j].Time.text = h.displayTime(this);
          forecastUi[j].Icon.set_gicon(this.getGIcon(w.getIconName()));
          forecastUi[j].Temperature.text = w.displayTemperature(this);
          forecastUi[j].Summary.text = w.displayCondition();
        }
      }
      resolve(0);
    }
    catch (e)
    {
      reject(e);
    }
  });
}

function processTodaysData(json) {
  return new Promise((resolve, reject) => {
    try {
      let data = json.list;
      let todayList = [];

      for (let i = 0; i < 4; i++) todayList.push(data[i]);

      resolve(todayList);
    } catch (e) {
      reject(e);
    }
  });
}

export {
  initWeatherData,
  reloadWeatherCache,
  refreshWeatherData,
  populateCurrentUI,
  populateTodaysUI,
  populateForecastUI,
};
