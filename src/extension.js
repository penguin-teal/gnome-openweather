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
import Clutter from "gi://Clutter";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import GObject from "gi://GObject";
import St from "gi://St";

import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

import * as GnomeSession from "resource:///org/gnome/shell/misc/gnomeSession.js";

import * as OpenWeatherMap from "./openweathermap.js";
import {
  WeatherUnits,
  WeatherWindSpeedUnits,
  WeatherPressureUnits,
  WeatherPosition,
  HiContrastStyle,
  ClockFormat
} from "./constants.js";

import {
  freeSoup,
  getSoupSession,
  setLocationRefreshIntervalM,
  getLocationInfo,
  getCachedLocInfo
} from "./location.js"

let _firstBoot = 1;
let _timeCacheCurrentWeather;
let _timeCacheForecastWeather;
let _isFirstRun = null;
let _freezeSettingsChanged = false;
let _systemClockFormat = 1;

class OpenWeatherMenuButton extends PanelMenu.Button {
  static {
    GObject.registerClass(this);
  }

  _addWeatherToBox(topBox)
  {
    this._weatherIcon = new St.Icon({
      icon_name: "view-refresh-symbolic",
      style_class: "system-status-icon openweather-icon",
    });
    this._weatherInfo = new St.Label({
      style_class: "openweather-label",
      text: "...",
      y_align: Clutter.ActorAlign.CENTER,
      y_expand: true,
    });

    topBox.add_child(this._weatherIcon);
    topBox.add_child(this._weatherInfo);
  }

  _addSunToBox(topBox)
  {
    let timeHrs = new Date().getHours();
    let isProbDay = timeHrs >= 6 && timeHrs <= 19;

    this.topBoxSunIcon = new St.Icon({
      icon_name: isProbDay ? "daytime-sunset-symbolic" : "daytime-sunrise-symbolic",
      style_class: "system-status-icon openweather-icon"
    });
    this.topBoxSunInfo = new St.Label({
      text: "...",
      y_align: Clutter.ActorAlign.CENTER,
      y_expand: true
    });
    if(!this._show_sunriseset_in_panel)
    {
      this.topBoxSunIcon.hide();
      this.topBoxSunInfo.hide();
    }

    topBox.add_child(this.topBoxSunIcon);
    topBox.add_child(this.topBoxSunInfo);
  }

  _init(metadata, settings) {
    super._init(0, "OpenWeatherMenuButton", false);
    this.settings = settings;
    this.metadata = metadata;

    // Putting the panel item together
    let topBox = new St.BoxLayout({
      style_class: "panel-status-menu-box",
    });

    if(this._sun_in_panel_first)
    {
      this._addSunToBox(topBox);
      this._addWeatherToBox(topBox);
    }
    else
    {
      this._addWeatherToBox(topBox);
      this._addSunToBox(topBox);
    }

    this.add_child(topBox);
    if (Main.panel._menus === undefined)
      Main.panel.menuManager.addMenu(this.menu);
    else Main.panel._menus.addMenu(this.menu);

    this.loadConfig().then(() =>
    {
      //
      // Setup network things
      this._idle = false;
      this._connected = false;
      this._network_monitor = Gio.network_monitor_get_default();

      // Bind signals
      this._presence = new GnomeSession.Presence((proxy, error) => {
        this._onStatusChanged(proxy.status);
      });
      this._presence_connection = this._presence.connectSignal(
        "StatusChanged",
        (proxy, senderName, [status]) => {
          this._onStatusChanged(status);
        }
      );
      this._network_monitor_connection = this._network_monitor.connect(
        "network-changed",
        this._onNetworkStateChanged.bind(this)
      );

      this.menu.connect("open-state-changed", this.recalcLayout.bind(this));

      let _firstBootWait = this._startupDelay;
      if (_firstBoot && _firstBootWait !== 0) {
        // Delay popup initialization and data fetch on the first
        // extension load, ie: first log in / restart gnome shell
        this._timeoutFirstBoot = GLib.timeout_add_seconds(
          GLib.PRIORITY_DEFAULT,
          _firstBootWait,
          () => {
            this._checkConnectionState();
            this.initOpenWeatherUI();
            _firstBoot = 0;
            this._timeoutFirstBoot = null;
            return false; // run timer once then destroy
          }
        );
      } else {
        this._checkConnectionState();
        this.initOpenWeatherUI();
      }
    }, (e) =>
    {
      console.error(`OpenWeather Refined: Error '${e}' in loadConfig.`);
      Main.notify("OpenWeather Refined", "Failed to initialize.");
    });
  }

  initOpenWeatherUI() {
    this.owmCityId = 0;
    this.useOpenWeatherMap();
    this.checkPositionInPanel();

    this._currentWeather = new PopupMenu.PopupBaseMenuItem({
      reactive: false,
    });
    if (!this._isForecastDisabled) {
      this._currentForecast = new PopupMenu.PopupBaseMenuItem({
        reactive: false,
      });
      if (this._forecastDays !== 0) {
        this._forecastExpander = new PopupMenu.PopupSubMenuMenuItem("");
      }
    }
    this._buttonMenu = new PopupMenu.PopupBaseMenuItem({
      reactive: false,
      style_class: "openweather-menu-button-container",
    });
    this._selectCity = new PopupMenu.PopupSubMenuMenuItem("");
    this._selectCity.actor.set_height(0);
    this._selectCity._triangle.set_height(0);

    this.rebuildCurrentWeatherUi();
    this.rebuildFutureWeatherUi();
    this.rebuildButtonMenu();
    this.rebuildSelectCityItem();

    this.menu.addMenuItem(this._currentWeather);
    if (!this._isForecastDisabled) {
      this.menu.addMenuItem(this._currentForecast);
      if (this._forecastDays !== 0) {
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addMenuItem(this._forecastExpander);
      }
    }
    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    this.menu.addMenuItem(this._buttonMenu);
    this.menu.addMenuItem(this._selectCity);
    this.checkAlignment();
  }

  _onStatusChanged(status) {
    this._idle = false;

    if (status === GnomeSession.PresenceStatus.IDLE) {
      this._idle = true;
    }
  }

