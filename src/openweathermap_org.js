/* jshint esnext:true */
/*
 *
 *  Weather extension for GNOME Shell
 *  - Displays a small weather information on the top panel.
 *  - On click, gives a popup with details about the weather.
 *
 * Copyright (C) 2011 - 2013
 *     ecyrbe <ecyrbe+spam@gmail.com>,
 *     Timur Kristof <venemo@msn.com>,
 *     Elad Alfassa <elad@fedoraproject.org>,
 *     Simon Legner <Simon.Legner@gmail.com>,
 *     Christian METZLER <neroth@xeked.com>,
 *     Mark Benjamin weather.gnome.Markie1@dfgh.net,
 *     Mattia Meneguzzo odysseus@fedoraproject.org,
 *     Meng Zhuo <mengzhuo1203+spam@gmail.com>,
 *     Jens Lody <jens@jenslody.de>
 * Copyright (C) 2014 -2020
 *     Jens Lody <jens@jenslody.de>,
 * Copyright (C) 2018
 *     Taylor Raack <taylor@raack.info>
 *
 *
 * This file is part of gnome-shell-extension-openweather.
 *
 * gnome-shell-extension-openweather is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * gnome-shell-extension-openweather is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gnome-shell-extension-openweather.  If not, see <http://www.gnu.org/licenses/>.
 *
 */


const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const OpenweathermapOrg = Me.imports.openweathermap_org;
const Gettext = imports.gettext.domain('gnome-shell-extension-openweather');
const _ = Gettext.gettext;
const ngettext = Gettext.ngettext;

const OPENWEATHER_URL_HOST = 'api.openweathermap.org';
const OPENWEATHER_URL_BASE = 'https://' + OPENWEATHER_URL_HOST + '/data/2.5/';
const OPENWEATHER_URL_CURRENT = OPENWEATHER_URL_BASE + 'weather';
const OPENWEATHER_URL_FORECAST = OPENWEATHER_URL_BASE + 'forecast/daily';

function getWeatherIcon(code, night) {

    let iconname = ['weather-severe-alert'];
    // see http://bugs.openweathermap.org/projects/api/wiki/Weather_Condition_Codes
    // fallback icons are: weather-clear-night weather-clear weather-few-clouds-night weather-few-clouds weather-fog weather-overcast weather-severe-alert weather-showers weather-showers-scattered weather-snow weather-storm
    /*
weather-clouds-night.png
weather-freezing-rain.png
weather-hail.png
weather-many-clouds.png
weather-showers-day.png
weather-showers-night.png
weather-showers-scattered-day.png
weather-showers-scattered-night.png
weather-snow-rain.png
weather-snow-scattered-day.png
weather-snow-scattered-night.png
weather-snow-scattered.png
weather-storm-day.png
weather-storm-night.png

weather-severe-alert-symbolic.svg


weather-clear-night.png = weather-clear-night-symbolic.svg
weather-clear.png = weather-clear-symbolic.svg
weather-clouds.png = weather-overcast-symbolic.svg
weather-few-clouds-night.png = weather-few-clouds-night-symbolic.svg
weather-few-clouds.png = weather-few-clouds-symbolic.svg
weather-mist.png = weather-fog-symbolic.svg
weather-showers-scattered.png = weather-showers-scattered-symbolic.svg
weather-showers.png = weather-showers-symbolic.svg
weather-snow.png = weather-snow-symbolic.svg
weather-storm.png = weather-storm-symbolic.svg

*/
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
            iconname = ['weather-storm'];
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
            iconname = ['weather-showers'];
            break;
        case 500: //Light rain
        case 501: //Moderate rain
        case 502: //Heavy intensity rain
        case 503: //Very heavy rain
        case 504: //Extreme rain
            iconname = ['weather-showers-scattered', 'weather-showers'];
            break;
        case 511: //Freezing rain
            iconname = ['weather-freezing-rain', 'weather-showers'];
            break;
        case 520: //Light intensity shower rain
        case 521: //Shower rain
        case 522: //Heavy intensity shower rain
        case 531: //Ragged shower rain
            iconname = ['weather-showers'];
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
            iconname = ['weather-snow'];
            break;
        case 701: //Mist
        case 711: //Smoke
        case 721: //Haze
        case 741: //Fog
            iconname = ['weather-fog'];
            break;
        case 731: //Sand/Dust Whirls
        case 751: //Sand
        case 761: //Dust
        case 762: //VOLCANIC ASH
        case 771: //SQUALLS
        case 781: //TORNADO
            iconname = ['weather-severe-alert'];
            break;
        case 800: //Sky is clear
            iconname = ['weather-clear'];
            break;
        case 801: //Few clouds
        case 802: //Scattered clouds
            iconname = ['weather-few-clouds'];
            break;
        case 803: //Broken clouds
            iconname = ['weather-many-clouds', 'weather-overcast'];
            break;
        case 804: //Overcast clouds
            iconname = ['weather-overcast'];
            break;
    }

    for (let i = 0; i < iconname.length; i++) {
        if (night && this.hasIcon(iconname[i] + '-night'))
            return iconname[i] + '-night';
        if (this.hasIcon(iconname[i]))
            return iconname[i];
    }
    return 'weather-severe-alert';
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

