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
 * Copyright (C) 2014 -2015
 *     Jens Lody <jens@jenslody.de>,
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
const OPENWEATHER_URL_BASE = 'http://' + OPENWEATHER_URL_HOST + '/data/2.5/';
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
        case 200: //thunderstorm with light rain
        case 201: //thunderstorm with rain
        case 202: //thunderstorm with heavy rain
        case 210: //light thunderstorm
        case 211: //thunderstorm
        case 212: //heavy thunderstorm
        case 221: //ragged thunderstorm
        case 230: //thunderstorm with light drizzle
        case 231: //thunderstorm with drizzle
        case 232: //thunderstorm with heavy drizzle
            iconname = ['weather-storm'];
            break;
        case 300: //light intensity drizzle
        case 301: //drizzle
        case 302: //heavy intensity drizzle
        case 310: //light intensity drizzle rain
        case 311: //drizzle rain
        case 312: //heavy intensity drizzle rain
        case 313: //shower rain and drizzle
        case 314: //heavy shower rain and drizzle
        case 321: //shower drizzle
            iconname = ['weather-showers'];
            break;
        case 500: //light rain
        case 501: //moderate rain
        case 502: //heavy intensity rain
        case 503: //very heavy rain
        case 504: //extreme rain
            iconname = ['weather-showers-scattered', 'weather-showers'];
            break;
        case 511: //freezing rain
            iconname = ['weather-freezing-rain', 'weather-showers'];
            break;
        case 520: //light intensity shower rain
        case 521: //shower rain
        case 522: //heavy intensity shower rain
        case 531: //ragged shower rain
            iconname = ['weather-showers'];
            break;
        case 600: //light snow
        case 601: //snow
        case 602: //heavy snow
        case 611: //sleet
        case 612: //shower sleet
        case 615: //light rain and snow
        case 616: //rain and snow
        case 620: //light shower snow
        case 621: //shower snow
        case 622: //heavy shower snow
            iconname = ['weather-snow'];
            break;
        case 701: //mist
        case 711: //smoke
        case 721: //haze
        case 741: //Fog
            iconname = ['weather-fog'];
            break;
        case 731: //Sand/Dust Whirls
        case 751: //sand
        case 761: //dust
        case 762: //VOLCANIC ASH
        case 771: //SQUALLS
        case 781: //TORNADO
            iconname = ['weather-severe-alert'];
            break;
        case 800: //sky is clear
            iconname = ['weather-clear'];
            break;
        case 801: //few clouds
        case 802: //scattered clouds
            iconname = ['weather-few-clouds'];
            break;
        case 803: //broken clouds
            iconname = ['weather-many-clouds', 'weather-overcast'];
            break;
        case 804: //overcast clouds
            iconname = ['weather-overcast'];
            break;
    }

    for (let i = 0; i < iconname.length; i++) {
        if (night && this.hasIcon(iconname[i] + '-night'))
            return iconname[i] + '-night' + this.getIconType();
        if (this.hasIcon(iconname[i]))
            return iconname[i] + this.getIconType();
    }
    return 'weather-severe-alert' + this.getIconType();
}