  stop()
  {
    freeSoup();

    if (this._timeoutCurrent) {
      GLib.source_remove(this._timeoutCurrent);
      this._timeoutCurrent = null;
    }
    if (this._timeoutForecast) {
      GLib.source_remove(this._timeoutForecast);
      this._timeoutForecast = null;
    }
    if (this._timeoutFirstBoot) {
      GLib.source_remove(this._timeoutFirstBoot);
      this._timeoutFirstBoot = null;
    }

    if (this._timeoutMenuAlignent) {
      GLib.source_remove(this._timeoutMenuAlignent);
      this._timeoutMenuAlignent = null;
    }

    if (this._timeoutCheckConnectionState) {
      GLib.source_remove(this._timeoutCheckConnectionState);
      this._timeoutCheckConnectionState = null;
    }

    if (this._presence_connection) {
      this._presence.disconnectSignal(this._presence_connection);
      this._presence_connection = undefined;
    }

    if (this._network_monitor_connection) {
      this._network_monitor.disconnect(this._network_monitor_connection);
      this._network_monitor_connection = undefined;
    }

    if (this._settingsC) {
      this.settings.disconnect(this._settingsC);
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
  }

  useOpenWeatherMap() {
    this.initWeatherData = OpenWeatherMap.initWeatherData;
    this.reloadWeatherCache = OpenWeatherMap.reloadWeatherCache;
    this.refreshWeatherData = OpenWeatherMap.refreshWeatherData;
    this.populateCurrentUI = OpenWeatherMap.populateCurrentUI;

    if (!this._isForecastDisabled) {
      this.refreshForecastData = OpenWeatherMap.refreshForecastData;
      this.populateTodaysUI = OpenWeatherMap.populateTodaysUI;
      this.populateForecastUI = OpenWeatherMap.populateForecastUI;
      this.processTodaysData = OpenWeatherMap.processTodaysData;
      this.processForecastData = OpenWeatherMap.processForecastData;
    }
    this.loadJsonAsync = OpenWeatherMap.loadJsonAsync;
    this.weatherProvider = "OpenWeatherMap";

    if (this._appid.toString().trim() === "")
      Main.notify(
        "OpenWeather Refined",
        _(
          "Openweathermap.org does not work without an api-key.\nEither set the switch to use the extensions default key in the preferences dialog to on or register at https://openweathermap.org/appid and paste your personal key into the preferences dialog."
        )
      );
  }

  getWeatherProviderURL() {
    let url = "https://openweathermap.org";
    if(this.owmCityId) url += "/city/" + this.owmCityId;
    return url;
  }


  isFirstRun(forceRecalc = false)
  {
    if(_isFirstRun === null || forceRecalc)
    {
      _isFirstRun = !this.settings.get_boolean("has-run");
      if(_isFirstRun)
      {
        this.freezeSettingsChanged();
        this.settings.set_boolean("has-run", true);
        this.unfreezeSettingsChanged();
      }
    }
    return _isFirstRun;
  }

  freezeSettingsChanged()
  {
    _freezeSettingsChanged = true;
  }

  unfreezeSettingsChanged()
  {
    _freezeSettingsChanged = false;
  }

  hasBattery()
  {
    let batt = Gio.File.new_for_path("/sys/class/power_supply/BAT0");
    return batt.query_exists(null);
  }

  async getDefaultCity()
  {
    if(this.hasBattery()) return "here>>0";
    else
    {
      let loc = await getLocationInfo();
      if(!loc) return "here>>0";

      let placeName;
      if(loc.country === "United States") placeName = `${loc.city}, ${loc.state}`;
      else `${loc.city}, ${loc.country}`;

      return `${loc.lat},${loc.lon}>${placeName}>0`;
    }
  }

  async firstRunSetDefaults(extension)
  {
    if(this.isFirstRun(true))
    {
      this.freezeSettingsChanged();

      let locInfo = await getLocationInfo();

      if(locInfo && locInfo.country === "United States")
      {
        this.settings.set_enum("unit", WeatherUnits.FAHRENHEIT);
        this.settings.set_enum("wind-speed-unit", WeatherWindSpeedUnits.MPH);
        this.settings.set_enum("pressure-unit", WeatherPressureUnits.INHG);
      }

      let defCity = await this.getDefaultCity();
      if(this.settings.get_string("city") !== defCity)
      {
        this.settings.set_string("city", defCity);
      }

      this.unfreezeSettingsChanged();
    }
  }

  bindSettingsChanged()
  {
    this._settingsC = this.settings.connect("changed", async () =>
    {
      if(_freezeSettingsChanged || this.settings.get_boolean("frozen")) return;

      try
      {
        await this.firstRunSetDefaults();
      }
      catch(e)
      {
        console.error(`OpenWeather Refined: Error '${e}' in firstRunSetDefaults.`);
      }

      setLocationRefreshIntervalM(this.settings.get_double("loc-refresh-interval"));

      // Sunrise/sunset in panel
      if(this._show_sunriseset_in_panel)
      {
        this.topBoxSunIcon.show();
        this.topBoxSunInfo.show();
      }
      else
      {
        this.topBoxSunIcon.hide();
        this.topBoxSunInfo.hide();
      }

      let gnomeSettings = Gio.Settings.new("org.gnome.desktop.interface");
      _systemClockFormat = gnomeSettings.get_enum("clock-format");
      
      if (this.disableForecastChanged())
      {
        let _children = this._isForecastDisabled ? 4 : 7;
        if (this._forecastDays === 0) {
          _children = this.menu.box.get_children().length - 1;
        }
        for (let i = 0; i < _children; i++) {
          this.menu.box.get_child_at_index(0).destroy();
        }
        this._isForecastDisabled = this._disable_forecast;
        this.initOpenWeatherUI();
        this._clearWeatherCache();
        this.initWeatherData();
        return;
      }
      else if (await this.locationChanged())
      {
        if (this._cities.length === 0)
          this._cities = await this.getDefaultCity();

        this.showRefreshing();
        if (this._selectCity._getOpenState()) this._selectCity.menu.toggle();
        this._currentLocation = await this.extractCoord(this._city);
        this.rebuildSelectCityItem();
        this._clearWeatherCache();
        this.initWeatherData();
        return;
      }
      else
      {
        if (this.menuAlignmentChanged())
        {
          if (this._timeoutMenuAlignent)
            GLib.source_remove(this._timeoutMenuAlignent);
          // Use 1 second timeout to avoid crashes and spamming
          // the logs while changing the slider position in prefs
          this._timeoutMenuAlignent = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            1000,
            () => {
              this.checkAlignment();
              this._currentAlignment = this._menu_alignment;
              this._timeoutMenuAlignent = null;
              return false; // run once then destroy
            }
          );
          return;
        }
        else if (this._forecastDays !== this._days_forecast)
        {
          let _oldDays = this._forecastDays;
          let _newDays = this._days_forecast;
          this._forecastDays = _newDays;

          if (_oldDays >= 1 && _newDays === 0) {
            this._forecastExpander.destroy();
            return;
          } else if (_oldDays === 0 && _newDays >= 1) {
            let _children = this.menu.box.get_children().length - 1;
            for (let i = 0; i < _children; i++) {
              this.menu.box.get_child_at_index(0).destroy();
            }
            this._clearWeatherCache();
            this.initOpenWeatherUI();
            this.initWeatherData();
            return;
          } else {
            this.forecastJsonCache = undefined;
            this.rebuildFutureWeatherUi();
            this.reloadWeatherCache();
            return;
          }
        }
        else if (this._providerTranslations !== this._provider_translations)
        {
          this._providerTranslations = this._provider_translations;
          if (this._providerTranslations) {
            this.showRefreshing();
            this._clearWeatherCache();
            this.initWeatherData();
          } else {
            this.reloadWeatherCache();
          }
          return;
        }
        this.checkAlignment();
        this.checkPositionInPanel();
        this.rebuildCurrentWeatherUi();
        this.rebuildFutureWeatherUi();
        this.rebuildButtonMenu();
        this.reloadWeatherCache();
      }
      return;
    });
  }

