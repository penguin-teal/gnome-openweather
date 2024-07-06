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

import Gtk from "gi://Gtk";
import Adw from "gi://Adw";
import GObject from "gi://GObject";

import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

import { WeatherProvider, getWeatherProviderName } from "../getweather.js";
import { settingsGetKeys, settingsSetKeys } from "../locs.js";
import { UnitSet, UnitPresets, setUnitSetFromSettings, getUnitSetFromSettings, unitSetMatchesPreset } from "../unitPresets.js";

function getProviderTranslateRowTitle(prov) 
{
  return _("Provider Multilingual Support");
}

function getDefaultApiKeyRowSubtitle(prov)
{
  let name = getWeatherProviderName(prov);
  return _("Use a personal API key for %s").format(name ?? _("Provider"));
}

function getDefaultApiKeyRowTooltip(prov)
{
  let name = getWeatherProviderName(prov);
  return _("Enable this if you have your own API key from %s and enter it below."
  ).format(name ?? _("Provider"));
}

function isValidKey(provider, key)
{
  switch(provider) 
  {
    case WeatherProvider.OPENWEATHERMAP:
      return /^[a-z0-9A-Z ]{5,}$/.test(key);
    case WeatherProvider.WEATHERAPICOM:
      return /^[a-z0-9A-Z ]{5,}$/.test(key);
    case WeatherProvider.VISUALCROSSING:
      return /^[A-Z0-9a-z ]{5,}$/.test(key);
    case WeatherProvider.OPENMETEO:
      return true;
    default:
      return false;
  }
}

function formatKey(provider, key)
{
  switch(provider)
  {
    case WeatherProvider.OPENWEATHERMAP:
    case WeatherProvider.WEATHERAPICOM:
      return key.toLowerCase().replace(/\w+/, "");
    case WeatherProvider.VISUALCROSSING:
      return key.toUpperCase().replace(/\w+/, "");
    default:
      return key;
  }
}

class GeneralPage extends Adw.PreferencesPage
{
  static {
    GObject.registerClass(this);
  }