function parseWeatherCurrent() {
    if (this.currentWeatherCache === undefined) {
        // this is a reentrency guard
        this.currentWeatherCache = "in refresh";
        this.refreshWeatherCurrent();
        return;
    }

    if (this.currentWeatherCache == "in refresh")
        return;

    this.checkAlignment();
    this.checkPositionInPanel();

    let json = this.currentWeatherCache;

    this.owmCityId = json.id;
    // Refresh current weather
    let location = this.extractLocation(this._city);

    let comment = json.weather[0].description;
    if (this._translate_condition)
        comment = OpenweathermapOrg.getWeatherCondition(json.weather[0].id);

    let temperature = this.formatTemperature(json.main.temp);
    let sunrise = new Date(json.sys.sunrise * 1000);
    let sunset = new Date(json.sys.sunset * 1000);
    let now = new Date();

    let iconname = this.getWeatherIcon(json.weather[0].id, now < sunrise || now > sunset);

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
        sunrise = sunrise.toLocaleFormat("%R");
        sunset = sunset.toLocaleFormat("%R");
        lastBuild = this.lastBuildDate.toLocaleFormat("%R");
    } else {
        sunrise = sunrise.toLocaleFormat("%I:%M %p");
        sunset = sunset.toLocaleFormat("%I:%M %p");
        lastBuild = this.lastBuildDate.toLocaleFormat("%I:%M %p");
    }

    let beginOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    let d = Math.floor((this.lastBuildDate.getTime() - beginOfDay.getTime()) / 86400000);
    if (d < 0) {
        lastBuild = _("Yesterday");
        if (d < -1)
            lastBuild = ngettext("%d day ago", "%d days ago", -1 * d).format(-1 * d);
    }

    this._currentWeatherIcon.icon_name = this._weatherIcon.icon_name = iconname;

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
    this._currentWeatherCloudiness.text = json.clouds.all + ' %';
    this._currentWeatherHumidity.text = json.main.humidity + ' %';
    this._currentWeatherPressure.text = this.formatPressure(json.main.pressure);
    this._currentWeatherSunrise.text = sunrise;
    this._currentWeatherSunset.text = sunset;
    this._currentWeatherBuild.text = lastBuild;
    if (json.wind != undefined && json.wind.deg != undefined) {
        this._currentWeatherWind.text = this.formatWind(json.wind.speed, this.getWindDirection(json.wind.deg));
    } else {
        this._currentWeatherWind.text = _("?");
    }

    this.parseWeatherForecast();
    this.recalcLayout();
}

function refreshWeatherCurrent() {
    this.oldLocation = this.extractCoord(this._city);

    if (this.oldLocation.search(",") == -1)
        return;

    let params = {
        lat: this.oldLocation.split(",")[0],
        lon: this.oldLocation.split(",")[1],
        units: 'metric'
    };
    if (this._appid)
        params.APPID = this._appid;

    this.load_json_async(OPENWEATHER_URL_CURRENT, params, function(json) {
        if (json && (Number(json.cod) == 200)) {

            if (this.currentWeatherCache != json)
                this.currentWeatherCache = json;

            this.rebuildSelectCityItem();

            this.parseWeatherCurrent();
        } else {
            // we are connected, but get no (or no correct) data, so try to reload
            // after 10 minutes (recommendded by openweathermap.org)
            this.reloadWeatherCurrent(600);
        }
    });
    this.reloadWeatherCurrent(this._refresh_interval_current);
}