  async loadConfig() {
    if (this._cities.length === 0)
      this._cities = await this.getDefaultCity();

    await this.firstRunSetDefaults();

    setLocationRefreshIntervalM(this.settings.get_double("loc-refresh-interval"));

    let gnomeSettings = Gio.Settings.new("org.gnome.desktop.interface");
    _systemClockFormat = gnomeSettings.get_enum("clock-format");

    this._currentLocation = await this.extractCoord(this._city);
    this._isForecastDisabled = this._disable_forecast;
    this._forecastDays = this._days_forecast;
    this._currentAlignment = this._menu_alignment;
    this._providerTranslations = this._provider_translations;

    // Get locale
    this.locale = GLib.get_language_names()[0];
    if (this.locale.indexOf("_") !== -1)
      this.locale = this.locale.split("_")[0];
    // Fallback for 'C', 'C.UTF-8', and unknown locales.
    else this.locale = "en";

    this.bindSettingsChanged();
  }

  loadConfigInterface()
  {
    this._settingsInterfaceC = this.settings.connect("changed", async () => {
      this.rebuildCurrentWeatherUi();
      this.rebuildFutureWeatherUi();
      if (await this.locationChanged()) {
        this.rebuildSelectCityItem();
        this._clearWeatherCache();
        this.initWeatherData();
      } else {
        this.reloadWeatherCache();
      }
    });
  }

  _clearWeatherCache() {
    this.currentWeatherCache = undefined;
    this.todaysWeatherCache = undefined;
    this.forecastWeatherCache = undefined;
    this.forecastJsonCache = undefined;
  }

  _onNetworkStateChanged() {
    this._checkConnectionState();
  }

  _checkConnectionState() {
    this._checkConnectionStateRetries = 3;
    this._oldConnected = this._connected;
    this._connected = false;

    this._checkConnectionStateWithRetries(1250);
  }

  _checkConnectionStateRetry() {
    if (this._checkConnectionStateRetries > 0) {
      let timeout;
      if (this._checkConnectionStateRetries === 3) timeout = 10000;
      else if (this._checkConnectionStateRetries === 2) timeout = 30000;
      else if (this._checkConnectionStateRetries === 1) timeout = 60000;

      this._checkConnectionStateRetries -= 1;
      this._checkConnectionStateWithRetries(timeout);
    }
  }

  _checkConnectionStateWithRetries(interval) {
    if (this._timeoutCheckConnectionState) {
      GLib.source_remove(this._timeoutCheckConnectionState);
      this._timeoutCheckConnectionState = null;
    }

    this._timeoutCheckConnectionState = GLib.timeout_add(
      GLib.PRIORITY_DEFAULT,
      interval,
      () => {
        // Nullify the variable holding the timeout-id, otherwise we can get errors, if we try to delete
        // it manually, the timeout will be destroyed automatically if we return false.
        // We just fetch it for the rare case, where the connection changes or the extension will be stopped during
        // the timeout.
        this._timeoutCheckConnectionState = null;
        let url = this.getWeatherProviderURL();
        let address = Gio.NetworkAddress.parse_uri(url, 80);
        let cancellable = Gio.Cancellable.new();
        try {
          this._network_monitor.can_reach_async(
            address,
            cancellable,
            this._asyncReadyCallback.bind(this)
          );
        } catch (err) {
          let title = _("Can not connect to %s").format(url);
          console.warn(title + "\n" + err.message);
          this._checkConnectionStateRetry();
        }
        return false;
      }
    );
  }

  _asyncReadyCallback(nm, res) {
    try {
      this._connected = this._network_monitor.can_reach_finish(res);
    } catch (err) {
      let title = _("Can not connect to %s").format(
        this.getWeatherProviderURL()
      );
      console.warn(title + "\n" + err.message);
      this._checkConnectionStateRetry();
      return;
    }
    if (!this._oldConnected && this._connected) {
      let now = new Date();
      if (
        _timeCacheCurrentWeather &&
        Math.floor(new Date(now - _timeCacheCurrentWeather).getTime() / 1000) >
          this._refresh_interval_current
      ) {
        this.currentWeatherCache = undefined;
      }
      if (
        !this._isForecastDisabled &&
        _timeCacheForecastWeather &&
        Math.floor(new Date(now - _timeCacheForecastWeather).getTime() / 1000) >
          this._refresh_interval_forecast
      ) {
        this.forecastWeatherCache = undefined;
        this.todaysWeatherCache = undefined;
      }
      this.forecastJsonCache = undefined;
      this.initWeatherData();
    }
  }

  disableForecastChanged() {
    if (this._isForecastDisabled !== this._disable_forecast) {
      return true;
    }
    return false;
  }

  async locationChanged()
  {
    let location = this._city ? await this.extractCoord(this._city) : null;
    if (this._currentLocation !== location)
    {
      return true;
    }
    return false;
  }

  menuAlignmentChanged() {
    if (this._currentAlignment !== this._menu_alignment) {
      return true;
    }
    return false;
  }