  constructor(metadata, settings, wnd)
  {
    super({
      title: _("Settings"),
      icon_name: "preferences-system-symbolic",
      name: "GeneralPage",
    });
    this._settings = settings;
    this._window = wnd;

    // General Settings
    let generalGroup = new Adw.PreferencesGroup({
      title: _("General"),
    });

    // Current weather refresh
    let currentRefreshSpinButton = new Gtk.SpinButton({
      adjustment: new Gtk.Adjustment({
        lower: 10,
        upper: 1440,
        step_increment: 1,
        page_increment: 10,
        value: this._settings.get_int("refresh-interval-current") / 60,
      }),
      climb_rate: 5,
      numeric: true,
      update_policy: "if-valid",
      valign: Gtk.Align.CENTER,
    });
    let currentRefreshRow = new Adw.ActionRow({
      title: _("Current Weather Refresh"),
      subtitle: _("Current weather refresh interval in minutes"),
      activatable_widget: currentRefreshSpinButton,
    });
    currentRefreshRow.add_suffix(currentRefreshSpinButton);

    // forecast refresh
    let disableForecast = this._settings.get_boolean("disable-forecast");
    let forecastRefreshSpinButton = new Gtk.SpinButton({
      adjustment: new Gtk.Adjustment({
        lower: 60,
        upper: 1440,
        step_increment: 1,
        page_increment: 10,
        value: this._settings.get_int("refresh-interval-forecast") / 60,
      }),
      climb_rate: 5,
      numeric: true,
      update_policy: "if-valid",
      sensitive: disableForecast ? false : true,
      valign: Gtk.Align.CENTER,
    });
    let forecastRefreshRow = new Adw.ActionRow({
      title: _("Weather Forecast Refresh"),
      subtitle: _("Forecast refresh interval in minutes if enabled"),
      activatable_widget: forecastRefreshSpinButton,
    });
    forecastRefreshRow.add_suffix(forecastRefreshSpinButton);

    // My Location Refresh
    let myLocRefreshSpinButton = new Gtk.SpinButton({
      adjustment: new Gtk.Adjustment({
        lower: 10,
        upper: 1440,
        step_increment: 1,
        page_increment: 10,
        value: this._settings.get_double("loc-refresh-interval")
      }),
      climb_rate: 5,
      numeric: true,
      update_policy: "if-valid",
      valign: Gtk.Align.CENTER
    });
    let myLocRefreshRow = new Adw.ActionRow({
      title: _("My Location Refresh"),
      subtitle: _("My location refresh interval in minutes"),
      activatable_widget: myLocRefreshSpinButton
    });
    myLocRefreshRow.add_suffix(myLocRefreshSpinButton);

    // disable forecast
    let disableForecastSwitch = new Gtk.Switch({
      valign: Gtk.Align.CENTER,
      active: disableForecast,
    });
    let disableForecastRow = new Adw.ActionRow({
      title: _("Disable Forecast"),
      subtitle: _("Disables all fetching and processing of forecast data"),
      activatable_widget: disableForecastSwitch,
    });
    disableForecastRow.add_suffix(disableForecastSwitch);

    // Icons
    let systemIconsSwitch = new Gtk.Switch({
      valign: Gtk.Align.CENTER,
      active: this._settings.get_boolean("use-system-icons"),
    });
    let systemIconsRow = new Adw.ActionRow({
      title: _("System Icons"),
      subtitle: _("Disable to use packaged %s weather icons").format("Breeze"),
      tooltip_text: _(
        "If you have issues with your system icons displaying correctly disable this to fix it"
      ),
      activatable_widget: systemIconsSwitch,
    });
    systemIconsRow.add_suffix(systemIconsSwitch);

    // Startup delay
    let startupDelaySpinButton = new Gtk.SpinButton({
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 30,
        step_increment: 1,
        page_increment: 10,
        value: this._settings.get_int("delay-ext-init"),
      }),
      climb_rate: 1,
      numeric: true,
      update_policy: "if-valid",
      valign: Gtk.Align.CENTER,
    });
    let startupDelayRow = new Adw.ActionRow({
      title: _("First Boot Delay"),
      subtitle: _("Seconds to delay popup initialization and data fetching"),
      tooltip_text: _(
        "This setting only applies to the first time the extension is loaded. (first log in / restarting gnome shell)"
      ),
      activatable_widget: startupDelaySpinButton,
    });
    startupDelayRow.add_suffix(startupDelaySpinButton);

    generalGroup.add(currentRefreshRow);
    generalGroup.add(forecastRefreshRow);
    generalGroup.add(myLocRefreshRow);
    generalGroup.add(disableForecastRow);
    generalGroup.add(systemIconsRow);
    generalGroup.add(startupDelayRow);
    this.add(generalGroup);

    // Units Group
    let unitsGroup = new Adw.PreferencesGroup({
      title: _("Units"),
    });
    
    let selUnitSet = getUnitSetFromSettings(this._settings);
    const unitPresetListOrder = [ "US", "UK", "METRIC" ];
    let selUnitPreset = unitSetMatchesPreset(selUnitSet);

    let unitPresetList = new Gtk.StringList();
    unitPresetList.append(_("U.S."));
    unitPresetList.append(_("U.K."));
    unitPresetList.append(_("Metric"));
    unitPresetList.append(_("Custom"));
    let unitPresetRow = new Adw.ComboRow({
      title: _("Unit Preset"),
      model: unitPresetList,
      selected: selUnitPreset ? unitPresetListOrder.indexOf(selUnitPreset) : 3
    });

    // Temperature
    let temperatureUnits = new Gtk.StringList();
    temperatureUnits.append(_("\u00B0C"));
    temperatureUnits.append(_("\u00B0F"));
    temperatureUnits.append(_("K"));
    temperatureUnits.append(_("\u00B0Ra"));
    temperatureUnits.append(_("\u00B0R\u00E9"));
    temperatureUnits.append(_("\u00B0R\u00F8"));
    temperatureUnits.append(_("\u00B0De"));
    temperatureUnits.append(_("\u00B0N"));
    let unitIsDegs = selUnitSet.temp !== 2;
    let temperatureUnitRow = new Adw.ComboRow({
      title: _("Temperature"),
      model: temperatureUnits,
      selected: selUnitSet.temp,
      visible: selUnitPreset === null
    });

    // Wind speed
    let windSpeedUnits = new Gtk.StringList();
    windSpeedUnits.append(_("km/h"));
    windSpeedUnits.append(_("mph"));
    windSpeedUnits.append(_("m/s"));
    windSpeedUnits.append(_("kn"));
    windSpeedUnits.append(_("ft/s"));
    windSpeedUnits.append(_("Beaufort"));
    let windSpeedUnitRow = new Adw.ComboRow({
      title: _("Wind Speed"),
      model: windSpeedUnits,
      selected: selUnitSet.speed,
      visible: selUnitPreset === null
    });

    // Pressure
    let pressureUnits = new Gtk.StringList();
    // hPa
    pressureUnits.append(_("inHg"));
    pressureUnits.append(_("bar"));
    pressureUnits.append(_("Pa"));
    pressureUnits.append(_("kPa"));
    pressureUnits.append(_("atm"));
    pressureUnits.append(_("at"));
    pressureUnits.append(_("Torr"));
    pressureUnits.append(_("psi"));
    pressureUnits.append(_("mmHg"));
    pressureUnits.append(_("mbar"));
    let pressureUnitRow = new Adw.ComboRow({
      title: _("Pressure"),
      model: pressureUnits,
      selected: selUnitSet.press - 1,
      visible: selUnitPreset === null
    });

    // Clock Format
    let clockFormat = new Gtk.StringList();
    clockFormat.append(_("24-hour"));
    clockFormat.append(_("AM / PM"));
    clockFormat.append(_("System"));
    let clockFormatRow = new Adw.ComboRow({
      title: _("Time Format"),
      model: clockFormat,
      selected: this._settings.get_enum("clock-format")
    });

    let simplifyDegSwitch = new Gtk.Switch({
      valign: Gtk.Align.CENTER,
      active: this._settings.get_boolean("simplify-degrees")
    });
    simplifyDegSwitch.set_sensitive(unitIsDegs);
    let simplifyDegRow = new Adw.ActionRow({
      title: _("Simplify Degrees"),
      subtitle: _('Show "\u00B0" instead of "\u00B0C," "\u00B0F," etc.'),
      tooltip_text: _("Enable this to cut off the \"C,\" \"F,\" etc. from degrees labels."),
      activatable_widget: simplifyDegSwitch
    });
    simplifyDegRow.add_suffix(simplifyDegSwitch);

    unitsGroup.add(unitPresetRow);
    unitsGroup.add(temperatureUnitRow);
    unitsGroup.add(windSpeedUnitRow);
    unitsGroup.add(pressureUnitRow);
    unitsGroup.add(clockFormatRow);
    unitsGroup.add(simplifyDegRow);
    this.add(unitsGroup);

    let notifGroup = new Adw.PreferencesGroup({
      title: _("Notifications")
    });

    let precipStartsNotifSwitch = new Gtk.Switch({
      valign: Gtk.Align.CENTER,
      active: this._settings.get_boolean("precip-starts-notif")
    });
    let precipStartsNotifRow = new Adw.ActionRow({
      title: _("Precipitation Starting"),
      subtitle: _("Get notified when precipitation starts (e.g. rain or snow)."),
      tooltip_text: _("Get notified when precipitation starts (e.g. rain or snow)."),
      activatable_widget: precipStartsNotifSwitch
    });
    precipStartsNotifRow.add_suffix(precipStartsNotifSwitch);

    notifGroup.add(precipStartsNotifRow);
    //this.add(notifGroup);

    // Provider Settings
    let apiGroup = new Adw.PreferencesGroup({
      title: _("Provider"),
    });

    let curProv = this._settings.get_enum("weather-provider");

    let weatherProvsList = new Gtk.StringList();
    weatherProvsList.append(_("Adaptive"));
    weatherProvsList.append("OpenWeatherMap");
    weatherProvsList.append("WeatherAPI.com");
    weatherProvsList.append("Visual Crossing");
    //weatherProvsList.append("Open-Meteo");
    let weatherProvsListRow = new Adw.ComboRow({
      title: _("Weather Provider"),
      subtitle: _("Provider used for weather and forecasts; choose \"%s\" if you don't care.").format(_("Adaptive")),
      tooltip_text: _("Choose '%s' if you don't care, otherwise choose a specific provider.").format(_("Adaptive")),
      model: weatherProvsList,
      selected: curProv
    });

    // Provider API key
    let curProvKey = curProv ? settingsGetKeys(this._settings)[curProv - 1] : "";

    let defaultApiKeySwitch = new Gtk.Switch({
      valign: Gtk.Align.CENTER,
      active: curProvKey !== "",
      sensitive: curProv !== 0
    });
    let defaultApiKeyRow = new Adw.ActionRow({
      title: _("Use Custom API Key"),
      subtitle: getDefaultApiKeyRowSubtitle(curProv),
      tooltip_text: getDefaultApiKeyRowTooltip(curProv),
      activatable_widget: defaultApiKeySwitch,
    });
    defaultApiKeyRow.add_suffix(defaultApiKeySwitch);

    // Personal API key
    let personalApiKeyEntry = new Gtk.Entry({
      max_length: 32,
      width_chars: 20,
      vexpand: false,
      sensitive: curProvKey !== "",
      valign: Gtk.Align.CENTER,
    });
    let personalApiKeyRow = new Adw.ActionRow({
      title: _("Personal API Key"),
      activatable_widget: personalApiKeyEntry,
    });

    let provKeyIsValid = isValidKey(curProv, curProvKey);
    personalApiKeyEntry.set_icon_from_icon_name(Gtk.PositionType.LEFT,
      provKeyIsValid ? "checkbox-checked-symbolic" : "dialog-warning");
    personalApiKeyEntry.set_text(curProvKey);
    personalApiKeyRow.add_suffix(personalApiKeyEntry);

    apiGroup.add(weatherProvsListRow);
    apiGroup.add(defaultApiKeyRow);
    apiGroup.add(personalApiKeyRow);
    this.add(apiGroup);

    // Language Group
    let languageGroup = new Adw.PreferencesGroup({
      title: _("Language"),
    });

    // Language
    let languageList = new Gtk.StringList();
    languageList.append(_("System"));
    languageList.append(_("Arabic"));
    languageList.append(_("Basque"));
    languageList.append(_("Belarusian"));
    languageList.append(_("Bulgarian"));
    languageList.append(_("Catalan"));
    languageList.append(_("Chinese (Simplified)"));
    languageList.append(_("Chinese (Traditional)"));
    languageList.append(_("Czech"));
    languageList.append(_("Danish"));
    languageList.append(_("Dutch"));
    languageList.append(_("English"));
    languageList.append(_("Finnish"));
    languageList.append(_("French"));
    languageList.append(_("German"));
    languageList.append(_("Greek"));
    languageList.append(_("Hebrew"));
    languageList.append(_("Hungarian"));
    languageList.append(_("Indonesian"));
    languageList.append(_("Italian"));
    languageList.append(_("Japanese"));
    languageList.append(_("Lithuanian"));
    languageList.append(_("Norwegian Bokmål"));
    languageList.append(_("Polish"));
    languageList.append(_("Portuguese"));
    languageList.append(_("Portuguese (Brazil)"));
    languageList.append(_("Romanian"));
    languageList.append(_("Russian"));
    languageList.append(_("Serbian"));
    languageList.append(_("Serbian (Latin)"));
    languageList.append(_("Slovak"));
    languageList.append(_("Spanish"));
    languageList.append(_("Swedish"));
    languageList.append(_("Turkish"));
    languageList.append(_("Ukrainian"));
    languageList.append(_("Vietnamese"));

    let currentLanguage = this._settings.get_string("language");
    let currentIndex = -1;
    for (let i = 0; i < languageList.get_n_items(); i++) {
        if (languageList.get_item(i).get_string() === currentLanguage) {
            currentIndex = i;
            break;
        }
    }

    let languageRow = new Adw.ComboRow({
      title: _("Language"),
      subtitle: _("Only applies to the weather conditions shown in the popup menu\nYou must have the Provider Multilingual Support enabled for this to work"),
      tooltip_text: _("If it doesn't work for your language, try switching the provider!"),
      model: languageList,
      selected: currentIndex,
    });

    // Provider Multilingual Support
    let providerTranslateSwitch = new Gtk.Switch({
      valign: Gtk.Align.CENTER,
      active: this._settings.get_boolean("owm-api-translate"),
    });
    let providerTranslateRow = new Adw.ActionRow({
      title: getProviderTranslateRowTitle(curProv),
      subtitle: _(
        "Using provider translations applies to weather conditions only"
      ),
      tooltip_text: _(
        "Enable this to use provider multilingual support if there's no built-in translations for your language yet"
      ),
      activatable_widget: providerTranslateSwitch,
    });

    providerTranslateRow.add_suffix(providerTranslateSwitch);

    languageGroup.add(languageRow);
    languageGroup.add(providerTranslateRow)
    this.add(languageGroup);

    // Reset
    let resetGroup = new Adw.PreferencesGroup({
      title: _("Reset")
    });

    let resetToDefsBtn = new Gtk.Button({
      child: new Adw.ButtonContent({
        icon_name: "view-refresh-symbolic",
        label: _("Reset"),
      }),
    });
    let resetToDefsRow = new Adw.ActionRow({
      title: _("Restore Defaults"),
      tooltip_text: _(
        "Restore all settings to the defaults."
      ),
      activatable_widget: resetToDefsBtn,
    });
    resetToDefsRow.add_suffix(resetToDefsBtn);

    resetGroup.add(resetToDefsRow);
    this.add(resetGroup);

    // Bind signals
    currentRefreshSpinButton.connect("value-changed", (widget) => {
      this._settings.set_int(
        "refresh-interval-current",
        60 * widget.get_value()
      );
    });
    forecastRefreshSpinButton.connect("value-changed", (widget) => {
      this._settings.set_int(
        "refresh-interval-forecast",
        60 * widget.get_value()
      );
    });
    myLocRefreshSpinButton.connect("value-changed", (widget) => {
      this._settings.set_double("loc-refresh-interval", widget.get_value());
    });
    disableForecastSwitch.connect("notify::active", (widget) => {
      if (widget.get_active()) {
        forecastRefreshSpinButton.set_sensitive(false);
      } else {
        forecastRefreshSpinButton.set_sensitive(true);
      }
      this._settings.set_boolean("disable-forecast", widget.get_active());
    });
    systemIconsSwitch.connect("notify::active", (widget) => {
      this._settings.set_boolean("use-system-icons", widget.get_active());
    });
    startupDelaySpinButton.connect("value-changed", (widget) => {
      this._settings.set_int("delay-ext-init", widget.get_value());
    });
    unitPresetRow.connect("notify::selected", widget => {
      // 0-2 = Presets, 3 = Custom
      let isCustom = widget.selected === 3;
      temperatureUnitRow.set_visible(isCustom);
      windSpeedUnitRow.set_visible(isCustom);
      pressureUnitRow.set_visible(isCustom);

      if(isCustom)
      {
        let unitSet = getUnitSetFromSettings(this._settings);
        temperatureUnitRow.set_selected(unitSet.temp);
        windSpeedUnitRow.set_selected(unitSet.speed);
        pressureUnitRow.set_selected(unitSet.press - 1);
      }
      else
      {
        let presetStr = unitPresetListOrder[widget.selected];
        let preset = UnitPresets[presetStr];
        setUnitSetFromSettings(this._settings, preset);
      }
    });
    languageRow.connect("notify::selected", (widget) => {
      const selectedIndex = widget.selected;
      const selectedLanguage = languageList.get_item(selectedIndex).get_string();
      this._settings.set_string("language", selectedLanguage);
    });
    temperatureUnitRow.connect("notify::selected", (widget) => {
      let unit = widget.selected;
      simplifyDegSwitch.set_sensitive(unit !== 2);
      this._settings.set_enum("unit", unit);
    });
    windSpeedUnitRow.connect("notify::selected", (widget) => {
      this._settings.set_enum("wind-speed-unit", widget.selected);
    });
    pressureUnitRow.connect("notify::selected", (widget) => {
      this._settings.set_enum("pressure-unit", widget.selected + 1);
    });
    clockFormatRow.connect("notify::selected", (widget) => {
      this._settings.set_enum("clock-format", widget.selected);
    });
    simplifyDegSwitch.connect("notify::active", (widget) => {
      this._settings.set_boolean("simplify-degrees", widget.get_active());
    });
    precipStartsNotifSwitch.connect("notify::active", widget => {
      this._settings.set_boolean("precip-starts-notif", widget.get_active());
    });
    weatherProvsListRow.connect("notify::selected", widget => {
      let prov = widget.selected;
      this._settings.set_enum("weather-provider", prov);
      providerTranslateRow.set_title(getProviderTranslateRowTitle(prov));
      defaultApiKeyRow.set_subtitle(getDefaultApiKeyRowSubtitle(prov));
      defaultApiKeyRow.set_tooltip_text(getDefaultApiKeyRowTooltip(prov));

      let isAdaptive = prov === 0;
      let keyArr = settingsGetKeys(this._settings);
      // Array Index 0 is first provider, but in the provider enum 0 = adaptive
      // and 1 = the first provider
      let key = isAdaptive ? "" : keyArr[prov - 1];
      // Empty String = Default Key
      let isDefKey = key === "";
      // Switched on if not Adaptive and not using Default Key
      defaultApiKeySwitch.set_active(!isAdaptive && !isDefKey);
      // Grey out if Adaptive
      defaultApiKeySwitch.set_sensitive(!isAdaptive);
      // Grey out if Adaptive or using Default key
      personalApiKeyEntry.set_sensitive(!isAdaptive && !isDefKey);
      // Set text to an empty string if using Default, or the key
      personalApiKeyEntry.set_text(key);
    });
    providerTranslateSwitch.connect("notify::active", (widget) => {
      this._settings.set_boolean("owm-api-translate", widget.get_active());
    });
    defaultApiKeySwitch.connect("notify::active", (widget) => {
      let prov = this._settings.get_enum("weather-provider");
      // If somehow provider is set to Adaptive
      // (which this should be greyed out so shouldn't happen)
      // we'll just get out here
      if(prov === 0) return;

      let active = widget.get_active();
      // Grey out key text box if we turn this off
      personalApiKeyEntry.set_sensitive(active);

      let keyArr = settingsGetKeys(this._settings);
      // Set the corresponding provider (where 1 in the enum is 0 in the key
      // array) to the key or an empty string to signify default
      keyArr[prov - 1] = active ? personalApiKeyEntry.text : "";
      settingsSetKeys(this._settings, keyArr);
    });
    personalApiKeyEntry.connect("notify::text", (widget) => {
      let prov = this._settings.get_enum("weather-provider");
      if(prov === 0) return;

      let key = widget.text;
      let isValid = isValidKey(prov, key);
      personalApiKeyEntry.set_icon_from_icon_name(Gtk.PositionType.LEFT,
        isValid ? "checkbox-checked-symbolic" : "dialog-warning");
      // Don't save if not a valid key
      if(!isValid) return;

      let keyArr = settingsGetKeys(this._settings);
      // 1 in enum is 0 in the key array
      // Note if this is empty, that will turn default mode on
      keyArr[prov - 1] = formatKey(key);
      settingsSetKeys(this._settings, keyArr);
    });
    resetToDefsBtn.connect("clicked", () =>
      {
      let keys = this._settings.list_keys();
      this._settings.set_boolean("frozen", true);

        for(let k of keys)
        {
        this._settings.reset(k);
      }

      this._settings.reset("frozen");

      this._window.close();
      }
    );
  }
}
export { GeneralPage };