function getWeatherCondition(code) {
    switch (parseInt(code, 10)) {
        case 200: //thunderstorm with light rain
            return _('thunderstorm with light rain');
        case 201: //thunderstorm with rain
            return _('thunderstorm with rain');
        case 202: //thunderstorm with heavy rain
            return _('thunderstorm with heavy rain');
        case 210: //light thunderstorm
            return _('light thunderstorm');
        case 211: //thunderstorm
            return _('thunderstorm');
        case 212: //heavy thunderstorm
            return _('heavy thunderstorm');
        case 221: //ragged thunderstorm
            return _('ragged thunderstorm');
        case 230: //thunderstorm with light drizzle
            return _('thunderstorm with light drizzle');
        case 231: //thunderstorm with drizzle
            return _('thunderstorm with drizzle');
        case 232: //thunderstorm with heavy drizzle
            return _('thunderstorm with heavy drizzle');
        case 300: //light intensity drizzle
            return _('light intensity drizzle');
        case 301: //drizzle
            return _('drizzle');
        case 302: //heavy intensity drizzle
            return _('heavy intensity drizzle');
        case 310: //light intensity drizzle rain
            return _('light intensity drizzle rain');
        case 311: //drizzle rain
            return _('drizzle rain');
        case 312: //heavy intensity drizzle rain
            return _('heavy intensity drizzle rain');
        case 313: //shower rain and drizzle
            return _('shower rain and drizzle');
        case 314: //heavy shower rain and drizzle
            return _('heavy shower rain and drizzle');
        case 321: //shower drizzle
            return _('shower drizzle');
        case 500: //light rain
            return _('light rain');
        case 501: //moderate rain
            return _('moderate rain');
        case 502: //heavy intensity rain
            return _('heavy intensity rain');
        case 503: //very heavy rain
            return _('very heavy rain');
        case 504: //extreme rain
            return _('extreme rain');
        case 511: //freezing rain
            return _('freezing rain');
        case 520: //light intensity shower rain
            return _('light intensity shower rain');
        case 521: //shower rain
            return _('shower rain');
        case 522: //heavy intensity shower rain
            return _('heavy intensity shower rain');
        case 531: //ragged shower rain
            return _('ragged shower rain');
        case 600: //light snow
            return _('light snow');
        case 601: //snow
            return _('snow');
        case 602: //heavy snow
            return _('heavy snow');
        case 611: //sleet
            return _('sleet');
        case 612: //shower sleet
            return _('shower sleet');
        case 615: //light rain and snow
            return _('light rain and snow');
        case 616: //rain and snow
            return _('rain and snow');
        case 620: //light shower snow
            return _('light shower snow');
        case 621: //shower snow
            return _('shower snow');
        case 622: //heavy shower snow
            return _('heavy shower snow');
        case 701: //mist
            return _('mist');
        case 711: //smoke
            return _('smoke');
        case 721: //haze
            return _('haze');
        case 731: //Sand/Dust Whirls
            return _('Sand/Dust Whirls');
        case 741: //Fog
            return _('Fog');
        case 751: //sand
            return _('sand');
        case 761: //dust
            return _('dust');
        case 762: //VOLCANIC ASH
            return _('VOLCANIC ASH');
        case 771: //SQUALLS
            return _('SQUALLS');
        case 781: //TORNADO
            return _('TORNADO');
        case 800: //sky is clear
            return _('sky is clear');
        case 801: //few clouds
            return _('few clouds');
        case 802: //scattered clouds
            return _('scattered clouds');
        case 803: //broken clouds
            return _('broken clouds');
        case 804: //overcast clouds
            return _('overcast clouds');
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
    this._currentWeatherLocation.text = location;
    this._currentWeatherCloudiness.text = json.clouds.all + ' %';
    this._currentWeatherHumidity.text = json.main.humidity + ' %';
    this._currentWeatherPressure.text = this.formatPressure(json.main.pressure);
    this._currentWeatherSunrise.text = sunrise;
    this._currentWeatherSunset.text = sunset;
    this._currentWeatherBuild.text = lastBuild;
    this._currentWeatherWind.text = this.formatWind(json.wind.speed, this.getWindDirection(json.wind.deg));

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
            // we are connected, but get no (or no correct) data, so invalidate
            // the shown data and reload after 10 minutes (recommendded by openweathermap.org)
            this.rebuildCurrentWeatherUi();
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

    // Refresh forecast
    for (let i = 0; i < this._days_forecast; i++) {
        let forecastUi = this._forecast[i];
        let forecastData = forecast[i];
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
            // we are connected, but get no (or no correct) data, so invalidate
            // the shown data and reload after 10 minutes (recommendded by openweathermap.org)
            this.rebuildFutureWeatherUi();
            this.reloadWeatherForecast(600);
        }
    });
    this.reloadWeatherForecast(this._refresh_interval_forecast);
}