  get _weather_provider() {
    // Simplify until more providers are added
    return 0;
    // if (!this._settings)
    //     this.loadConfig();
    // let provider = this.extractProvider(this._city);
    // if (provider == WeatherProvider.DEFAULT)
    //     provider = this._settings.get_enum('weather-provider');
    // return provider;
  }

  get _units() {
    return this.settings.get_enum("unit");
  }

  get _wind_speed_units() {
    return this.settings.get_enum("wind-speed-unit");
  }

  get _wind_direction() {
    return this.settings.get_boolean("wind-direction");
  }

  get _pressure_units() {
    return this.settings.get_enum("pressure-unit");
  }

  get _cities() {
    return this.settings.get_string("city");
  }

  set _cities(v) {
    this.settings.set_string("city", v);
  }

  get _actual_city() {
    let a = this.settings.get_int("actual-city");
    let cities = this._cities.split(" && ");

    if (typeof cities !== "object") cities = [cities];

    let l = cities.length - 1;

    if (a < 0) a = 0;

    if (l < 0) l = 0;

    if (a > l) a = l;

    return a;
  }

  getHiConrastClass()
  {
    let m = this.settings.get_enum("hi-contrast");
    switch(m)
    {
      case HiContrastStyle.WHITE:
        return "openweather-white";
      case HiContrastStyle.BLACK:
        return "openweather-black";
      default:
        return null;
    }
  }

  set _actual_city(a) {
    let cities = this._cities.split(" && ");

    if (typeof cities !== "object") cities = [cities];

    let l = cities.length - 1;

    if (a < 0) a = 0;

    if (l < 0) l = 0;

    if (a > l) a = l;

    this.settings.set_int("actual-city", a);
  }

  get _city() {
    let cities = this._cities.split(" && ");
    if (cities && typeof cities === "string") cities = [cities];
    if (!cities[0]) return "";
    cities = cities[this._actual_city];
    return cities;
  }

  get _translate_condition() {
    return this.settings.get_boolean("translate-condition");
  }

  get _provider_translations() {
    return this.settings.get_boolean("owm-api-translate");
  }

  get _getUseSysIcons() {
    return this.settings.get_boolean("use-system-icons") ? 1 : 0;
  }

  get _startupDelay() {
    return this.settings.get_int("delay-ext-init");
  }

  get _text_in_panel() {
    return this.settings.get_boolean("show-text-in-panel");
  }

  get _position_in_panel() {
    return this.settings.get_enum("position-in-panel");
  }

  get _position_index() {
    return this.settings.get_int("position-index");
  }

  get _menu_alignment() {
    return this.settings.get_double("menu-alignment");
  }

  get _comment_in_panel() {
    return this.settings.get_boolean("show-comment-in-panel");
  }

  get _show_sunriseset_in_panel()
  {
    return this.settings.get_boolean("show-sunsetrise-in-panel");
  }

  get _sun_in_panel_first()
  {
    return this.settings.get_boolean("sun-in-panel-first");
  }

  get _disable_forecast() {
    return this.settings.get_boolean("disable-forecast");
  }

  get _comment_in_forecast() {
    return this.settings.get_boolean("show-comment-in-forecast");
  }

  get _refresh_interval_current() {
    let v = this.settings.get_int("refresh-interval-current");
    return v >= 600 ? v : 600;
  }

  get _refresh_interval_forecast() {
    let v = this.settings.get_int("refresh-interval-forecast");
    return v >= 3600 ? v : 3600;
  }

  get _loc_len_current() {
    let v = this.settings.get_int("location-text-length");
    return v > 0 ? v : 0;
  }

  get _center_forecast() {
    return this.settings.get_boolean("center-forecast");
  }

  get _days_forecast() {
    return this.settings.get_int("days-forecast");
  }

  get _decimal_places() {
    return this.settings.get_int("decimal-places");
  }

  get _appid() {
    let key = "";
    let useDefaultKey = this.settings.get_boolean("use-default-owm-key");

    if (useDefaultKey) key = "e54ac00966ee06bcf68722c86925b326";
    else key = this.settings.get_string("appid");
    return key.length === 32 ? key : "";
  }

  createButton(iconName, accessibleName) {
    let button;

    button = new St.Button({
      reactive: true,
      can_focus: true,
      track_hover: true,
      accessible_name: accessibleName,
      style_class: "message-list-clear-button button openweather-button-action",
    });

    button.child = new St.Icon({
      icon_name: iconName,
    });

    return button;
  }

  rebuildButtonMenu() {
    this._buttonMenu.actor.destroy_all_children();

    this._buttonBox1 = new St.BoxLayout({
      style_class: "openweather-button-box",
    });
    this._buttonBox2 = new St.BoxLayout({
      style_class: "openweather-button-box",
    });

    this._locationButton = this.createButton(
      "find-location-symbolic",
      _("Locations")
    );
    this._reloadButton = this.createButton(
      "view-refresh-symbolic",
      _("Reload Weather Information")
    );
    this._urlButton = this.createButton(
      "",
      _("Weather data by: %s").format(this.weatherProvider)
    );
    this._urlButton.set_label(this._urlButton.get_accessible_name());
    this._prefsButton = this.createButton(
      "preferences-system-symbolic",
      _("Weather Settings")
    );

    this._buttonBox1.add_actor(this._locationButton);
    this._buttonBox1.add_actor(this._reloadButton);
    this._buttonBox2.add_actor(this._urlButton);
    this._buttonBox2.add_actor(this._prefsButton);

    this._locationButton.connect("clicked", () => {
      this._selectCity._setOpenState(!this._selectCity._getOpenState());
    });
    this._reloadButton.connect("clicked", () => {
      if (this._lastRefresh) {
        let _twoMinsAgo = Date.now() - new Date(0).setMinutes(2.0);
        if (this._lastRefresh > _twoMinsAgo) {
          Main.notify(
            "OpenWeather Refined",
            _("Manual refreshes less than 2 minutes apart are ignored!")
          );
          return;
        }
      }
      this.showRefreshing();
      this.initWeatherData(true);
    });
    this._urlButton.connect("clicked", () => {
      this.menu.close();
      let url = this.getWeatherProviderURL();
      try
      {
        Gio.AppInfo.launch_default_for_uri(url, null);
      }
      catch (err)
      {
        let title = _("Can not open %s").format(url);
        Main.notifyError(title, String(err));
      }
    });
    this._prefsButton.connect(
      "clicked",
      this._onPreferencesActivate.bind(this)
    );

    this._buttonMenu.actor.add_actor(this._buttonBox1);
    this._buttonMenu.actor.add_actor(this._buttonBox2);
  }