function parseWeatherForecast() {
    if (this.forecastWeatherCache === undefined) {
        // this is a reentrency guard
        this.forecastWeatherCache = "in refresh";
        this.refreshWeatherForecast();
        return;
    }

    if (this.forecastWeatherCache == "in refresh")
        return;

    let forecast = this.forecastWeatherCache;
    let beginOfDay = new Date(new Date().setHours(0, 0, 0, 0));

    // OpenWeatherMap sometimes returns the previous day's forecast, especially in the early morning hours
    // of the lat / lng being queried. To prevent the first forecast element in the UI from being the previous
    // day's forecast, check for the returned forecast elements being for a previous day and maintain a
    // forecast index advance counter to skip previous day forecasts.
    let dateAdvanceIndex = 0;
    for (let i = 0; i < this._days_forecast; i++) {
        let forecastData = forecast[i];
        if (forecastData === undefined)
            continue;
        let forecastDate = new Date(forecastData.dt * 1000).setHours(0,0,0,0);
        if (forecastDate >= beginOfDay) {
        	// forecast is at least at the beginning of the current day; no need to look any further
        	break;
        }
        // forecast is behind the current day, so advance the increment index
    	dateAdvanceIndex++;
    }

    // Refresh forecast
    for (let i = 0; i < this._days_forecast; i++) {
        let forecastUi = this._forecast[i];
        // make sure to use the dateAdvanceIndex to skip any previous day forecasts
        let forecastData = forecast[i + dateAdvanceIndex];
        if (forecastData === undefined)
            continue;

        let t_low = this.formatTemperature(forecastData.temp.min);
        let t_high = this.formatTemperature(forecastData.temp.max);

        let comment = forecastData.weather[0].description;
        if (this._translate_condition)
            comment = OpenweathermapOrg.getWeatherCondition(forecastData.weather[0].id);

        let forecastDate = new Date(forecastData.dt * 1000);
        let dayLeft = Math.floor((forecastDate.getTime() - beginOfDay.getTime()) / 86400000);

        let date_string = _("Today");
        if (dayLeft == 1)
            date_string = _("Tomorrow");
        else if (dayLeft > 1)
            date_string = ngettext("In %d day", "In %d days", dayLeft).format(dayLeft);
        else if (dayLeft == -1)
            date_string = _("Yesterday");
        else if (dayLeft < -1)
            date_string = ngettext("%d day ago", "%d days ago", -1 * dayLeft).format(-1 * dayLeft);

        forecastUi.Day.text = date_string + ' (' + this.getLocaleDay(forecastDate.getDay()) + ')\n' + forecastDate.toLocaleDateString();
        forecastUi.Temperature.text = '\u2193 ' + t_low + '    \u2191 ' + t_high;
        forecastUi.Summary.text = comment;
        forecastUi.Icon.icon_name = this.getWeatherIcon(forecastData.weather[0].id);
    }
}

function refreshWeatherForecast() {


    this.oldLocation = this.extractCoord(this._city);

    if (this.oldLocation.search(",") == -1)
        return;

    let params = {
        lat: this.oldLocation.split(",")[0],
        lon: this.oldLocation.split(",")[1],
        units: 'metric',
        cnt: '13'
    };
    if (this._appid)
        params.APPID = this._appid;

    this.load_json_async(OPENWEATHER_URL_FORECAST, params, function(json) {
        if (json && (Number(json.cod) == 200)) {
            if (this.forecastWeatherCache != json.list) {
                this.owmCityId = json.city.id;
                this.forecastWeatherCache = json.list;
            }

            this.parseWeatherForecast();
        } else {
            // we are connected, but get no (or no correct) data, so try to reload
            // after 10 minutes (recommendded by openweathermap.org)
            this.reloadWeatherForecast(600);
        }
    });
    this.reloadWeatherForecast(this._refresh_interval_forecast);
}
