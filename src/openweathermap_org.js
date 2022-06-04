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

const Soup = imports.gi.Soup;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const OpenweathermapOrg = Me.imports.openweathermap_org;
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;
const ngettext = Gettext.ngettext;

const OPENWEATHER_URL_HOST = 'api.openweathermap.org';
const OPENWEATHER_URL_BASE = 'https://' + OPENWEATHER_URL_HOST + '/data/2.5/';
const OPENWEATHER_URL_CURRENT = OPENWEATHER_URL_BASE + 'weather';
const OPENWEATHER_URL_FORECAST = OPENWEATHER_URL_BASE + 'forecast';

function getIconName(code, night) {
    let iconname = 'weather-severe-alert-symbolic';
    // see https://openweathermap.org/weather-conditions
    switch (parseInt(code, 10)) {
        case 200: //Thunderstorm with light rain
        case 201: //Thunderstorm with rain
        case 202: //Thunderstorm with heavy rain
        case 210: //Light thunderstorm
        case 211: //Thunderstorm
        case 212: //Heavy thunderstorm
        case 221: //Ragged thunderstorm
        case 230: //Thunderstorm with light drizzle
        case 231: //Thunderstorm with drizzle
        case 232: //Thunderstorm with heavy drizzle
            iconname = 'weather-storm-symbolic';
            break;
        case 300: //Light intensity drizzle
        case 301: //drizzle
        case 302: //Heavy intensity drizzle
        case 310: //Light intensity drizzle rain
        case 311: //drizzle rain
        case 312: //Heavy intensity drizzle rain
        case 313: //Shower rain and drizzle
        case 314: //Heavy shower rain and drizzle
        case 321: //Shower drizzle
            iconname = 'weather-showers-symbolic';
            break;
        case 500: //Light rain
        case 501: //Moderate rain
        case 502: //Heavy intensity rain
        case 503: //Very heavy rain
        case 504: //Extreme rain
            iconname = 'weather-showers-scattered-symbolic';
            break;
        case 511: //Freezing rain
            iconname = 'weather-freezing-rain-symbolic';
            break;
        case 520: //Light intensity shower rain
        case 521: //Shower rain
        case 522: //Heavy intensity shower rain
        case 531: //Ragged shower rain
            iconname = 'weather-showers-symbolic';
            break;
        case 600: //Light snow
        case 601: //Snow
        case 602: //Heavy snow
        case 611: //Sleet
        case 612: //Shower sleet
        case 615: //Light rain and snow
        case 616: //Rain and snow
        case 620: //Light shower snow
        case 621: //Shower snow
        case 622: //Heavy shower snow
            iconname = 'weather-snow-symbolic';
            break;
        case 701: //Mist
        case 711: //Smoke
        case 721: //Haze
            iconname = 'weather-fog-symbolic';
            break;
        case 731: //Sand/Dust Whirls
            iconname = 'weather-windy-symbolic';
            break;
        case 741: //Fog
            iconname = 'weather-fog-symbolic';
            break;
        case 751: //Sand
        case 761: //Dust
        case 762: //VOLCANIC ASH
            iconname = 'weather-severe-alert-symbolic';
            break;
        case 771: //SQUALLS
            iconname = 'weather-windy-symbolic';
            break;
        case 781: //TORNADO
            iconname = 'weather-tornado-symbolic';
            break;
        case 800: //Sky is clear
            iconname = 'weather-clear-symbolic';
            if (night)
                iconname = 'weather-clear-night-symbolic';
            break;
        case 801: //Few clouds
        case 802: //Scattered clouds
        case 803: //Broken clouds
            iconname = 'weather-few-clouds-symbolic';
            if (night)
                iconname = 'weather-few-clouds-night-symbolic'
            break;
        case 804: //Overcast clouds
            iconname = 'weather-overcast-symbolic';
            break;
    }
    return iconname;
}