  rebuildSelectCityItem()
  {
    this._selectCity.menu.removeAll();
    let item = null;

    let cities = this._cities;
    cities = cities.split(" && ");
    if (cities && typeof cities === "string") cities = [cities];
    if (!cities[0]) return;

    for (let i = 0; cities.length > i; i++)
    {
      let locName = this.extractLocation(cities[i]);
      if(this.cityIsCurrentLoc(cities[i]))
      {
        locName += ` (${getCachedLocInfo().city})`;
      }

      item = new PopupMenu.PopupMenuItem(locName);
      item.location = i;
      if (i === this._actual_city) {
        item.setOrnament(PopupMenu.Ornament.DOT);
      }

      this._selectCity.menu.addMenuItem(item);
      // override the items default onActivate-handler, to keep the ui open while choosing the location
      item.activate = this._onActivate;
    }

    if (cities.length === 1) this._selectCity.actor.hide();
    else this._selectCity.actor.show();
  }

  _onActivate() {
    this._actual_city = this.location;
  }

  extractLocation(city)
  {
    let name = this.extractRawLocation(city);
    if(!name && this.cityIsCurrentLoc(city)) return _("My Location");
    else return name;
  }

  extractRawLocation(city)
  {
    if (!city || city.search(">") === -1)
    {
      console.error("Invalid city.");
      return null;
    }
    return city.split(">")[1];
  }

  async extractCoord(loc)
  {
    if (loc && loc.search(">") !== -1)
    {
      let coords = loc.split(">")[0].replace(/\s/g, "");
      if(coords === "here")
      {
        let here = await getLocationInfo();
        return `${here.lat},${here.lon}`;
      }

      let split = coords.split(",");
      if(
        split && split.length === 2 &&
        !isNaN(split[0]) && !isNaN(split[1])
      )
      {
        return coords;
      }
    }
    else
    {
      Main.notify(
        "OpenWeather Refined",
        _("Invalid location! Please try to recreate it.")
      );
      console.error("Invalid location.");
      return null;
    }
  }

  cityIsCurrentLoc(city)
  {
    if(!city || city.search(">") === -1) return false;
    let coords = city.split(">")[0].replace(/\s/g, "");
    return coords === "here";
  }

  extractProvider() {
    if (!arguments[0]) return -1;
    if (arguments[0].split(">")[2] === undefined) return -1;
    if (isNaN(parseInt(arguments[0].split(">")[2]))) return -1;
    return parseInt(arguments[0].split(">")[2]);
  }

  _onPreferencesActivate() {
    this.menu.close();
    let extensionObject = Extension.lookupByUUID(
      "openweather-extension@penguin-teal.github.io"
    );
    extensionObject.openPreferences();
    return 0;
  }

  recalcLayout() {
    if (!this.menu.isOpen) return;

    if (!this._isForecastDisabled && this._currentForecast !== undefined)
      this._currentForecast.set_width(this._currentWeather.get_width());

    if (
      !this._isForecastDisabled &&
      this._forecastDays !== 0 &&
      this._forecastExpander !== undefined
    ) {
      this._forecastScrollBox.set_width(
        this._forecastExpanderBox.get_width() - this._daysBox.get_width()
      );
      this._forecastScrollBox.show();
      this._forecastScrollBox.hscroll.show();

      if (this.settings.get_boolean("expand-forecast")) {
        this._forecastExpander.setSubmenuShown(true);
      } else {
        this._forecastExpander.setSubmenuShown(false);
      }
    }
    this._buttonBox1.set_width(
      this._currentWeather.get_width() - this._buttonBox2.get_width()
    );
  }

  _simplifyDegrees()
  {
    return this.settings.get_boolean("simplify-degrees");
  }

  unit_to_unicode()
  {
    if(this._units !== 2 && this._simplifyDegrees()) return "\u00B0";
    switch(this._units)
    {
      case WeatherUnits.CELSIUS:
        // Don't use U+2013 because it looks weird
        return _("\u00B0C");
      case WeatherUnits.FAHRENHEIT:
        // Don't use U+2109 because it looks weird
        return _("\u00B0F");
      case WeatherUnits.KELVIN:
        return _("K");
      case WeatherUnits.RANKINE:
        return _("\u00B0Ra");
      case WeatherUnits.REAUMUR:
        return _("\u00B0R\u00E9");
      case WeatherUnits.ROEMER:
        return _("\u00B0R\u00F8");
      case WeatherUnits.DELISLE:
        return _("\u00B0De");
      case WeatherUnits.NEWTON:
        return _("\u00B0N");
      default:
        console.warn("OpenWeather Refined: Invalid tempeature unit.");
        return "\u00B0";
    }
  }

  toFahrenheit(t) {
    return (Number(t) * 1.8 + 32).toFixed(this._decimal_places);
  }

  toKelvin(t) {
    return (Number(t) + 273.15).toFixed(this._decimal_places);
  }

  toRankine(t) {
    return (Number(t) * 1.8 + 491.67).toFixed(this._decimal_places);
  }

  toReaumur(t) {
    return (Number(t) * 0.8).toFixed(this._decimal_places);
  }

  toRoemer(t) {
    return ((Number(t) * 21) / 40 + 7.5).toFixed(this._decimal_places);
  }

  toDelisle(t) {
    return ((100 - Number(t)) * 1.5).toFixed(this._decimal_places);
  }

  toNewton(t) {
    return (Number(t) - 0.33).toFixed(this._decimal_places);
  }

  toInHg(p /*, t*/) {
    return (p / 33.86530749).toFixed(this._decimal_places);
  }

  toBeaufort(w, t) {
    if (w < 0.3) return !t ? "0" : "(" + _("Calm") + ")";
    else if (w >= 0.3 && w <= 1.5) return !t ? "1" : "(" + _("Light air") + ")";
    else if (w > 1.5 && w <= 3.4)
      return !t ? "2" : "(" + _("Light breeze") + ")";
    else if (w > 3.4 && w <= 5.4)
      return !t ? "3" : "(" + _("Gentle breeze") + ")";
    else if (w > 5.4 && w <= 7.9)
      return !t ? "4" : "(" + _("Moderate breeze") + ")";
    else if (w > 7.9 && w <= 10.7)
      return !t ? "5" : "(" + _("Fresh breeze") + ")";
    else if (w > 10.7 && w <= 13.8)
      return !t ? "6" : "(" + _("Strong breeze") + ")";
    else if (w > 13.8 && w <= 17.1)
      return !t ? "7" : "(" + _("Moderate gale") + ")";
    else if (w > 17.1 && w <= 20.7)
      return !t ? "8" : "(" + _("Fresh gale") + ")";
    else if (w > 20.7 && w <= 24.4)
      return !t ? "9" : "(" + _("Strong gale") + ")";
    else if (w > 24.4 && w <= 28.4) return !t ? "10" : "(" + _("Storm") + ")";
    else if (w > 28.4 && w <= 32.6)
      return !t ? "11" : "(" + _("Violent storm") + ")";
    else return !t ? "12" : "(" + _("Hurricane") + ")";
  }

