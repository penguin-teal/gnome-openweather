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

class LayoutPage extends Adw.PreferencesPage {
  static {
    GObject.registerClass(this);
  }

  constructor(metadata, settings) {
    super({
      title: _("Layout"),
      icon_name: "preferences-other-symbolic",
      name: "LayoutPage",
    });
    this._settings = settings;

    // Panel Options
    let panelGroup = new Adw.PreferencesGroup({
      title: _("Panel"),
    });

    // Position in panel
    let panelPositions = new Gtk.StringList();
    panelPositions.append(_("Center"));
    panelPositions.append(_("Right"));
    panelPositions.append(_("Left"));
    let panelPositionRow = new Adw.ComboRow({
      title: _("Position In Panel"),
      model: panelPositions,
      selected: this._settings.get_enum("position-in-panel"),
    });

    // Position offset
    let positionOffsetSpinButton = new Gtk.SpinButton({
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 15,
        step_increment: 1,
        page_increment: 1,
        page_size: 0,
        value: this._settings.get_int("position-index"),
      }),
      climb_rate: 1,
      digits: 0,
      numeric: true,
      valign: Gtk.Align.CENTER,
    });
    let positionOffsetRow = new Adw.ActionRow({
      title: _("Position Offset"),
      subtitle: _("The position relative to other items in the box"),
      activatable_widget: positionOffsetSpinButton,
    });
    positionOffsetRow.add_suffix(positionOffsetSpinButton);

    // Temp in panel
    let temperatureInPanelSwitch = new Gtk.Switch({
      valign: Gtk.Align.CENTER,
      tooltip_text: _("Show the temperature in the panel"),
      active: this._settings.get_boolean("show-text-in-panel"),
    });
    let temperatureInPanelRow = new Adw.ActionRow({
      title: _("Temperature In Panel"),
      activatable_widget: temperatureInPanelSwitch,
    });
    temperatureInPanelRow.add_suffix(temperatureInPanelSwitch);

    // Conditions in panel
    let conditionsInPanelSwitch = new Gtk.Switch({
      valign: Gtk.Align.CENTER,
      tooltip_text: _("Show the weather conditions in the panel"),
      active: this._settings.get_boolean("show-comment-in-panel"),
    });
    let conditionsInPanelRow = new Adw.ActionRow({
      title: _("Conditions In Panel"),
      activatable_widget: conditionsInPanelSwitch,
    });
    conditionsInPanelRow.add_suffix(conditionsInPanelSwitch);

    // Sunrise/Sunset in Panel
    let sunsetriseInPanelSwitch = new Gtk.Switch({
      valign: Gtk.Align.CENTER,
      tooltip_text: _("Show the time of sunrise/sunset in the panel."),
      active: this._settings.get_boolean("show-sunsetrise-in-panel")
    });
    let sunsetriseInPanelRow = new Adw.ActionRow({
      title: _("Sunrise/Sunset In Panel"),
      activatable_widget: sunsetriseInPanelSwitch
    });
    sunsetriseInPanelRow.add_suffix(sunsetriseInPanelSwitch);

    // Sunrise/Sunset in Panel
    let sunsetriseFirstSwitch = new Gtk.Switch({
      valign: Gtk.Align.CENTER,
      tooltip_text: _("Show the sunset/sunrise before the temperature/conditions. Requires restart."),
      active: this._settings.get_boolean("sun-in-panel-first")
    });
    let sunsetriseFirstRow = new Adw.ActionRow({
      title: _("Sunrise/Sunset First (Restart Required)"),
      activatable_widget: sunsetriseInPanelSwitch
    });
    sunsetriseFirstRow.add_suffix(sunsetriseFirstSwitch);
    sunsetriseFirstRow.set_sensitive(this._settings.get_boolean("show-sunsetrise-in-panel"));

    panelGroup.add(panelPositionRow);
    panelGroup.add(positionOffsetRow);
    panelGroup.add(temperatureInPanelRow);
    panelGroup.add(conditionsInPanelRow);
    panelGroup.add(sunsetriseInPanelRow);
    panelGroup.add(sunsetriseFirstRow);
    this.add(panelGroup);

    // Weather Popup Options
    let popupGroup = new Adw.PreferencesGroup({
      title: _("Popup"),
    });

    // Popup position
    let weatherPopupPositionScale = new Gtk.Scale({
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 100,
        step_increment: 0.1,
        page_increment: 2,
        value: this._settings.get_double("menu-alignment"),
      }),
      width_request: 200,
      show_fill_level: 1,
      restrict_to_fill_level: 0,
      fill_level: 100,
    });
    let weatherPopupPositionRow = new Adw.ActionRow({
      title: _("Popup Position"),
      subtitle: _("Alignment of the popup from left to right"),
      activatable_widget: weatherPopupPositionScale,
    });
    weatherPopupPositionRow.add_suffix(weatherPopupPositionScale);

    // Wind arrows
    let windArrowsSwitch = new Gtk.Switch({
      valign: Gtk.Align.CENTER,
      active: this._settings.get_boolean("wind-direction"),
    });
    let windArrowsRow = new Adw.ActionRow({
      title: _("Wind Direction Arrows"),
      activatable_widget: windArrowsSwitch,
    });
    windArrowsRow.add_suffix(windArrowsSwitch);

    // Translate conditions
    this.providerTranslations = this._settings.get_boolean("owm-api-translate");
    let translateConditionsSwitch = new Gtk.Switch({
      valign: Gtk.Align.CENTER,
      active: this._settings.get_boolean("translate-condition"),
    });
    let translateConditionsRow = new Adw.ActionRow({
      title: _("Translate Conditions"),
      activatable_widget: translateConditionsSwitch,
      visible: !this.providerTranslations,
    });
    translateConditionsRow.add_suffix(translateConditionsSwitch);

    // Temp decimal places
    let temperatureDigits = new Gtk.StringList();
    temperatureDigits.append(_("0"));
    temperatureDigits.append(_("1"));
    temperatureDigits.append(_("2"));
    temperatureDigits.append(_("3"));
    let temperatureDigitsRow = new Adw.ComboRow({
      title: _("Temperature Decimal Places"),
      tooltip_text: _("Maximum number of digits after the decimal point"),
      model: temperatureDigits,
      selected: this._settings.get_int("decimal-places")
    });

    let pressureDigits = new Gtk.StringList();
    pressureDigits.append(_("Unit Default"));
    pressureDigits.append(_("Follow Temp."));
    pressureDigits.append(_("0"));
    pressureDigits.append(_("1"));
    pressureDigits.append(_("2"));
    pressureDigits.append(_("3"));
    pressureDigits.append(_("4"));
    let pressureDigitsRow = new Adw.ComboRow({
      title: _("Pressure Decimal Places"),
      tooltip_text: _("Maximum number of digits after the decimal point"),
      model: pressureDigits,
      selected: this._settings.get_int("pressure-decimal-places") + 2
    });

    let speedDigits = new Gtk.StringList();
    speedDigits.append(_("Follow Temp."));
    speedDigits.append(_("0"));
    speedDigits.append(_("1"));
    speedDigits.append(_("2"));
    speedDigits.append(_("3"));
    speedDigits.append(_("4"));
    let speedDigitsRow = new Adw.ComboRow({
      title: _("Speed Decimal Places"),
      tooltip_text: _("Maximum number of digits after the decimal point"),
      model: speedDigits,
      selected: this._settings.get_int("speed-decimal-places") + 1
    });

    // Location length text
    let locationLengthSpinButton = new Gtk.SpinButton({
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 500,
        step_increment: 1,
        page_increment: 10,
        value: this._settings.get_int("location-text-length"),
      }),
      climb_rate: 5,
      digits: 0,
      numeric: true,
      valign: Gtk.Align.CENTER,
    });
    let locationLengthRow = new Adw.ActionRow({
      title: _("Location Text Length"),
      tooltip_text: _(
        "Maximum length of the location text. A setting of '0' is unlimited"
      ),
      subtitle: _("Maximum length to cut off the location text at. \"0\" is unlimited."),
      activatable_widget: locationLengthSpinButton,
    });
    locationLengthRow.add_suffix(locationLengthSpinButton);

    // Hi Contrast Styles
    let hiContrast = new Gtk.StringList();
    hiContrast.append(_("Off"));
    hiContrast.append(_("White Text"));
    hiContrast.append(_("Black Text"));
    let hiContrastRow = new Adw.ComboRow({
      title: _("High Contrast"),
      subtitle: _("Override GNOME shell text colors in the pop-up with hard-coded ones that may be easier to read. This may not be very effective depending on your shell theme."),
      tooltip_text: _("Enable to override GNOME shell colors"),
      model: hiContrast,
      selected: this._settings.get_enum("hi-contrast")
    });

    popupGroup.add(weatherPopupPositionRow);
    popupGroup.add(windArrowsRow);
    popupGroup.add(translateConditionsRow);
    popupGroup.add(temperatureDigitsRow);
    popupGroup.add(pressureDigitsRow);
    popupGroup.add(speedDigitsRow);
    popupGroup.add(locationLengthRow);
    popupGroup.add(hiContrastRow);
    this.add(popupGroup);

    // Forecast Options
    this.disableForecast = this._settings.get_boolean("disable-forecast");

    let forecastGroup = new Adw.PreferencesGroup({
      title: _("Forecast"),
      sensitive: !this.disableForecast,
    });

    // Center today's forecast
    let centerForecastSwitch = new Gtk.Switch({
      valign: Gtk.Align.CENTER,
      active: this._settings.get_boolean("center-forecast"),
    });
    let centerForecastRow = new Adw.ActionRow({
      title: _("Center Today's Forecast"),
      subtitle: _("Center today's forecast instead of left-aligning it."),
      activatable_widget: centerForecastSwitch,
    });
    centerForecastRow.add_suffix(centerForecastSwitch);

    // Conditions in forecast
    let forecastConditionsSwitch = new Gtk.Switch({
      valign: Gtk.Align.CENTER,
      active: this._settings.get_boolean("show-comment-in-forecast"),
    });
    let forecastConditionsRow = new Adw.ActionRow({
      title: _("Conditions In Forecast"),
      subtitle: _("Show the condition text (e.g. \"Cloudy\") in the forecast."),
      activatable_widget: forecastConditionsSwitch,
    });
    forecastConditionsRow.add_suffix(forecastConditionsSwitch);

    // Forecast days
    let forecastDaysSpinButton = new Gtk.SpinButton({
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 31,
        step_increment: 1,
        page_increment: 3,
        value: this._settings.get_int("days-forecast"),
      }),
      climb_rate: 1,
      digits: 0,
      numeric: true,
      valign: Gtk.Align.CENTER
    });
    let forecastDaysRow = new Adw.ActionRow({
      title: _("Total Days In Forecast"),
      tooltip_text: _(
        "Number of days to show in forecast where a setting of \"0\" is only today"
      ),
      subtitle: _("Number of days to show in forecast. \"0\" means only show today.\nDifferent providers support different amounts of days.\nCurrently \"%s\" supports the furthest forecast of %s days.").format("Visual Crossing", "14"),
      activatable_widget: forecastDaysSpinButton,
    });
    forecastDaysRow.add_suffix(forecastDaysSpinButton);

    // Keep forecast expanded
    let forecastExpandedSwitch = new Gtk.Switch({
      valign: Gtk.Align.CENTER,
      active: this._settings.get_boolean("expand-forecast"),
    });
    let forecastExpandedRow = new Adw.ActionRow({
      title: _("Keep Forecast Expanded"),
      subtitle: _("Automatically open the forecast when the pop-up is opened."),
      activatable_widget: forecastExpandedSwitch,
    });
    forecastExpandedRow.add_suffix(forecastExpandedSwitch);

    forecastGroup.add(centerForecastRow);
    forecastGroup.add(forecastConditionsRow);
    forecastGroup.add(forecastDaysRow);
    forecastGroup.add(forecastExpandedRow);
    this.add(forecastGroup);

    // Bind signals
    panelPositionRow.connect("notify::selected", (widget) => {
      this._settings.set_enum("position-in-panel", widget.selected);
    });
    positionOffsetSpinButton.connect("value-changed", (widget) => {
      this._settings.set_int("position-index", widget.get_value());
    });
    temperatureInPanelSwitch.connect("notify::active", (widget) => {
      this._settings.set_boolean("show-text-in-panel", widget.get_active());
    });
    conditionsInPanelSwitch.connect("notify::active", (widget) => {
      this._settings.set_boolean("show-comment-in-panel", widget.get_active());
    });
    sunsetriseInPanelSwitch.connect("notify::active", (widget) => {
      let active = widget.get_active();
      this._settings.set_boolean("show-sunsetrise-in-panel", active);
      sunsetriseFirstRow.set_sensitive(active);
    });
    sunsetriseFirstSwitch.connect("notify::active", (widget) => {
      this._settings.set_boolean("sun-in-panel-first", widget.get_active());
    });
    weatherPopupPositionScale.connect("value-changed", (widget) => {
      this._settings.set_double("menu-alignment", widget.get_value());
    });
    windArrowsSwitch.connect("notify::active", (widget) => {
      this._settings.set_boolean("wind-direction", widget.get_active());
    });
    translateConditionsSwitch.connect("notify::active", (widget) => {
      this._settings.set_boolean("translate-condition", widget.get_active());
    });
    temperatureDigitsRow.connect("notify::selected", (widget) => {
      this._settings.set_int("decimal-places", widget.selected);
    });
    pressureDigitsRow.connect("notify::selected", (widget) => {
      // -2 because -2 = Unit Default, -1 = Follow Temperature
      this._settings.set_int("pressure-decimal-places", widget.selected - 2);
    });
    speedDigitsRow.connect("notify::selected", (widget) => {
      // -1 because -1 = Follow Temperature
      this._settings.set_int("speed-decimal-places", widget.selected - 1);
    });
    locationLengthSpinButton.connect("value-changed", (widget) => {
      this._settings.set_int("location-text-length", widget.get_value());
    });
    hiContrastRow.connect("notify::selected", (widget) => {
      this._settings.set_enum("hi-contrast", widget.selected);
    });
    centerForecastSwitch.connect("notify::active", (widget) => {
      this._settings.set_boolean("center-forecast", widget.get_active());
    });
    forecastConditionsSwitch.connect("notify::active", (widget) => {
      this._settings.set_boolean(
        "show-comment-in-forecast",
        widget.get_active()
      );
    });
    forecastDaysSpinButton.connect("value-changed", (widget) => {
      this._settings.set_int("days-forecast", widget.get_value());
    });
    forecastExpandedSwitch.connect("notify::active", (widget) => {
      this._settings.set_boolean("expand-forecast", widget.get_active());
    });
    // Detect settings changes to enable/disable related options
    this._settings.connect("changed", () => {
      if(this._settings.get_boolean("frozen")) return;

      if (this._disableForecastChanged()) {
        if (this._settings.get_boolean("disable-forecast")) {
          forecastGroup.set_sensitive(false);
        } else {
          forecastGroup.set_sensitive(true);
        }
      } else if (this._providerTranslationsChanged()) {
        if (this._settings.get_boolean("owm-api-translate")) {
          translateConditionsRow.set_visible(false);
        } else {
          translateConditionsRow.set_visible(true);
        }
      }
    });
  }
  _disableForecastChanged() {
    let _disableForecast = this._settings.get_boolean("disable-forecast");
    if (this.disableForecast !== _disableForecast) {
      this.disableForecast = _disableForecast;
      return true;
    }
    return false;
  }
  _providerTranslationsChanged() {
    let _providerTranslations = this._settings.get_boolean("owm-api-translate");
    if (this.providerTranslations !== _providerTranslations) {
      this.providerTranslations = _providerTranslations;
      return true;
    }
    return false;
  }
}
export { LayoutPage };