function getWeatherCondition(code) {
    switch (parseInt(code, 10)) {
        case 200: //Thunderstorm with light rain
            return _('Thunderstorm with light rain');
        case 201: //Thunderstorm with rain
            return _('Thunderstorm with rain');
        case 202: //Thunderstorm with heavy rain
            return _('Thunderstorm with heavy rain');
        case 210: //Light thunderstorm
            return _('Light thunderstorm');
        case 211: //Thunderstorm
            return _('Thunderstorm');
        case 212: //Heavy thunderstorm
            return _('Heavy thunderstorm');
        case 221: //Ragged thunderstorm
            return _('Ragged thunderstorm');
        case 230: //Thunderstorm with light drizzle
            return _('Thunderstorm with light drizzle');
        case 231: //Thunderstorm with drizzle
            return _('Thunderstorm with drizzle');
        case 232: //Thunderstorm with heavy drizzle
            return _('Thunderstorm with heavy drizzle');
        case 300: //Light intensity drizzle
            return _('Light intensity drizzle');
        case 301: //Drizzle
            return _('Drizzle');
        case 302: //Heavy intensity drizzle
            return _('Heavy intensity drizzle');
        case 310: //Light intensity drizzle rain
            return _('Light intensity drizzle rain');
        case 311: //Drizzle rain
            return _('Drizzle rain');
        case 312: //Heavy intensity drizzle rain
            return _('Heavy intensity drizzle rain');
        case 313: //Shower rain and drizzle
            return _('Shower rain and drizzle');
        case 314: //Heavy shower rain and drizzle
            return _('Heavy shower rain and drizzle');
        case 321: //Shower drizzle
            return _('Shower drizzle');
        case 500: //Light rain
            return _('Light rain');
        case 501: //Moderate rain
            return _('Moderate rain');
        case 502: //Heavy intensity rain
            return _('Heavy intensity rain');
        case 503: //Very heavy rain
            return _('Very heavy rain');
        case 504: //Extreme rain
            return _('Extreme rain');
        case 511: //Freezing rain
            return _('Freezing rain');
        case 520: //Light intensity shower rain
            return _('Light intensity shower rain');
        case 521: //Shower rain
            return _('Shower rain');
        case 522: //Heavy intensity shower rain
            return _('Heavy intensity shower rain');
        case 531: //Ragged shower rain
            return _('Ragged shower rain');
        case 600: //Light snow
            return _('Light snow');
        case 601: //Snow
            return _('Snow');
        case 602: //Heavy snow
            return _('Heavy snow');
        case 611: //Sleet
            return _('Sleet');
        case 612: //Shower sleet
            return _('Shower sleet');
        case 615: //Light rain and snow
            return _('Light rain and snow');
        case 616: //Rain and snow
            return _('Rain and snow');
        case 620: //Light shower snow
            return _('Light shower snow');
        case 621: //Shower snow
            return _('Shower snow');
        case 622: //Heavy shower snow
            return _('Heavy shower snow');
        case 701: //Mist
            return _('Mist');
        case 711: //Smoke
            return _('Smoke');
        case 721: //Haze
            return _('Haze');
        case 731: //Sand/Dust Whirls
            return _('Sand/Dust Whirls');
        case 741: //Fog
            return _('Fog');
        case 751: //Sand
            return _('Sand');
        case 761: //Dust
            return _('Dust');
        case 762: //VOLCANIC ASH
            return _('VOLCANIC ASH');
        case 771: //SQUALLS
            return _('SQUALLS');
        case 781: //TORNADO
            return _('TORNADO');
        case 800: //Sky is clear
            return _('Sky is clear');
        case 801: //Few clouds
            return _('Few clouds');
        case 802: //Scattered clouds
            return _('Scattered clouds');
        case 803: //Broken clouds
            return _('Broken clouds');
        case 804: //Overcast clouds
            return _('Overcast clouds');
        default:
            return _('Not available');
    }
}