  getLocaleDay(abr) {
    let days = [
      _("Sunday"),
      _("Monday"),
      _("Tuesday"),
      _("Wednesday"),
      _("Thursday"),
      _("Friday"),
      _("Saturday"),
    ];
    return days[abr];
  }

  getWindDirection(deg) {
    let arrows = [
      "\u2193",
      "\u2199",
      "\u2190",
      "\u2196",
      "\u2191",
      "\u2197",
      "\u2192",
      "\u2198",
    ];
    let letters = [
      _("N"),
      _("NE"),
      _("E"),
      _("SE"),
      _("S"),
      _("SW"),
      _("W"),
      _("NW"),
    ];
    let idx = Math.round(deg / 45) % arrows.length;
    return this._wind_direction ? arrows[idx] : letters[idx];
  }

  getWeatherIcon(iconname) {
    // Built-in icons option and fallback for missing icons on some distros
    if (
      this._getUseSysIcons &&
      new St.IconTheme().has_icon(iconname)
    ) {
      return Gio.icon_new_for_string(iconname);
    } // No icon available or user prefers built in icons
    else {
      return Gio.icon_new_for_string(
        this.metadata.path + "/media/status/" + iconname + ".svg"
      );
    }
  }

  checkAlignment() {
    let menuAlignment = 1.0 - this._menu_alignment / 100;
    if (Clutter.get_default_text_direction() === Clutter.TextDirection.RTL)
      menuAlignment = 1.0 - menuAlignment;
    this.menu._arrowAlignment = menuAlignment;
  }

  checkPositionInPanel() {
    if (
      this._old_position_in_panel === undefined ||
      this._old_position_in_panel !== this._position_in_panel ||
      this._is_first_run_cycle ||
      this._old_position_index !== this._position_index
    ) {
      this.get_parent().remove_actor(this);

      let children = null;
      switch (this._position_in_panel) {
        case WeatherPosition.LEFT:
          children = Main.panel._leftBox.get_children();
          Main.panel._leftBox.insert_child_at_index(this, this._position_index);
          break;
        case WeatherPosition.CENTER:
          children = Main.panel._centerBox.get_children();
          Main.panel._centerBox.insert_child_at_index(
            this,
            this._position_index
          );
          break;
        case WeatherPosition.RIGHT:
          children = Main.panel._rightBox.get_children();
          Main.panel._rightBox.insert_child_at_index(
            this,
            this._position_index
          );
          break;
      }
      this._old_position_in_panel = this._position_in_panel;
      this._old_position_index = this._position_index;
      this._is_first_run_cycle = 1;
    }
  }

  formatPressure(pressure) {
    let pressure_unit = _("hPa");
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
    return (
      parseFloat(pressure).toLocaleString(this.locale) + " " + pressure_unit
    );
  }

