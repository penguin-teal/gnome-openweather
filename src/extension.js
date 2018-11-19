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
 * Copyright (C) 2014 -2018
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
const Config = imports.misc.config;
const Convenience = Me.imports.convenience;
const DarkskyNet = Me.imports.darksky_net;
const OpenweathermapOrg = Me.imports.openweathermap_org;
const Clutter = imports.gi.Clutter;
const Gettext = imports.gettext.domain('gnome-shell-extension-openweather');
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Soup = imports.gi.Soup;
const St = imports.gi.St;
const GnomeSession = imports.misc.gnomeSession;
const Util = imports.misc.util;
const _ = Gettext.gettext;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

// Settings
const OPENWEATHER_SETTINGS_SCHEMA = 'org.gnome.shell.extensions.openweather';
const OPENWEATHER_DESKTOP_INTERFACE = 'org.gnome.desktop.interface';
const OPENWEATHER_PROVIDER_KEY = 'weather-provider';
const OPENWEATHER_UNIT_KEY = 'unit';
const OPENWEATHER_WIND_SPEED_UNIT_KEY = 'wind-speed-unit';
const OPENWEATHER_WIND_DIRECTION_KEY = 'wind-direction';
const OPENWEATHER_PRESSURE_UNIT_KEY = 'pressure-unit';
const OPENWEATHER_CITY_KEY = 'city';
const OPENWEATHER_ACTUAL_CITY_KEY = 'actual-city';
const OPENWEATHER_TRANSLATE_CONDITION_KEY = 'translate-condition';
const OPENWEATHER_USE_SYMBOLIC_ICONS_KEY = 'use-symbolic-icons';
const OPENWEATHER_USE_TEXT_ON_BUTTONS_KEY = 'use-text-on-buttons';
const OPENWEATHER_SHOW_TEXT_IN_PANEL_KEY = 'show-text-in-panel';
const OPENWEATHER_POSITION_IN_PANEL_KEY = 'position-in-panel';
const OPENWEATHER_MENU_ALIGNMENT_KEY = 'menu-alignment';
const OPENWEATHER_SHOW_COMMENT_IN_PANEL_KEY = 'show-comment-in-panel';
const OPENWEATHER_SHOW_COMMENT_IN_FORECAST_KEY = 'show-comment-in-forecast';
const OPENWEATHER_REFRESH_INTERVAL_CURRENT = 'refresh-interval-current';
const OPENWEATHER_REFRESH_INTERVAL_FORECAST = 'refresh-interval-forecast';
const OPENWEATHER_CENTER_FORECAST_KEY = 'center-forecast';
const OPENWEATHER_DAYS_FORECAST = 'days-forecast';
const OPENWEATHER_DECIMAL_PLACES = 'decimal-places';
const OPENWEATHER_USE_DEFAULT_OWM_API_KEY = 'use-default-owm-key';
const OPENWEATHER_OWM_API_KEY = 'appid';
const OPENWEATHER_OWM_DEFAULT_API_KEY = 'c93b4a667c8c9d1d1eb941621f899bb8';
const OPENWEATHER_FC_API_KEY = 'appid-fc';
const OPENWEATHER_LOC_TEXT_LEN = 'location-text-length'

// Keep enums in sync with GSettings schemas
const WeatherProvider = {
    DEFAULT: -1,
    OPENWEATHERMAP: 0,
    DARKSKY: 1
};

const WeatherUnits = {
    CELSIUS: 0,
    FAHRENHEIT: 1,
    KELVIN: 2,
    RANKINE: 3,
    REAUMUR: 4,
    ROEMER: 5,
    DELISLE: 6,
    NEWTON: 7
};

const WeatherWindSpeedUnits = {
    KPH: 0,
    MPH: 1,
    MPS: 2,
    KNOTS: 3,
    FPS: 4,
    BEAUFORT: 5
};

const WeatherPressureUnits = {
    HPA: 0,
    INHG: 1,
    BAR: 2,
    PA: 3,
    KPA: 4,
    ATM: 5,
    AT: 6,
    TORR: 7,
    PSI: 8,
    MMHG: 9,
    MBAR: 10
};

const WeatherPosition = {
    CENTER: 0,
    RIGHT: 1,
    LEFT: 2
};

const OPENWEATHER_CONV_MPS_IN_MPH = 2.23693629;
const OPENWEATHER_CONV_MPS_IN_KPH = 3.6;
const OPENWEATHER_CONV_MPS_IN_KNOTS = 1.94384449;
const OPENWEATHER_CONV_MPS_IN_FPS = 3.2808399;

let _httpSession;
let _currentWeatherCache, _forecastWeatherCache;
let _timeCacheCurrentWeather, _timeCacheForecastWeather;