async function getWeatherCurrent() {
    // Make sure we have data to process
    if (this.currentWeatherCache === undefined) {
        this.currentWeatherCache = "in refresh";
        this.refreshWeatherCurrent();
        return;
    }
    if (this.currentWeatherCache == "in refresh")
        return;

    this.checkAlignment();
    this.checkPositionInPanel();
    // Populate Current Weather UI
    try {
        await this.populateCurrentUI()
        .then(async () => {
            !this._disable_forecast && this.getWeatherForecast();
            this.recalcLayout();
        });
    }
    catch (e) {
        log("populateCurrentUI error: " + e);
    }
}

async function getWeatherForecast() {
    // Did the user disable the forecast?
    if (this._disable_forecast)
        return;
    // Make sure we have data to process
    if (this.forecastWeatherCache === undefined || this.todaysWeatherCache === undefined) {
        this.forecastWeatherCache = "in refresh";
        this.todaysWeatherCache = "in refresh";
        this.refreshWeatherForecast();
        return;
    }
    if (this.forecastWeatherCache == "in refresh" || this.todaysWeatherCache == "in refresh")
        return;
    // Populate Forecast Weather UI
    try {
        await this.populateForecastUI();
    }
    catch (e) {
        log("populateForecastUI error: " + e);
    }
}

async function refreshWeatherData() {
    let json = undefined;
    let location = this.extractCoord(this._city);
    let params = {
        lat: location.split(",")[0],
        lon: location.split(",")[1],
        units: 'metric'
    };
    if (this._appid)
        params.APPID = this._appid;
    try {
        json = await this.loadJsonAsync(OPENWEATHER_URL_CURRENT, params)
        .then(async (json) => {
            if (this.currentWeatherCache != json)
                this.currentWeatherCache = json;
            try {
                await this.populateCurrentUI();
            }
            catch (e) {
                log("populateCurrentUI error: " + e);
            }
        });
    }
    catch (e) {
        // Something went wrong, reload after 10 minutes
        // as per openweathermap.org recommendation.
        this.reloadWeatherCurrent(600);
        log("refreshWeatherData error: " + e);
    }
    this.reloadWeatherCurrent(this._refresh_interval_current);
}

async function refreshForecastData() {
    // Did the user disable the forecast?
    if (this._disable_forecast)
        return;

    let json = undefined;
    let sortedList = undefined;
    let todayList = undefined;
    let location = this.extractCoord(this._city);
    let params = {
        lat: location.split(",")[0],
        lon: location.split(",")[1],
        units: 'metric'
    };
    if (this._appid)
        params.APPID = this._appid;

    try {
        json = await this.loadJsonAsync(OPENWEATHER_URL_FORECAST, params)
        .then(async (json) => {
            refreshing: try {

                if (this.forecastJsonCache) {
                    let _freshData = JSON.stringify(json.list[0]);
                    let _cacheData = JSON.stringify(this.forecastJsonCache.list[0]);
                    if (_freshData === _cacheData) {
                        // No need to process if data unchanged
                        break refreshing;
                    }
                }
                this.forecastJsonCache = json;
                this.todaysWeatherCache = undefined;
                this.forecastWeatherCache = undefined;
                this.owmCityId = json.city.id;
                // Today's forecast
                todayList = await this.processTodaysData(json)
                .then(async (todayList) => {
                    this.todaysWeatherCache = todayList;
                });
                // 5 day / 3 hour forecast
                sortedList = await this.processForecastData(json)
                .then(async (sortedList) => {
                    this.forecastWeatherCache = sortedList;
                    try {
                        await this.populateForecastUI();
                    }
                    catch (e) {
                        log("populateForecastUI error: " + e);
                    }
                });
            }
            catch (e) {
                log("Error processing forecast json data: " + e);
            }
        });
    }
    catch (e) {
        /// Something went wrong, reload after 10 minutes
        // as per openweathermap.org recommendation.
        this.reloadWeatherForecast(600);
        log("refreshForecastData error: " + e);
    }
    this.reloadWeatherForecast(this._refresh_interval_forecast);
}