  formatTemperature(temperature)
  {
    let isDegrees = true;
    switch (this._units)
    {
      case WeatherUnits.FAHRENHEIT:
        temperature = this.toFahrenheit(temperature);
        break;

      case WeatherUnits.CELSIUS:
        temperature = temperature.toFixed(this._decimal_places);
        break;

      case WeatherUnits.KELVIN:
        temperature = this.toKelvin(temperature);
        isDegrees = false;
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
    return (
      parseFloat(temperature)
        .toLocaleString(this.locale)
        .replace("-", "\u2212") +
      (isDegrees ? "" : " ") +
      this.unit_to_unicode()
    );
  }

  formatWind(speed, direction) {
    let conv_MPSinMPH = 2.23693629;
    let conv_MPSinKPH = 3.6;
    let conv_MPSinKNOTS = 1.94384449;
    let conv_MPSinFPS = 3.2808399;
    let unit = _("m/s");

    switch (this._wind_speed_units) {
      case WeatherWindSpeedUnits.MPH:
        speed = (speed * conv_MPSinMPH).toFixed(this._decimal_places);
        unit = _("mph");
        break;

      case WeatherWindSpeedUnits.KPH:
        speed = (speed * conv_MPSinKPH).toFixed(this._decimal_places);
        unit = _("km/h");
        break;

      case WeatherWindSpeedUnits.MPS:
        speed = speed.toFixed(this._decimal_places);
        break;

      case WeatherWindSpeedUnits.KNOTS:
        speed = (speed * conv_MPSinKNOTS).toFixed(this._decimal_places);
        unit = _("kn");
        break;

      case WeatherWindSpeedUnits.FPS:
        speed = (speed * conv_MPSinFPS).toFixed(this._decimal_places);
        unit = _("ft/s");
        break;

      case WeatherWindSpeedUnits.BEAUFORT:
        speed = this.toBeaufort(speed);
        unit = this.toBeaufort(speed, true);
        break;
    }

    if (!speed) return "\u2013";
    else if (speed === 0 || !direction)
      return parseFloat(speed).toLocaleString(this.locale) + " " + unit;
    // i.e. speed > 0 && direction
    else
      return (
        direction +
        " " +
        parseFloat(speed).toLocaleString(this.locale) +
        " " +
        unit
      );
  }

  formatTime(date)
  {
    let isHr12;
    switch(this.settings.get_enum("clock-format"))
    {
      case ClockFormat._24H:
        isHr12 = false;
        break;
      case ClockFormat._12H:
        isHr12 = true;
        break;
      default:
        console.warn("OpenWeather Refined invalid clock format.");
        // FALL THRU
      case ClockFormat.SYSTEM:
        isHr12 = _systemClockFormat === ClockFormat._12H;
        break;
    }
    return date.toLocaleTimeString(this.locale, {
      // 12/24 hour and hide seconds
      hour12: isHr12,
      hour: "numeric",
      minute: "numeric"
    });
  }

  reloadWeatherCurrent(interval) {
    if (this._timeoutCurrent) {
      GLib.source_remove(this._timeoutCurrent);
      this._timeoutCurrent = null;
    }
    _timeCacheCurrentWeather = new Date();
    this._timeoutCurrent = GLib.timeout_add_seconds(
      GLib.PRIORITY_DEFAULT,
      interval,
      () => {
        this.refreshWeatherData();
        return true;
      }
    );
  }

  reloadWeatherForecast(interval) {
    if (this._timeoutForecast) {
      GLib.source_remove(this._timeoutForecast);
      this._timeoutForecast = null;
    }
    if (this._isForecastDisabled) return;

    _timeCacheForecastWeather = new Date();
    this._timeoutForecast = GLib.timeout_add_seconds(
      GLib.PRIORITY_DEFAULT_IDLE,
      interval,
      () => {
        this.refreshForecastData();
        return true;
      }
    );
  }

  showRefreshing() {
    this._currentWeatherSummary.text = _("Loading ...");
    this._currentWeatherIcon.icon_name = "view-refresh-symbolic";
  }

  rebuildCurrentWeatherUi() {
    this._currentWeather.actor.destroy_all_children();
    if (!this._isForecastDisabled)
      this._currentForecast.actor.destroy_all_children();

    let a11yClasses = this.getHiConrastClass() ?? "";

    this._weatherInfo.text = "...";
    this._weatherIcon.icon_name = "view-refresh-symbolic";

    // This will hold the icon for the current weather
    this._currentWeatherIcon = new St.Icon({
      icon_size: 96,
      icon_name: "view-refresh-symbolic",
      style_class: "system-menu-action openweather-current-icon",
    });

    this._sunriseIcon = new St.Icon({
      icon_size: 15,
      style_class: "openweather-sunrise-icon",
    });
    this._sunsetIcon = new St.Icon({
      icon_size: 15,
      style_class: "openweather-sunset-icon ",
    });
    this._sunriseIcon.set_gicon(
      this.getWeatherIcon("daytime-sunrise-symbolic")
    );
    this._sunsetIcon.set_gicon(this.getWeatherIcon("daytime-sunset-symbolic"));

    this._buildIcon = new St.Icon({
      icon_size: 15,
      icon_name: "view-refresh-symbolic",
      style_class: "openweather-build-icon",
    });

    // The summary of the current weather
    this._currentWeatherSummary = new St.Label({
      text: _("Loading ..."),
      style_class: "openweather-current-summary",
    });
    this._currentWeatherLocation = new St.Label({
      text: _("Please wait"),
    });

    let bb = new St.BoxLayout({
      vertical: true,
      x_expand: true,
      y_expand: true,
      y_align: Clutter.ActorAlign.CENTER,
      style_class: "system-menu-action openweather-current-summarybox",
    });
    bb.add_actor(this._currentWeatherLocation);
    bb.add_actor(this._currentWeatherSummary);

    this._currentWeatherSunrise = new St.Label({
      text: "-",
    });
    this._currentWeatherSunset = new St.Label({
      text: "-",
    });
    this._currentWeatherBuild = new St.Label({
      text: "-",
    });

    let ab = new St.BoxLayout({
      x_expand: true,
      style_class: "openweather-current-infobox",
    });

    ab.add_actor(this._sunriseIcon);
    ab.add_actor(this._currentWeatherSunrise);
    ab.add_actor(this._sunsetIcon);
    ab.add_actor(this._currentWeatherSunset);
    ab.add_actor(this._buildIcon);
    ab.add_actor(this._currentWeatherBuild);
    bb.add_actor(ab);

    // Other labels
    this._currentWeatherFeelsLike = new St.Label({
      text: "...",
      style_class: a11yClasses
    });
    this._currentWeatherHumidity = new St.Label({
      text: "...",
      style_class: a11yClasses
    });
    this._currentWeatherPressure = new St.Label({
      text: "...",
      style_class: a11yClasses
    });
    this._currentWeatherWind = new St.Label({
      text: "...",
      style_class: a11yClasses
    });
    this._currentWeatherWindGusts = new St.Label({
      text: "...",
      style_class: a11yClasses
    });

    let rb = new St.BoxLayout({
      x_expand: true,
      style_class: "openweather-current-databox",
    });
    let rb_captions = new St.BoxLayout({
      x_expand: true,
      vertical: true,
      style_class:
        "popup-menu-item popup-status-menu-item openweather-current-databox-captions",
    });
    let rb_values = new St.BoxLayout({
      x_expand: true,
      vertical: true,
      style_class: "system-menu-action openweather-current-databox-values",
    });
    rb.add_actor(rb_captions);
    rb.add_actor(rb_values);

    rb_captions.add_actor(
      new St.Label({
        text: _("Feels Like:"),
        style_class: a11yClasses
      })
    );
    rb_values.add_actor(this._currentWeatherFeelsLike);
    rb_captions.add_actor(
      new St.Label({
        text: _("Humidity:"),
        style_class: a11yClasses
      })
    );
    rb_values.add_actor(this._currentWeatherHumidity);
    rb_captions.add_actor(
      new St.Label({
        text: _("Pressure:"),
        style_class: a11yClasses
      })
    );
    rb_values.add_actor(this._currentWeatherPressure);
    rb_captions.add_actor(
      new St.Label({
        text: _("Wind:"),
        style_class: a11yClasses
      })
    );
    rb_values.add_actor(this._currentWeatherWind);
    rb_captions.add_actor(
      new St.Label({
        text: _("Gusts:"),
        style_class: a11yClasses
      })
    );
    rb_values.add_actor(this._currentWeatherWindGusts);

    let xb = new St.BoxLayout({
      x_expand: true,
    });
    xb.add_actor(bb);
    xb.add_actor(rb);

    let box = new St.BoxLayout({
      x_expand: true,
      style_class: "openweather-current-iconbox",
    });
    box.add_actor(this._currentWeatherIcon);
    box.add_actor(xb);
    this._currentWeather.actor.add_child(box);

    // Today's forecast if not disabled by user
    if (this._isForecastDisabled) return;

    this._todays_forecast = [];
    this._todaysBox = new St.BoxLayout({
      x_expand: true,
      x_align: this._center_forecast
        ? Clutter.ActorAlign.END
        : Clutter.ActorAlign.START,
      style_class: "openweather-today-box",
    });

    for (let i = 0; i < 4; i++) {
      let todaysForecast = {};

      todaysForecast.Time = new St.Label({
        style_class: "openweather-forecast-time",
      });
      todaysForecast.Icon = new St.Icon({
        icon_size: 24,
        icon_name: "view-refresh-symbolic",
        style_class: "openweather-forecast-icon",
      });
      todaysForecast.Temperature = new St.Label({
        style_class: "openweather-forecast-temperature",
      });
      todaysForecast.Summary = new St.Label({
        style_class: "openweather-forecast-summary",
      });
      todaysForecast.Summary.clutter_text.line_wrap = true;

      let fb = new St.BoxLayout({
        vertical: true,
        x_expand: true,
        style_class: "openweather-today-databox",
      });
      let fib = new St.BoxLayout({
        x_expand: true,
        x_align: Clutter.ActorAlign.CENTER,
        style_class: "openweather-forecast-iconbox",
      });

      fib.add_actor(todaysForecast.Icon);
      fib.add_actor(todaysForecast.Temperature);

      fb.add_actor(todaysForecast.Time);
      fb.add_actor(fib);
      if (this._comment_in_forecast) fb.add_actor(todaysForecast.Summary);

      this._todays_forecast[i] = todaysForecast;
      this._todaysBox.add_actor(fb);
    }
    this._currentForecast.actor.add_child(this._todaysBox);
  }

  scrollForecastBy(delta) {
    if (this._forecastScrollBox === undefined) return;
    this._forecastScrollBox.hscroll.adjustment.value += delta;
  }

  rebuildFutureWeatherUi(cnt) {
    if (this._isForecastDisabled || this._forecastDays === 0) return;
    this._forecastExpander.menu.box.destroy_all_children();

    let a11yClasses = this.getHiConrastClass() ?? "";

    this._forecast = [];
    this._forecastExpanderBox = new St.BoxLayout({
      x_expand: true,
      opacity: 150,
      style_class: `openweather-forecast-expander ${a11yClasses}`,
    });
    this._forecastExpander.menu.box.add(this._forecastExpanderBox);

    this._daysBox = new St.BoxLayout({
      vertical: true,
      y_expand: true,
      style_class: "openweather-forecast-box",
    });
    this._forecastBox = new St.BoxLayout({
      vertical: true,
      x_expand: true,
      style_class: "openweather-forecast-box",
    });
    this._forecastScrollBox = new St.ScrollView({
      x_expand: true,
      style_class: "openweather-forecasts",
    });
    let pan = new Clutter.PanAction({
      interpolate: true,
    });
    pan.connect("pan", (action) => {
      let [dist, dx, dy] = action.get_motion_delta(0);

      this.scrollForecastBy(
        -1 *
          (dx / this._forecastScrollBox.width) *
          this._forecastScrollBox.hscroll.adjustment.page_size
      );
      return false;
    });
    this._forecastScrollBox.add_action(pan);
    this._forecastScrollBox.connect("scroll-event", this._onScroll.bind(this));
    this._forecastScrollBox.hscroll.connect(
      "scroll-event",
      this._onScroll.bind(this)
    );
    this._forecastScrollBox.hscroll.margin_right = 25;
    this._forecastScrollBox.hscroll.margin_left = 25;
    this._forecastScrollBox.hscroll.hide();
    this._forecastScrollBox.vscrollbar_policy = St.PolicyType.NEVER;
    this._forecastScrollBox.hscrollbar_policy = St.PolicyType.AUTOMATIC;
    this._forecastScrollBox.enable_mouse_scrolling = true;
    this._forecastScrollBox.hide();

    if (cnt === undefined) cnt = this._days_forecast;

    let nDayForecast;
    if (cnt === 1) nDayForecast = _("Tomorrow's Forecast");
    else nDayForecast = _("%s Day Forecast").format(cnt);

    this._forecastExpander.label.set_text(nDayForecast);

    for (let i = 0; i < cnt; i++) {
      let forecastWeather = {};

      forecastWeather.Day = new St.Label({
        style_class: "openweather-forecast-day",
      });
      this._daysBox.add_actor(forecastWeather.Day);

      let forecastWeatherBox = new St.BoxLayout({
        x_expand: true,
        x_align: Clutter.ActorAlign.CENTER,
      });

      for (let j = 0; j < 8; j++) {
        forecastWeather[j] = {};

        forecastWeather[j].Time = new St.Label({
          style_class: "openweather-forecast-time",
        });
        forecastWeather[j].Icon = new St.Icon({
          icon_size: 24,
          style_class: "openweather-forecast-icon",
        });
        forecastWeather[j].Temperature = new St.Label({
          style_class: "openweather-forecast-temperature",
        });
        forecastWeather[j].Summary = new St.Label({
          style_class: "openweather-forecast-summary",
        });
        forecastWeather[j].Summary.clutter_text.line_wrap = true;

        let by = new St.BoxLayout({
          vertical: true,
          x_expand: true,
          style_class: "openweather-forecast-databox",
        });
        let bib = new St.BoxLayout({
          x_expand: true,
          x_align: Clutter.ActorAlign.CENTER,
          style_class: "openweather-forecast-iconbox",
        });

        bib.add_actor(forecastWeather[j].Icon);
        bib.add_actor(forecastWeather[j].Temperature);

        by.add_actor(forecastWeather[j].Time);
        by.add_actor(bib);
        if (this._comment_in_forecast) by.add_actor(forecastWeather[j].Summary);
        forecastWeatherBox.add_actor(by);
      }
      this._forecast[i] = forecastWeather;
      this._forecastBox.add_actor(forecastWeatherBox);
    }
    this._forecastScrollBox.add_actor(this._forecastBox);
    this._forecastExpanderBox.add_actor(this._daysBox);
    this._forecastExpanderBox.add_actor(this._forecastScrollBox);
  }

  _onScroll(actor, event) {
    if (this._isForecastDisabled) return;

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

    this.scrollForecastBy(
      dy * this._forecastScrollBox.hscroll.adjustment.stepIncrement
    );
    return false;
  }
}

export default class OpenWeatherExtension extends Extension {
  enable() {
    console.log(`enabling ${this.metadata.name}`);
    this.openWeatherMenu = new OpenWeatherMenuButton(
      this.metadata,
      this.getSettings()
    );
    Main.panel.addToStatusArea("openWeatherMenu", this.openWeatherMenu);
  }

  disable() {
    console.log(`disabling ${this.metadata.name}`);
    this.openWeatherMenu.stop();
    this.openWeatherMenu.destroy();
    this.openWeatherMenu = null;
  }
}