const OpenweatherMenuButton = new Lang.Class({
    Name: 'OpenweatherMenuButton',

    Extends: PanelMenu.Button,

    _init: function() {
        this.owmCityId = 0;

        // Get locale, needed for toLocaleString, workaround for gnome-shell 3.24
        this.locale = GLib.get_language_names()[0];

        if (this.locale.indexOf('_') != -1)
            this.locale = this.locale.split("_")[0];

        // Create user-agent string from uuid and (if present) the version
        this.user_agent = Me.metadata.uuid;
        if (Me.metadata.version !== undefined && Me.metadata.version.toString().trim() !== '') {
            this.user_agent += '/';
            this.user_agent += Me.metadata.version.toString();
        }
        // add trailing space, so libsoup adds its own user-agent
        this.user_agent += ' ';

        this.oldProvider = this._weather_provider;
        this.oldUseDefaultOwmKey = this._use_default_owm_key;
        this.oldTranslateCondition = this._translate_condition;
        this.switchProvider();

        // Load settings
        this.loadConfig();

        // Label
        this._weatherInfo = new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            text: _('...')
        });

        this._weatherIcon = new St.Icon({
            icon_name: 'view-refresh',
            style_class: 'system-status-icon openweather-icon ' + this.getIconType()
        });

        // Panel menu item - the current class
        let menuAlignment = 1.0 - (this._menu_alignment / 100);
        if (Clutter.get_default_text_direction() == Clutter.TextDirection.RTL)
            menuAlignment = 1.0 - menuAlignment;
        this.parent(menuAlignment);

        // Putting the panel item together
        let topBox = new St.BoxLayout();
        topBox.add_actor(this._weatherIcon);
        topBox.add_actor(this._weatherInfo);
        this.actor.add_actor(topBox);

        let dummyBox = new St.BoxLayout();
        this.actor.reparent(dummyBox);
        dummyBox.remove_actor(this.actor);
        dummyBox.destroy();

        let children = null;
        switch (this._position_in_panel) {
            case WeatherPosition.LEFT:
                children = Main.panel._leftBox.get_children();
                Main.panel._leftBox.insert_child_at_index(this.actor, children.length);
                break;
            case WeatherPosition.CENTER:
                children = Main.panel._centerBox.get_children();
                Main.panel._centerBox.insert_child_at_index(this.actor, children.length);
                break;
            case WeatherPosition.RIGHT:
                children = Main.panel._rightBox.get_children();
                Main.panel._rightBox.insert_child_at_index(this.actor, 0);
                break;
        }
        if (Main.panel._menus === undefined)
            Main.panel.menuManager.addMenu(this.menu);
        else
            Main.panel._menus.addMenu(this.menu);

        this._session = new GnomeSession.SessionManager();

        this._old_position_in_panel = this._position_in_panel;

        // Current weather
        this._currentWeather = new St.Bin();
        // Future weather
        this._futureWeather = new St.Bin();

        // Putting the popup item together
        let _itemCurrent = new PopupMenu.PopupBaseMenuItem({
            reactive: false
        });
        let _itemFuture = new PopupMenu.PopupBaseMenuItem({
            reactive: false
        });

        if (ExtensionUtils.versionCheck(['3.8'], Config.PACKAGE_VERSION)) {
            _itemCurrent.addActor(this._currentWeather);
            _itemFuture.addActor(this._futureWeather);
        } else {
            _itemCurrent.actor.add_actor(this._currentWeather);
            _itemFuture.actor.add_actor(this._futureWeather);
        }

        this.menu.addMenuItem(_itemCurrent);

        this._separatorItem = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(this._separatorItem);

        this.menu.addMenuItem(_itemFuture);

        let item = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(item);

        this._selectCity = new PopupMenu.PopupSubMenuMenuItem("");
        this._selectCity.actor.set_height(0);
        this._selectCity._triangle.set_height(0);

        this._buttonMenu = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            style_class: 'openweather-menu-button-container'
        });

        this.rebuildButtonMenu();

        this.menu.addMenuItem(this._buttonMenu);
        this.menu.addMenuItem(this._selectCity);
        this.rebuildSelectCityItem();
        this._selectCity.menu.connect('open-state-changed', Lang.bind(this, function() {
            this._selectCity.actor.remove_style_pseudo_class('open');
        }));

        this.rebuildCurrentWeatherUi();
        this.rebuildFutureWeatherUi();

        this._idle = false;
        this._connected = false;

        this._network_monitor = Gio.network_monitor_get_default();

        this._presence = new GnomeSession.Presence(Lang.bind(this, function(proxy, error) {
            this._onStatusChanged(proxy.status);
        }));
        this._presence_connection = this._presence.connectSignal('StatusChanged', Lang.bind(this, function(proxy, senderName, [status]) {
            this._onStatusChanged(status);
        }));

        this.currentWeatherCache = _currentWeatherCache;
        this.forecastWeatherCache = _forecastWeatherCache;
        if (_timeCacheForecastWeather !== undefined) {
            let diff = Math.floor(new Date(new Date() - _timeCacheForecastWeather).getTime() / 1000);
            if (diff < this._refresh_interval_forecast)
                this.reloadWeatherForecast(this._refresh_interval_forecast - diff);
        }
        if (_timeCacheCurrentWeather !== undefined) {
            let diff = Math.floor(new Date(new Date() - _timeCacheCurrentWeather).getTime() / 1000);
            if (diff < this._refresh_interval_current)
                this.reloadWeatherCurrent(this._refresh_interval_current - diff);
        }
        this._network_monitor_connection = this._network_monitor.connect('network-changed', Lang.bind(this, this._onNetworkStateChanged));

        this._checkConnectionState();

        this.menu.connect('open-state-changed', Lang.bind(this, this.recalcLayout));
        if (ExtensionUtils.versionCheck(['3.8'], Config.PACKAGE_VERSION)) {
            this._needsColorUpdate = true;
            let context = St.ThemeContext.get_for_stage(global.stage);
            this._globalThemeChangedId = context.connect('changed', Lang.bind(this, function() {
                this._needsColorUpdate = true;
            }));
        }
    },

    _onStatusChanged: function(status) {
        this._idle = false;

        if (status == GnomeSession.PresenceStatus.IDLE) {
            this._idle = true;
        }
    },

    stop: function() {
        _forecastWeatherCache = this.forecastWeatherCache;
        _currentWeatherCache = this.currentWeatherCache;

        if (_httpSession !== undefined)
            _httpSession.abort();

        _httpSession = undefined;

        if (this._timeoutCurrent)
            Mainloop.source_remove(this._timeoutCurrent);

        this._timeoutCurrent = undefined;

        if (this._timeoutForecast)
            Mainloop.source_remove(this._timeoutForecast);

        this._timeoutForecast = undefined;

        if (this._presence_connection) {
            this._presence.disconnectSignal(this._presence_connection);
            this._presence_connection = undefined;
        }

        if (this._network_monitor_connection) {
            this._network_monitor.disconnect(this._network_monitor_connection);
            this._network_monitor_connection = undefined;
        }

        if (this._timeoutCheckConnectionState)
            Mainloop.source_remove(this._timeoutCheckConnectionState);

        this._timeoutCheckConnectionState = undefined;

        if (this._settingsC) {
            this._settings.disconnect(this._settingsC);
            this._settingsC = undefined;
        }

        if (this._settingsInterfaceC) {
            this._settingsInterface.disconnect(this._settingsInterfaceC);
            this._settingsInterfaceC = undefined;
        }

        if (this._globalThemeChangedId) {
            let context = St.ThemeContext.get_for_stage(global.stage);
            context.disconnect(this._globalThemeChangedId);
            this._globalThemeChangedId = undefined;
        }
    },

    switchProvider: function() {
        if (this._weather_provider == WeatherProvider.DARKSKY)
            this.useDarkskyNet();
        else
            this.useOpenweathermapOrg();
    },

    useOpenweathermapOrg: function() {
        this.parseWeatherForecast = OpenweathermapOrg.parseWeatherForecast;
        this.parseWeatherCurrent = OpenweathermapOrg.parseWeatherCurrent;
        this.getWeatherIcon = OpenweathermapOrg.getWeatherIcon;
        this.refreshWeatherCurrent = OpenweathermapOrg.refreshWeatherCurrent;
        this.refreshWeatherForecast = OpenweathermapOrg.refreshWeatherForecast;

        this.weatherProvider = "OpenWeatherMap";

        if (this._appid.toString().trim() === '')
            Main.notify("Openweather", _("Openweathermap.org does not work without an api-key.\nEither set the switch to use the extensions default key in the preferences dialog to on or register at https://openweathermap.org/appid and paste your personal key into the preferences dialog."));

    },

    useDarkskyNet: function() {
        this.parseWeatherCurrent = DarkskyNet.parseWeatherCurrent;
        this.parseWeatherForecast = DarkskyNet.parseWeatherForecast;
        this.getWeatherIcon = DarkskyNet.getWeatherIcon;
        this.refreshWeatherCurrent = DarkskyNet.refreshWeatherCurrent;
        this.refreshWeatherForecast = function() {};

        this.weatherProvider = "Dark Sky";

        this.fc_locale = 'en';

        if (this._translate_condition) {
            let fc_locales = [
                'ar',
                'az',
                'be',
                'bs',
                'cz',
                'de',
                'el',
                'en',
                'es',
                'fr',
                'hr',
                'hu',
                'id',
                'it',
                'is',
                'kw',
                'nb',
                'nl',
                'pl',
                'pt',
                'ru',
                'sk',
                'sr',
                'sv',
                'tet',
                'tr',
                'uk',
                'x-pig-latin',
                'zh',
                'zh-tw'
            ];

            if (fc_locales.indexOf(this.locale) != -1)
                this.fc_locale = this.locale;
        }

        if (this._appid_fc.toString().trim() === '')
            Main.notify("Openweather", _("Dark Sky does not work without an api-key.\nPlease register at https://darksky.net/dev/register and paste your personal key into the preferences dialog."));
    },

    getWeatherProviderURL: function() {
        let url = "";
        if (this._weather_provider == WeatherProvider.DARKSKY) {
            url = "https://darksky.net/";
            url += this.extractCoord(this._city);
        } else {
            url = "https://openweathermap.org";
            url += "/city/" + this.owmCityId;
            if (this._appid)
                url += "?APPID=" + this._appid;
        }
        return url;
    },

    loadConfig: function() {
        this._settings = Convenience.getSettings(OPENWEATHER_SETTINGS_SCHEMA);

        if (this._cities.length === 0)
            this._cities = "-8.5211767,179.1976747>Vaiaku, Tuvalu>-1";

        this._settingsC = this._settings.connect("changed", Lang.bind(this, function() {
            if (this._cities.length === 0)
                this._cities = "-8.5211767,179.1976747>Vaiaku, Tuvalu>-1";
            this.rebuildCurrentWeatherUi();
            this.rebuildFutureWeatherUi();
            if (this.providerChanged()) {
                this.switchProvider();
                this.currentWeatherCache = undefined;
                this.forecastWeatherCache = undefined;
            }
            if (this.locationChanged()) {
                this.currentWeatherCache = undefined;
                this.forecastWeatherCache = undefined;
            }
            this.rebuildButtonMenu();
            this.parseWeatherCurrent();
        }));
    },

    loadConfigInterface: function() {
        this._settingsInterface = Convenience.getSettings(OPENWEATHER_DESKTOP_INTERFACE);
        this._settingsInterfaceC = this._settingsInterface.connect("changed", Lang.bind(this, function() {
            this.rebuildCurrentWeatherUi();
            this.rebuildFutureWeatherUi();
            if (this.providerChanged()) {
                this.switchProvider();
                this.currentWeatherCache = undefined;
                this.forecastWeatherCache = undefined;
            }
            if (this.locationChanged()) {
                this.currentWeatherCache = undefined;
                this.forecastWeatherCache = undefined;
            }
            this.parseWeatherCurrent();
        }));
    },

    _onNetworkStateChanged: function() {
        this._checkConnectionState();
    },

    _checkConnectionState: function() {
        if (this._timeoutCheckConnectionState) {
            Mainloop.source_remove(this._timeoutCheckConnectionState);
            this._timeoutCheckConnectionState = undefined;
        }

        let interval = 1250;
        this._oldConnected = this._connected;
        this._connected = false;

        this._timeoutCheckConnectionState = Mainloop.timeout_add(interval, Lang.bind(this, function() {
            // Delete (undefine) the variable holding the timeout-id, otherwise we can get errors, if we try to delete
            // it manually, the timeout will be destroyed automatically if we return false.
            // We just fetch it for the rare case, where the connection chages or the extension will be stopped during
            // the timeout.
            this._timeoutCheckConnectionState = undefined;
            let url = this.getWeatherProviderURL();
            let address = Gio.NetworkAddress.parse_uri(url, 80);
            let cancellable = Gio.Cancellable.new();
            try {
                this._network_monitor.can_reach_async(address, cancellable, Lang.bind(this, this._asyncReadyCallback));
            } catch (err) {
                let title = _("Can not connect to %s").format(url);
                log(title + '\n' + err.message);
            }
            return false;
        }));
    },

    _asyncReadyCallback: function(nm, res) {
        this._connected = this._network_monitor.can_reach_finish(res);
        if (!this._oldConnected && this._connected) {
            let now = new Date();
            if (_timeCacheCurrentWeather &&
                (Math.floor(new Date(now - _timeCacheCurrentWeather).getTime() / 1000) > this._refresh_interval_current))
                this.currentWeatherCache = undefined;
            if (_timeCacheForecastWeather &&
                (Math.floor(new Date(now - _timeCacheForecastWeather).getTime() / 1000) > this._refresh_interval_forecast))
                this.forecastWeatherCache = undefined;
            this.parseWeatherCurrent();
        }
    },

    locationChanged: function() {
        let location = this.extractCoord(this._city);
        if (this.oldLocation != location) {
            return true;
        }
        return false;
    },

    providerChanged: function() {
        let provider = this._weather_provider;
        if (this.oldProvider != provider) {
            this.oldProvider = provider;
            return true;
        }
        if (provider == WeatherProvider.OPENWEATHERMAP) {
            let useDefaultOwmKey = this._use_default_owm_key;
            if (this.oldUseDefaultOwmKey != useDefaultOwmKey) {
                this.oldUseDefaultOwmKey = useDefaultOwmKey;
                return true;
            }
        }
        if (provider == WeatherProvider.DARKSKY) {
            let translateCondition = this._translate_condition;
            if (this.oldTranslateCondition != translateCondition) {
                this.oldTranslateCondition = translateCondition;
                return true;
            }
        }
        return false;
    },

    get _clockFormat() {
        if (!this._settingsInterface)
            this.loadConfigInterface();
        return this._settingsInterface.get_string("clock-format");
    },

    get _weather_provider() {
        if (!this._settings)
            this.loadConfig();

        let provider = this.extractProvider(this._city);

        if (provider == WeatherProvider.DEFAULT)
            provider = this._settings.get_enum(OPENWEATHER_PROVIDER_KEY);

        return provider;
    },

    get _units() {
        if (!this._settings)
            this.loadConfig();
        return this._settings.get_enum(OPENWEATHER_UNIT_KEY);
    },

    get _wind_speed_units() {
        if (!this._settings)
            this.loadConfig();
        return this._settings.get_enum(OPENWEATHER_WIND_SPEED_UNIT_KEY);
    },

    get _wind_direction() {
        if (!this._settings)
            this.loadConfig();
        return this._settings.get_boolean(OPENWEATHER_WIND_DIRECTION_KEY);
    },

    get _pressure_units() {
        if (!this._settings)
            this.loadConfig();
        return this._settings.get_enum(OPENWEATHER_PRESSURE_UNIT_KEY);
    },

    get _cities() {
        if (!this._settings)
            this.loadConfig();
        return this._settings.get_string(OPENWEATHER_CITY_KEY);
    },

    set _cities(v) {
        if (!this._settings)
            this.loadConfig();
        return this._settings.set_string(OPENWEATHER_CITY_KEY, v);
    },

   _onButtonHoverChanged: function(actor, event) {
        if (actor.hover) {
            actor.add_style_pseudo_class('hover');
            actor.set_style(this._button_background_style);
        } else {
            actor.remove_style_pseudo_class('hover');
            actor.set_style('background-color:;');
            if (actor != this._urlButton)
                actor.set_style(this._button_border_style);
        }
    },

    _updateButtonColors: function() {
        if (!this._needsColorUpdate)
            return;
        this._needsColorUpdate = false;
        let color = this._separatorItem._separator.actor.get_theme_node().get_color('-gradient-end');

        let alpha = (Math.round(color.alpha / 2.55) / 100);

        if (color.red > 0 && color.green > 0 && color.blue > 0)
            this._button_border_style = 'border:1px solid rgb(' + Math.round(alpha * color.red) + ',' + Math.round(alpha * color.green) + ',' + Math.round(alpha * color.blue) + ');';
        else
            this._button_border_style = 'border:1px solid rgba(' + color.red + ',' + color.green + ',' + color.blue + ',' + alpha + ');';

        this._locationButton.set_style(this._button_border_style);
        this._reloadButton.set_style(this._button_border_style);
        this._prefsButton.set_style(this._button_border_style);

        this._buttonMenu.actor.add_style_pseudo_class('active');
        color = this._buttonMenu.actor.get_theme_node().get_background_color();
        this._button_background_style = 'background-color:rgba(' + color.red + ',' + color.green + ',' + color.blue + ',' + (Math.round(color.alpha / 2.55) / 100) + ');';
        this._buttonMenu.actor.remove_style_pseudo_class('active');
    },


    createButton: function(iconName, accessibleName) {
        let button;

        if (ExtensionUtils.versionCheck(['3.8'], Config.PACKAGE_VERSION)) {
            button = new St.Button({
                reactive: true,
                can_focus: true,
                track_hover: true,
                accessible_name: accessibleName,
                style_class: 'popup-menu-item openweather-button'
            });
            button.child = new St.Icon({
                icon_name: iconName
            });
            button.connect('notify::hover', Lang.bind(this, this._onButtonHoverChanged));
        } else
            button = Main.panel.statusArea.aggregateMenu._system._createActionButton(iconName, accessibleName);

        return button;
    },

    get _actual_city() {
        if (!this._settings)
            this.loadConfig();
        var a = this._settings.get_int(OPENWEATHER_ACTUAL_CITY_KEY);
        var b = a;
        var cities = this._cities.split(" && ");

        if (typeof cities != "object")
            cities = [cities];

        var l = cities.length - 1;

        if (a < 0)
            a = 0;

        if (l < 0)
            l = 0;

        if (a > l)
            a = l;

        return a;
    },

    set _actual_city(a) {
        if (!this._settings)
            this.loadConfig();
        var cities = this._cities.split(" && ");

        if (typeof cities != "object")
            cities = [cities];

        var l = cities.length - 1;

        if (a < 0)
            a = 0;

        if (l < 0)
            l = 0;

        if (a > l)
            a = l;

        this._settings.set_int(OPENWEATHER_ACTUAL_CITY_KEY, a);
    },

    get _city() {
        let cities = this._cities.split(" && ");
        if (cities && typeof cities == "string")
            cities = [cities];
        if (!cities[0])
            return "";
        cities = cities[this._actual_city];
        return cities;
    },

    get _translate_condition() {
        if (!this._settings)
            this.loadConfig();
        return this._settings.get_boolean(OPENWEATHER_TRANSLATE_CONDITION_KEY);
    },

    get _getIconType() {
        if (!this._settings)
            this.loadConfig();
        return this._settings.get_boolean(OPENWEATHER_USE_SYMBOLIC_ICONS_KEY) ? 1 : 0;
    },

    get _use_text_on_buttons() {
        if (!this._settings)
            this.loadConfig();
        return this._settings.get_boolean(OPENWEATHER_USE_TEXT_ON_BUTTONS_KEY) ? 1 : 0;
    },

    get _text_in_panel() {
        if (!this._settings)
            this.loadConfig();
        return this._settings.get_boolean(OPENWEATHER_SHOW_TEXT_IN_PANEL_KEY);
    },

    get _position_in_panel() {
        if (!this._settings)
            this.loadConfig();
        return this._settings.get_enum(OPENWEATHER_POSITION_IN_PANEL_KEY);
    },

    get _menu_alignment() {
        if (!this._settings)
            this.loadConfig();
        return this._settings.get_double(OPENWEATHER_MENU_ALIGNMENT_KEY);
    },

    get _comment_in_panel() {
        if (!this._settings)
            this.loadConfig();
        return this._settings.get_boolean(OPENWEATHER_SHOW_COMMENT_IN_PANEL_KEY);
    },

    get _comment_in_forecast() {
        if (!this._settings)
            this.loadConfig();
        return this._settings.get_boolean(OPENWEATHER_SHOW_COMMENT_IN_FORECAST_KEY);
    },

    get _refresh_interval_current() {
        if (!this._settings)
            this.loadConfig();
        let v = this._settings.get_int(OPENWEATHER_REFRESH_INTERVAL_CURRENT);
        return ((v >= 600) ? v : 600);
    },

    get _refresh_interval_forecast() {
        if (!this._settings)
            this.loadConfig();
        let v = this._settings.get_int(OPENWEATHER_REFRESH_INTERVAL_FORECAST);
        return ((v >= 600) ? v : 600);
    },

    get _loc_len_current() {
        if (!this._settings)
            this.loadConfig();
        let v = this._settings.get_int(OPENWEATHER_LOC_TEXT_LEN);
        return ((v > 0) ? v : 0);
    },

    get _center_forecast() {
        if (!this._settings)
            this.loadConfig();
        return this._settings.get_boolean(OPENWEATHER_CENTER_FORECAST_KEY);
    },

    get _days_forecast() {
        if (!this._settings)
            this.loadConfig();
        return this._settings.get_int(OPENWEATHER_DAYS_FORECAST);
    },

    get _decimal_places() {
        if (!this._settings)
            this.loadConfig();
        return this._settings.get_int(OPENWEATHER_DECIMAL_PLACES);
    },

    get _appid() {
        if (!this._settings)
            this.loadConfig();
        let key = '';
        if (this._use_default_owm_key)
            key = OPENWEATHER_OWM_DEFAULT_API_KEY;
        else
            key = this._settings.get_string(OPENWEATHER_OWM_API_KEY);
        return (key.length == 32) ? key : '';
    },

    get _use_default_owm_key() {
        if (!this._settings)
            this.loadConfig();
        return this._settings.get_boolean(OPENWEATHER_USE_DEFAULT_OWM_API_KEY);
    },

    get _appid_fc() {
        if (!this._settings)
            this.loadConfig();
        let key = this._settings.get_string(OPENWEATHER_FC_API_KEY);
        return (key.length == 32) ? key : '';
    },

    rebuildButtonMenu: function() {
        if (this._buttonBox) {
            if (this._buttonBox1) {
                this._buttonBox1.destroy();
                this._buttonBox1 = undefined;

            }
            if (this._buttonBox2) {
                this._buttonBox2.destroy();
                this._buttonBox2 = undefined;
            }
            this._buttonMenu.removeActor(this._buttonBox);
            this._buttonBox.destroy();
            this._buttonBox = undefined;
        }

        if (this._buttonBox1) {
            this._buttonBox1.destroy();
            this._buttonBox1 = undefined;
        }
        if (this._buttonBox2) {
            this._buttonBox2.destroy();
            this._buttonBox2 = undefined;
        }

        this._locationButton = this.createButton('find-location-symbolic', _("Locations"));
        if (this._use_text_on_buttons)
            this._locationButton.set_label(this._locationButton.get_accessible_name());

        this._locationButton.connect('clicked', Lang.bind(this, function() {
            if (ExtensionUtils.versionCheck(['3.8'], Config.PACKAGE_VERSION))
                this._selectCity.menu.toggle();
            else
                this._selectCity._setOpenState(!this._selectCity._getOpenState());
        }));
        this._buttonBox1 = new St.BoxLayout({
            style_class: 'openweather-button-box'
        });
        this._buttonBox1.add_actor(this._locationButton);

        this._reloadButton = this.createButton('view-refresh-symbolic', _("Reload Weather Information"));
        if (this._use_text_on_buttons)
            this._reloadButton.set_label(this._reloadButton.get_accessible_name());
        this._reloadButton.connect('clicked', Lang.bind(this, function() {
            this.currentWeatherCache = undefined;
            this.forecastWeatherCache = undefined;
            this.parseWeatherCurrent();
            this.recalcLayout();
        }));
        this._buttonBox1.add_actor(this._reloadButton);

        this._buttonBox2 = new St.BoxLayout({
            style_class: 'openweather-button-box'
        });

        this._urlButton = this.createButton('', _("Weather data provided by:") + (this._use_text_on_buttons ? "\n" : "  ") + this.weatherProvider);
        this._urlButton.set_label(this._urlButton.get_accessible_name());

        if (ExtensionUtils.versionCheck(['3.8'], Config.PACKAGE_VERSION)) {
            this._urlButton.connect('notify::hover', Lang.bind(this, this._onButtonHoverChanged));
            this._urlButton.style_class = 'popup-menu-item';
        }
        this._urlButton.style_class += ' openweather-provider';

        this._urlButton.connect('clicked', Lang.bind(this, function() {
            this.menu.actor.hide();
            let url = this.getWeatherProviderURL();

            try {
                Gtk.show_uri(null, url, global.get_current_time());
            } catch (err) {
                let title = _("Can not open %s").format(url);
                Main.notifyError(title, err.message);
            }
        }));

        this._buttonBox2.add_actor(this._urlButton);

        this._prefsButton = this.createButton('preferences-system-symbolic', _("Weather Settings"));
        if (this._use_text_on_buttons)
            this._prefsButton.set_label(this._prefsButton.get_accessible_name());
        this._prefsButton.connect('clicked', Lang.bind(this, this._onPreferencesActivate));
        this._buttonBox2.add_actor(this._prefsButton);

        if (ExtensionUtils.versionCheck(['3.8'], Config.PACKAGE_VERSION)) {
            this._buttonBox = new St.BoxLayout();
            this._buttonBox1.add_style_class_name('openweather-button-box-38');
            this._buttonBox2.add_style_class_name('openweather-button-box-38');
            this._buttonBox.add_actor(this._buttonBox1);
            this._buttonBox.add_actor(this._buttonBox2);

            this._buttonMenu.addActor(this._buttonBox);
            this._needsColorUpdate = true;
        } else {
            this._buttonMenu.actor.add_actor(this._buttonBox1);
            this._buttonMenu.actor.add_actor(this._buttonBox2);
        }
        this._buttonBox1MinWidth = undefined;
    },

    rebuildSelectCityItem: function() {
        this._selectCity.menu.removeAll();
        let item = null;

        let cities = this._cities;
        cities = cities.split(" && ");
        if (cities && typeof cities == "string")
            cities = [cities];
        if (!cities[0])
            return;

        for (let i = 0; cities.length > i; i++) {
            item = new PopupMenu.PopupMenuItem(this.extractLocation(cities[i]));
            item.location = i;
            if (i == this._actual_city) {
                if (ExtensionUtils.versionCheck(['3.8'], Config.PACKAGE_VERSION))
                    item.setShowDot(true);
                else
                    item.setOrnament(PopupMenu.Ornament.DOT);
            }

            this._selectCity.menu.addMenuItem(item);
            // override the items default onActivate-handler, to keep the ui open while chosing the location
            item.activate = this._onActivate;
        }

        if (cities.length == 1)
            this._selectCity.actor.hide();
        else
            this._selectCity.actor.show();

    },

    _onActivate: function() {
        openweatherMenu._actual_city = this.location;
    },

    extractLocation: function() {
        if (!arguments[0])
            return "";

        if (arguments[0].search(">") == -1)
            return _("Invalid city");
        return arguments[0].split(">")[1];
    },

    extractCoord: function() {
        let coords = 0;

        if (arguments[0] && (arguments[0].search(">") != -1))
            coords = arguments[0].split(">")[0].replace(' ', '');

        if ((coords.search(",") == -1) || isNaN(coords.split(",")[0]) || isNaN(coords.split(",")[1])) {
            Main.notify("Openweather", _("Invalid location! Please try to recreate it."));
            return 0;
        }

        return coords;
    },

    extractProvider: function() {
        if (!arguments[0])
            return -1;
        if (arguments[0].split(">")[2] === undefined)
            return -1;
        if (isNaN(parseInt(arguments[0].split(">")[2])))
            return -1;
        return parseInt(arguments[0].split(">")[2]);
    },

    _onPreferencesActivate: function() {
        this.menu.actor.hide();
        Util.spawn(["gnome-shell-extension-prefs", "openweather-extension@jenslody.de"]);
        return 0;
    },

    recalcLayout: function() {
        if (!this.menu.isOpen)
            return;
        if (ExtensionUtils.versionCheck(['3.8'], Config.PACKAGE_VERSION)) {
            this._updateButtonColors();
        }
        if (this._buttonBox1MinWidth === undefined)
            this._buttonBox1MinWidth = this._buttonBox1.get_width();
        this._buttonBox1.set_width(Math.max(this._buttonBox1MinWidth, this._currentWeather.get_width() - this._buttonBox2.get_width()));
        if (this._forecastScrollBox !== undefined && this._forecastBox !== undefined && this._currentWeather !== undefined) {
            this._forecastScrollBox.set_width(Math.max(this._currentWeather.get_width(), (this._buttonBox1.get_width() + this._buttonBox2.get_width())));
            this._forecastScrollBox.show();
            if (this._forecastBox.get_preferred_width(this._forecastBox.get_height())[0] > this._currentWeather.get_width()) {
                this._forecastScrollBox.hscroll.margin_top = 10;
                this._forecastScrollBox.hscroll.show();
            } else {
                this._forecastScrollBox.hscroll.margin_top = 0;
                this._forecastScrollBox.hscroll.hide();
            }
        }
    },

    unit_to_unicode: function() {
        if (this._units == WeatherUnits.FAHRENHEIT)
            return _('\u00B0F');
        else if (this._units == WeatherUnits.KELVIN)
            return _('K');
        else if (this._units == WeatherUnits.RANKINE)
            return _('\u00B0Ra');
        else if (this._units == WeatherUnits.REAUMUR)
            return _('\u00B0R\u00E9');
        else if (this._units == WeatherUnits.ROEMER)
            return _('\u00B0R\u00F8');
        else if (this._units == WeatherUnits.DELISLE)
            return _('\u00B0De');
        else if (this._units == WeatherUnits.NEWTON)
            return _('\u00B0N');
        else
            return _('\u00B0C');
    },

    hasIcon: function(icon) {
        return Gtk.IconTheme.get_default().has_icon(icon);
    },

    toFahrenheit: function(t) {
        return ((Number(t) * 1.8) + 32).toFixed(this._decimal_places);
    },

    toKelvin: function(t) {
        return (Number(t) + 273.15).toFixed(this._decimal_places);
    },

    toRankine: function(t) {
        return ((Number(t) * 1.8) + 491.67).toFixed(this._decimal_places);
    },

    toReaumur: function(t) {
        return (Number(t) * 0.8).toFixed(this._decimal_places);
    },

    toRoemer: function(t) {
        return ((Number(t) * 21 / 40) + 7.5).toFixed(this._decimal_places);
    },

    toDelisle: function(t) {
        return ((100 - Number(t)) * 1.5).toFixed(this._decimal_places);
    },

    toNewton: function(t) {
        return (Number(t) - 0.33).toFixed(this._decimal_places);
    },

    toInHg: function(p /*, t*/ ) {
        return (p / 33.86530749).toFixed(this._decimal_places);
    },

    toBeaufort: function(w, t) {
        if (w < 0.3)
            return (!t) ? "0" : "(" + _("Calm") + ")";

        else if (w >= 0.3 && w <= 1.5)
            return (!t) ? "1" : "(" + _("Light air") + ")";

        else if (w > 1.5 && w <= 3.4)
            return (!t) ? "2" : "(" + _("Light breeze") + ")";

        else if (w > 3.4 && w <= 5.4)
            return (!t) ? "3" : "(" + _("Gentle breeze") + ")";

        else if (w > 5, 4 && w <= 7.9)
            return (!t) ? "4" : "(" + _("Moderate breeze") + ")";

        else if (w > 7.9 && w <= 10.7)
            return (!t) ? "5" : "(" + _("Fresh breeze") + ")";

        else if (w > 10.7 && w <= 13.8)
            return (!t) ? "6" : "(" + _("Strong breeze") + ")";

        else if (w > 13.8 && w <= 17.1)
            return (!t) ? "7" : "(" + _("Moderate gale") + ")";

        else if (w > 17.1 && w <= 20.7)
            return (!t) ? "8" : "(" + _("Fresh gale") + ")";

        else if (w > 20.7 && w <= 24.4)
            return (!t) ? "9" : "(" + _("Strong gale") + ")";

        else if (w > 24.4 && w <= 28.4)
            return (!t) ? "10" : "(" + _("Storm") + ")";

        else if (w > 28.4 && w <= 32.6)
            return (!t) ? "11" : "(" + _("Violent storm") + ")";

        else
            return (!t) ? "12" : "(" + _("Hurricane") + ")";
    },

    getLocaleDay: function(abr) {
        let days = [_('Sunday'), _('Monday'), _('Tuesday'), _('Wednesday'), _('Thursday'), _('Friday'), _('Saturday')];
        return days[abr];
    },

    getWindDirection: function(deg) {
        let arrows = ["\u2193", "\u2199", "\u2190", "\u2196", "\u2191", "\u2197", "\u2192", "\u2198"];
        let letters = [_('N'), _('NE'), _('E'), _('SE'), _('S'), _('SW'), _('W'), _('NW')];
        let idx = Math.round(deg / 45) % arrows.length;
        return (this._wind_direction) ? arrows[idx] : letters[idx];
    },

    getIconType: function() {
            if (this._getIconType) {
            return "openweather-symbolic";
            } else {
            return "openweather-regular";
        }
    },

    load_json_async: function(url, params, fun) {
        if (_httpSession === undefined) {
            _httpSession = new Soup.Session();
            _httpSession.user_agent = this.user_agent;
        } else {
            // abort previous requests.
            _httpSession.abort();
        }

        let message = Soup.form_request_new_from_hash('GET', url, params);

        _httpSession.queue_message(message, Lang.bind(this, function(_httpSession, message) {
            try {
                if (!message.response_body.data) {
                    fun.call(this, 0);
                    return;
                }
                let jp = JSON.parse(message.response_body.data);
                fun.call(this, jp);
            } catch (e) {
                fun.call(this, 0);
                return;
            }
        }));
        return;
    },

    checkAlignment: function() {
        let menuAlignment = 1.0 - (this._menu_alignment / 100);
        if (Clutter.get_default_text_direction() == Clutter.TextDirection.RTL)
            menuAlignment = 1.0 - menuAlignment;
        this.menu._arrowAlignment=menuAlignment;
    },

    checkPositionInPanel: function() {
        if (this._old_position_in_panel != this._position_in_panel) {
            switch (this._old_position_in_panel) {
                case WeatherPosition.LEFT:
                    Main.panel._leftBox.remove_actor(this.actor);
                    break;
                case WeatherPosition.CENTER:
                    Main.panel._centerBox.remove_actor(this.actor);
                    break;
                case WeatherPosition.RIGHT:
                    Main.panel._rightBox.remove_actor(this.actor);
                    break;
            }

            let children = null;
            switch (this._position_in_panel) {
                case WeatherPosition.LEFT:
                    children = Main.panel._leftBox.get_children();
                    Main.panel._leftBox.insert_child_at_index(this.actor, children.length);
                    break;
                case WeatherPosition.CENTER:
                    children = Main.panel._centerBox.get_children();
                    Main.panel._centerBox.insert_child_at_index(this.actor, children.length);
                    break;
                case WeatherPosition.RIGHT:
                    children = Main.panel._rightBox.get_children();
                    Main.panel._rightBox.insert_child_at_index(this.actor, 0);
                    break;
            }
            this._old_position_in_panel = this._position_in_panel;
        }

    },

    formatPressure: function(pressure) {
        let pressure_unit = _('hPa');
        switch (this._pressure_units) {
            case WeatherPressureUnits.INHG:
                pressure = this.toInHg(pressure);
                pressure_unit = _("inHg");
                break;

            case WeatherPressureUnits.HPA:
                pressure = pressure.toFixed(this._decimal_places);
                pressure_unit = _("hPa");
                break;

            case WeatherPressureUnits.BAR:
                pressure = (pressure / 1000).toFixed(this._decimal_places);
                pressure_unit = _("bar");
                break;

            case WeatherPressureUnits.PA:
                pressure = (pressure * 100).toFixed(this._decimal_places);
                pressure_unit = _("Pa");
                break;

            case WeatherPressureUnits.KPA:
                pressure = (pressure / 10).toFixed(this._decimal_places);
                pressure_unit = _("kPa");
                break;

            case WeatherPressureUnits.ATM:
                pressure = (pressure * 0.000986923267).toFixed(this._decimal_places);
                pressure_unit = _("atm");
                break;

            case WeatherPressureUnits.AT:
                pressure = (pressure * 0.00101971621298).toFixed(this._decimal_places);
                pressure_unit = _("at");
                break;

            case WeatherPressureUnits.TORR:
                pressure = (pressure * 0.750061683).toFixed(this._decimal_places);
                pressure_unit = _("Torr");
                break;

            case WeatherPressureUnits.PSI:
                pressure = (pressure * 0.0145037738).toFixed(this._decimal_places);
                pressure_unit = _("psi");
                break;

            case WeatherPressureUnits.MMHG:
                pressure = (pressure * 0.750061683).toFixed(this._decimal_places);
                pressure_unit = _("mmHg");
                break;

            case WeatherPressureUnits.MBAR:
                pressure = pressure.toFixed(this._decimal_places);
                pressure_unit = _("mbar");
                break;
        }
        return parseFloat(pressure).toLocaleString(this.locale) + ' ' + pressure_unit;
    },

    formatTemperature: function(temperature) {
        switch (this._units) {
            case WeatherUnits.FAHRENHEIT:
                temperature = this.toFahrenheit(temperature);
                break;

            case WeatherUnits.CELSIUS:
                temperature = temperature.toFixed(this._decimal_places);
                break;

            case WeatherUnits.KELVIN:
                temperature = this.toKelvin(temperature);
                break;

            case WeatherUnits.RANKINE:
                temperature = this.toRankine(temperature);
                break;

            case WeatherUnits.REAUMUR:
                temperature = this.toReaumur(temperature);
                break;

            case WeatherUnits.ROEMER:
                temperature = this.toRoemer(temperature);
                break;

            case WeatherUnits.DELISLE:
                temperature = this.toDelisle(temperature);
                break;

            case WeatherUnits.NEWTON:
                temperature = this.toNewton(temperature);
                break;
        }
        return parseFloat(temperature).toLocaleString(this.locale) + ' ' + this.unit_to_unicode();
    },

    formatWind: function(speed, direction) {
        let unit = _('m/s');
        switch (this._wind_speed_units) {
            case WeatherWindSpeedUnits.MPH:
                speed = (speed * OPENWEATHER_CONV_MPS_IN_MPH).toFixed(this._decimal_places);
                unit = _('mph');
                break;

            case WeatherWindSpeedUnits.KPH:
                speed = (speed * OPENWEATHER_CONV_MPS_IN_KPH).toFixed(this._decimal_places);
                unit = _('km/h');
                break;

            case WeatherWindSpeedUnits.MPS:
                speed = speed.toFixed(this._decimal_places);
                break;

            case WeatherWindSpeedUnits.KNOTS:
                speed = (speed * OPENWEATHER_CONV_MPS_IN_KNOTS).toFixed(this._decimal_places);
                unit = _('kn');
                break;

            case WeatherWindSpeedUnits.FPS:
                speed = (speed * OPENWEATHER_CONV_MPS_IN_FPS).toFixed(this._decimal_places);
                unit = _('ft/s');
                break;

            case WeatherWindSpeedUnits.BEAUFORT:
                speed = this.toBeaufort(speed);
                unit = this.toBeaufort(speed, true);
                break;

        }

        if (!speed)
            return '\u2013';
        else if (speed === 0 || !direction)
            return parseFloat(speed).toLocaleString(this.locale) + ' ' + unit;
        else // i.e. speed > 0 && direction
            return direction + ' ' + parseFloat(speed).toLocaleString(this.locale) + ' ' + unit;
    },

    reloadWeatherCurrent: function(interval) {
        if (this._timeoutCurrent) {
            Mainloop.source_remove(this._timeoutCurrent);
            this._timeoutCurrent = undefined;
        }
        _timeCacheCurrentWeather = new Date();
        this._timeoutCurrent = Mainloop.timeout_add_seconds(interval, Lang.bind(this, function() {
            // only invalidate cached data, if we can connect the weather-providers server
            if (this._connected && !this._idle)
                this.currentWeatherCache = undefined;
            this.parseWeatherCurrent();
            return true;
        }));
    },

    reloadWeatherForecast: function(interval) {
        if (this._timeoutForecast) {
            Mainloop.source_remove(this._timeoutForecast);
            this._timeoutForecast = undefined;
        }
        _timeCacheForecastWeather = new Date();
        this._timeoutForecast = Mainloop.timeout_add_seconds(interval, Lang.bind(this, function() {
            // only invalidate cached data, if we can connect the weather-providers server
            if (this._connected && !this._idle)
                this.forecastWeatherCache = undefined;
            this.parseWeatherForecast();
            return true;
        }));
    },

    destroyCurrentWeather: function() {
        if (this._currentWeather.get_child() !== null)
            this._currentWeather.get_child().destroy();
    },

    destroyFutureWeather: function() {
        if (this._futureWeather.get_child() !== null)
            this._futureWeather.get_child().destroy();
    },

    rebuildCurrentWeatherUi: function() {
        this._weatherInfo.text = (' ');
        this._weatherIcon.icon_name = 'view-refresh';
        this._weatherIcon.remove_style_class_name('openweather-regular');
        this._weatherIcon.remove_style_class_name('openweather-symbolic');
        this._weatherIcon.add_style_class_name(this.getIconType());

        this.destroyCurrentWeather();

        // This will hold the icon for the current weather
        this._currentWeatherIcon = new St.Icon({
            icon_size: 72,
            icon_name: 'view-refresh',
            style_class: 'system-menu-action openweather-current-icon ' + this.getIconType()
        });

        this._sunriseIcon = new St.Icon({
            icon_size: 15,
            icon_name: 'weather-clear',
            style_class: 'openweather-sunrise-icon ' + this.getIconType()
        });

        this._sunsetIcon = new St.Icon({
            icon_size: 15,
            icon_name: 'weather-clear-night',
            style_class: 'openweather-sunset-icon ' + this.getIconType()
        });

        this._buildIcon = new St.Icon({
            icon_size: 15,
            icon_name: 'view-refresh',
            style_class: 'openweather-build-icon ' + this.getIconType()
        });

        // The summary of the current weather
        this._currentWeatherSummary = new St.Label({
            text: _('Loading ...'),
            style_class: 'openweather-current-summary'
        });
        this._currentWeatherLocation = new St.Label({
            text: _('Please wait')
        });

        let bb = new St.BoxLayout({
            vertical: true,
            style_class: 'system-menu-action openweather-current-summarybox'
        });
        bb.add_actor(this._currentWeatherLocation);
        bb.add_actor(this._currentWeatherSummary);

        this._currentWeatherSunrise = new St.Label({
            text: '-'
        });
        this._currentWeatherSunset = new St.Label({
            text: '-'
        });
        this._currentWeatherBuild = new St.Label({
            text: '-'
        });

        let ab = new St.BoxLayout({
            style_class: 'openweather-current-infobox'
        });

        ab.add_actor(this._sunriseIcon);
        ab.add_actor(this._currentWeatherSunrise);
        ab.add_actor(this._sunsetIcon);
        ab.add_actor(this._currentWeatherSunset);
        ab.add_actor(this._buildIcon);
        ab.add_actor(this._currentWeatherBuild);
        bb.add_actor(ab);

        // Other labels
        this._currentWeatherCloudiness = new St.Label({
            text: '...'
        });
        this._currentWeatherHumidity = new St.Label({
            text: '...'
        });
        this._currentWeatherPressure = new St.Label({
            text: '...'
        });
        this._currentWeatherWind = new St.Label({
            text: '...'
        });

        let rb = new St.BoxLayout({
            style_class: 'openweather-current-databox'
        });
        let rb_captions = new St.BoxLayout({
            vertical: true,
            style_class: 'popup-menu-item popup-status-menu-item openweather-current-databox-captions'
        });
        let rb_values = new St.BoxLayout({
            vertical: true,
            style_class: 'system-menu-action openweather-current-databox-values'
        });
        rb.add_actor(rb_captions);
        rb.add_actor(rb_values);

        rb_captions.add_actor(new St.Label({
            text: _('Cloudiness:')
        }));
        rb_values.add_actor(this._currentWeatherCloudiness);
        rb_captions.add_actor(new St.Label({
            text: _('Humidity:')
        }));
        rb_values.add_actor(this._currentWeatherHumidity);
        rb_captions.add_actor(new St.Label({
            text: _('Pressure:')
        }));
        rb_values.add_actor(this._currentWeatherPressure);
        rb_captions.add_actor(new St.Label({
            text: _('Wind:')
        }));
        rb_values.add_actor(this._currentWeatherWind);

        let xb = new St.BoxLayout();
        xb.add_actor(bb);
        xb.add_actor(rb);

        let box = new St.BoxLayout({
            style_class: 'openweather-current-iconbox'
        });
        box.add_actor(this._currentWeatherIcon);
        box.add_actor(xb);
        this._currentWeather.set_child(box);
    },

    scrollForecastBy: function(delta) {
        if (this._forecastScrollBox === undefined)
            return;
        this._forecastScrollBox.hscroll.adjustment.value += delta;
    },

    rebuildFutureWeatherUi: function(cnt) {
        this.destroyFutureWeather();

        this._forecast = [];
        this._forecastBox = new St.BoxLayout({
            x_align: this._center_forecast ? St.Align.END : St.Align.START,
            style_class: 'openweather-forecast-box'
        });

        this._forecastScrollBox = new St.ScrollView({
            style_class: 'openweather-forecasts'
        });

        let pan = new Clutter.PanAction({
            interpolate: true
        });
        pan.connect('pan', Lang.bind(this, function(action) {

            let[dist, dx, dy] = action.get_motion_delta(0);

            this.scrollForecastBy(-1 * (dx / this._forecastScrollBox.width) * this._forecastScrollBox.hscroll.adjustment.page_size);
            return false;
        }));
        this._forecastScrollBox.add_action(pan);

        this._forecastScrollBox.connect('scroll-event', Lang.bind(this, this._onScroll));
        this._forecastScrollBox.hscroll.connect('scroll-event', Lang.bind(this, this._onScroll));

        this._forecastScrollBox.hscroll.margin_right = 25;
        this._forecastScrollBox.hscroll.margin_left = 25;
        this._forecastScrollBox.hscroll.hide();
        this._forecastScrollBox.vscrollbar_policy = Gtk.PolicyType.NEVER;
        this._forecastScrollBox.hscrollbar_policy = Gtk.PolicyType.AUTOMATIC;
        this._forecastScrollBox.enable_mouse_scrolling = true;
        this._forecastScrollBox.hide();

        this._futureWeather.set_child(this._forecastScrollBox);

        if (cnt === undefined)
            cnt = this._days_forecast;
        for (let i = 0; i < cnt; i++) {
            let forecastWeather = {};

            forecastWeather.Icon = new St.Icon({
                icon_size: 48,
                icon_name: 'view-refresh',
                style_class: 'system-menu-action openweather-forecast-icon ' + this.getIconType()
            });
            forecastWeather.Day = new St.Label({
                style_class: 'popup-menu-item popup-status-menu-item openweather-forecast-day'
            });
            forecastWeather.Summary = new St.Label({
                style_class: 'system-menu-action  openweather-forecast-summary'
            });
            forecastWeather.Summary.clutter_text.line_wrap = true;
            forecastWeather.Temperature = new St.Label({
                style_class: 'system-menu-action  openweather-forecast-temperature'
            });

            let by = new St.BoxLayout({
                vertical: true,
                style_class: 'openweather-forecast-databox'
            });
            by.add_actor(forecastWeather.Day);
            if (this._comment_in_forecast)
                by.add_actor(forecastWeather.Summary);
            by.add_actor(forecastWeather.Temperature);

            let bb = new St.BoxLayout({
                style_class: 'openweather-forecast-iconbox'
            });
            bb.add_actor(forecastWeather.Icon);
            bb.add_actor(by);

            this._forecast[i] = forecastWeather;
            this._forecastBox.add_actor(bb);
        }
        this._forecastScrollBox.add_actor(this._forecastBox);
    },

    _onScroll: function(actor, event) {
        let dx = 0;
        let dy = 0;
        switch (event.get_scroll_direction()) {
            case Clutter.ScrollDirection.UP:
            case Clutter.ScrollDirection.RIGHT:
                dy = -1;
                break;
            case Clutter.ScrollDirection.DOWN:
            case Clutter.ScrollDirection.LEFT:
                dy = 1;
                break;
            default:
                return true;
        }

        this.scrollForecastBy(dy * this._forecastScrollBox.hscroll.adjustment.stepIncrement);
        return false;
    }
});

let openweatherMenu;

function init() {
    Convenience.initTranslations('gnome-shell-extension-openweather');
}

function enable() {
    openweatherMenu = new OpenweatherMenuButton();
    Main.panel.addToStatusArea('openweatherMenu', openweatherMenu);
}

function disable() {
    openweatherMenu.stop();
    openweatherMenu.destroy();
}