async function refreshWeatherCurrent() {

    this.oldLocation = this.extractCoord(this._city);
    if (this.oldLocation.search(",") == -1)
        return;

    let json = undefined;
    this.currentWeatherCache = undefined;
    let params = {
        lat: this.oldLocation.split(",")[0],
        lon: this.oldLocation.split(",")[1],
        units: 'metric'
    };
    if (this._appid)
        params.APPID = this._appid;

    try {
        json = await this.loadJsonAsync(OPENWEATHER_URL_CURRENT, params)
        .then(async (json) => {
            if (this.currentWeatherCache != json)
                this.currentWeatherCache = json;

            this.rebuildSelectCityItem();
            this.getWeatherCurrent();
        });
    }
    catch (e) {
        // Something went wrong, reload after 10 minutes
        // as per openweathermap.org recommendation.
        this.reloadWeatherCurrent(600);
        log("Current loadJsonAsync error: " + e);
    }
    this.reloadWeatherCurrent(this._refresh_interval_current);
}

async function refreshWeatherForecast() {
    // Did the user disable the forecast?
    if (this._disable_forecast)
        return;

    this.oldLocation = this.extractCoord(this._city);
    if (this.oldLocation.search(",") == -1)
        return;

    let json = undefined;
    let sortedList = undefined;
    let todayList = undefined;
    this.todaysWeatherCache = undefined;
    this.forecastWeatherCache = undefined;
    let params = {
        lat: this.oldLocation.split(",")[0],
        lon: this.oldLocation.split(",")[1],
        units: 'metric'
    };
    if (this._appid)
        params.APPID = this._appid;

    try {
        json = await this.loadJsonAsync(OPENWEATHER_URL_FORECAST, params)
        .then(async (json) => {
            try {
                this.owmCityId = json.city.id;
                // Today's forecast
                todayList = await this.processTodaysData(json)
                .then(async (todayList) => {
                    if (this.todaysWeatherCache != todayList)
                        this.todaysWeatherCache = todayList;
                });
                // 5 day / 3 hour forecast
                sortedList = await this.processForecastData(json)
                .then(async (sortedList) => {
                    if (this.forecastWeatherCache != sortedList)
                        this.forecastWeatherCache = sortedList;

                    this.getWeatherForecast();
                });
            }
            catch (e) {
                log("Error processing forecast json data: " + e);
            }
        });
    }
    catch (e) {
        // Something went wrong, reload after 10 minutes
        // as per openweathermap.org recommendation.
        this.reloadWeatherForecast(600);
        log("Forecast loadJsonAsync error: " + e);
    }
    this.reloadWeatherForecast(this._refresh_interval_forecast);
}

function populateCurrentUI() {
    return new Promise((resolve, reject) => {
        try {
            let json = this.currentWeatherCache;
            this.owmCityId = json.id;

            let location = this.extractLocation(this._city);

            let comment = json.weather[0].description;
            if (this._translate_condition)
                comment = OpenweathermapOrg.getWeatherCondition(json.weather[0].id);

            let temperature = this.formatTemperature(json.main.temp);
            let sunrise = new Date(json.sys.sunrise * 1000);
            let sunset = new Date(json.sys.sunset * 1000);
            let now = new Date();

            let iconname = OpenweathermapOrg.getIconName(json.weather[0].id, now < sunrise || now > sunset);

            if (this.lastBuildId === undefined)
                this.lastBuildId = 0;
            if (this.lastBuildDate === undefined)
                this.lastBuildDate = 0;

            if (this.lastBuildId != json.dt || !this.lastBuildDate) {
                this.lastBuildId = json.dt;
                this.lastBuildDate = new Date(this.lastBuildId * 1000);
            }
            let lastBuild = '-';

            if (this._clockFormat == "24h") {
                sunrise = sunrise.toLocaleTimeString([this.locale], { hour12: false });
                sunset = sunset.toLocaleTimeString([this.locale], { hour12: false });
                lastBuild = this.lastBuildDate.toLocaleTimeString([this.locale], { hour12: false });
            } else {
                sunrise = sunrise.toLocaleTimeString([this.locale], { hour: 'numeric', minute: 'numeric' });
                sunset = sunset.toLocaleTimeString([this.locale], { hour: 'numeric', minute: 'numeric' });
                lastBuild = this.lastBuildDate.toLocaleTimeString([this.locale], { hour: 'numeric', minute: 'numeric' });
            }

            let beginOfDay = new Date(new Date().setHours(0, 0, 0, 0));
            let d = Math.floor((this.lastBuildDate.getTime() - beginOfDay.getTime()) / 86400000);
            if (d < 0) {
                lastBuild = _("Yesterday");
                if (d < -1)
                    lastBuild = ngettext("%d day ago", "%d days ago", -1 * d).format(-1 * d);
            }

            this._currentWeatherIcon.set_gicon(this.getWeatherIcon(iconname));
            this._weatherIcon.set_gicon(this.getWeatherIcon(iconname));

            let weatherInfoC = "";
            let weatherInfoT = "";

            if (this._comment_in_panel)
                weatherInfoC = comment;

            if (this._text_in_panel)
                weatherInfoT = temperature;

            this._weatherInfo.text = weatherInfoC + ((weatherInfoC && weatherInfoT) ? _(", ") : "") + weatherInfoT;

            this._currentWeatherSummary.text = comment + _(", ") + temperature;
            if (this._loc_len_current != 0 && location.length > this._loc_len_current)
                this._currentWeatherLocation.text = location.substring(0, (this._loc_len_current - 3)) + "...";
            else
                this._currentWeatherLocation.text = location;
            this._currentWeatherFeelsLike.text = this.formatTemperature(json.main.feels_like);
            this._currentWeatherHumidity.text = json.main.humidity + ' %';
            this._currentWeatherPressure.text = this.formatPressure(json.main.pressure);
            this._currentWeatherSunrise.text = sunrise;
            this._currentWeatherSunset.text = sunset;
            this._currentWeatherBuild.text = lastBuild;
            if (json.wind != undefined && json.wind.deg != undefined) {
                this._currentWeatherWind.text = this.formatWind(json.wind.speed, this.getWindDirection(json.wind.deg));
                if (json.wind.gust != undefined)
                    this._currentWeatherWindGusts.text = this.formatWind(json.wind.gust);
            } else {
                this._currentWeatherWind.text = _("?");
            }
            resolve(0);
        }
        catch (e) {
            reject(e);
        }
    });
}

function populateForecastUI() {
    return new Promise((resolve, reject) => {
        try {
            // Refresh today's forecast
            let forecast_today = this.todaysWeatherCache;
            let sunrise = new Date(this.currentWeatherCache.sys.sunrise * 1000).toLocaleTimeString([this.locale], { hour12: false });
            let sunset = new Date(this.currentWeatherCache.sys.sunset * 1000).toLocaleTimeString([this.locale], { hour12: false });

            for (var i = 0; i < 4; i++) {
                let forecastTodayUi = this._todays_forecast[i];
                let forecastDataToday = forecast_today[i];

                let forecastTime = new Date(forecastDataToday.dt * 1000);
                let forecastTemp = this.formatTemperature(forecastDataToday.main.temp);
                let iconTime = forecastTime.toLocaleTimeString([this.locale], { hour12: false });
                let iconname = OpenweathermapOrg.getIconName(forecastDataToday.weather[0].id, iconTime < sunrise || iconTime > sunset);

                let comment = forecastDataToday.weather[0].description;
                if (this._translate_condition)
                    comment = OpenweathermapOrg.getWeatherCondition(forecastDataToday.weather[0].id);

                if (this._clockFormat == "24h")
                    forecastTodayUi.Time.text = forecastTime.toLocaleTimeString([this.locale], { hour12: false });
                else
                    forecastTodayUi.Time.text = forecastTime.toLocaleTimeString([this.locale], { hour: 'numeric' });

                forecastTodayUi.Icon.set_gicon(this.getWeatherIcon(iconname));
                forecastTodayUi.Temperature.text = forecastTemp;
                forecastTodayUi.Summary.text = comment;
            }

            // Refresh 5 day / 3 hour forecast
            let forecast = this.forecastWeatherCache;
            // first remove today from forecast data if exists
            let _now = new Date().toLocaleDateString([this.locale]);
            for (var i = 0; i < forecast.length; i++) {
                let _itemDate = new Date(forecast[i][0].dt * 1000);
                let _this = _itemDate.toLocaleDateString([this.locale]);
                if (_now === _this) {
                    forecast.shift();
                }
            }

            for (let i = 0; i < this._days_forecast; i++) {
                let forecastUi = this._forecast[i];
                let forecastData = forecast[i];

                for (let j = 0; j < 8; j++) {
                    if (forecastData[j] === undefined)
                        continue;

                    let forecastDate = new Date(forecastData[j].dt * 1000);
                    if (j === 0) {
                        let beginOfDay = new Date(new Date().setHours(0, 0, 0, 0));
                        let dayLeft = Math.floor((forecastDate.getTime() - beginOfDay.getTime()) / 86400000);

                        if (dayLeft == 1)
                            forecastUi.Day.text = '\n'+_("Tomorrow");
                        else
                            forecastUi.Day.text = '\n'+this.getLocaleDay(forecastDate.getDay());
                    }
                    let iconTime = forecastDate.toLocaleTimeString([this.locale], { hour12: false });
                    let iconname = OpenweathermapOrg.getIconName(forecastData[j].weather[0].id, iconTime < sunrise || iconTime > sunset);
                    let forecastTemp = this.formatTemperature(forecastData[j].main.temp);

                    let comment = forecastData[j].weather[0].description;
                    if (this._translate_condition)
                        comment = OpenweathermapOrg.getWeatherCondition(forecastData[j].weather[0].id);

                    if (this._clockFormat == "24h")
                        forecastUi[j].Time.text = forecastDate.toLocaleTimeString([this.locale], { hour12: false });
                    else
                        forecastUi[j].Time.text = forecastDate.toLocaleTimeString([this.locale], { hour: 'numeric' });

                    forecastUi[j].Icon.set_gicon(this.getWeatherIcon(iconname));
                    forecastUi[j].Temperature.text = forecastTemp;
                    forecastUi[j].Summary.text = comment;
                }
            }
            resolve(0);
        }
        catch (e) {
            reject(e);
        }
    });
}

function loadJsonAsync(url, params) {
    return new Promise((resolve, reject) => {

        let _httpSession = new Soup.Session();
        let message = Soup.form_request_new_from_hash('GET', url, params);
        // add trailing space, so libsoup adds its own user-agent
        _httpSession.user_agent = this.user_agent + ' ';

        _httpSession.queue_message(message, (_httpSession, message) => {
            try {
                if (!message.response_body.data)
                    reject("No data");

                resolve(JSON.parse(message.response_body.data));
            }
            catch (e) {
                reject("Soup queue_message error: " + e);
            }
        });
    });
}

function processTodaysData(json) {
    return new Promise((resolve, reject) => {
        try {
            let data = json.list;
            let todayList = [];

            for (let i = 0; i < 4; i++)
                todayList.push(data[i]);

            resolve(todayList);
        }
        catch (e) {
            reject("processTodaysData error: " + e);
        }
    });
}

function processForecastData(json) {
    return new Promise((resolve, reject) => {
        try {
            let a = 0;
            let data = json.list;
            let sortedList = [];
            sortedList[a] = [data[0]];

            for (let i = 1; i < data.length; i++) {
                let _this = new Date(data[i].dt * 1000).toLocaleDateString([this.locale]);
                let _last = new Date(data[i-1].dt * 1000).toLocaleDateString([this.locale]);

                if (_this == _last)
                    sortedList[a].push(data[i]);
                else {
                    a = a+1;
                    sortedList[a] = [];
                    sortedList[a].push(data[i]);
                }
            }
            resolve(sortedList);
        }
        catch (e) {
            reject("processForecastData error: " + e);
        }
    });
}
