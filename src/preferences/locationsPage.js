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

import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import GObject from "gi://GObject";

import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

import { SearchResultsWindow } from "./searchResultsWindow.js";
import { GeolocationProvider } from "../constants.js";
import { Loc, settingsGetLocs, settingsSetLocs, NAME_TYPE, PLACE_TYPE } from "../locs.js";

class LocationsPage extends Adw.PreferencesPage
{
  static {
    GObject.registerClass(this);
  }

  cityIndex;

  constructor(metadata, settings, parent)
  {
    super({
      title: _("Locations"),
      icon_name: "find-location-symbolic",
      name: "LocationsPage",
    });
    this.metadata = metadata;
    this._window = parent;
    this._settings = settings;
    this._count = null;
    this._locListUi = null;
    this.cityIndex = this._settings.get_int("actual-city");
    let locationProvider = this._settings.get_enum("geolocation-provider");

    // Locations list group
    let addLocationButton = new Gtk.Button({
      child: new Adw.ButtonContent({
        icon_name: "list-add-symbolic",
        label: _("Add"),
      }),
    });
    this.locationsGroup = new Adw.PreferencesGroup({
      title: _("Locations"),
      header_suffix: addLocationButton,
    });
    this._refreshLocations();
    this.add(this.locationsGroup);

    // Geolocation providers group
    let providersGroup = new Adw.PreferencesGroup({
      title: _("Provider"),
    });

    let myLocProvsList = new Gtk.StringList();
    myLocProvsList.append("Built-In + Nominatim");
    myLocProvsList.append("infoip.io");
    this._lastMyLocProv = this._settings.get_enum("my-loc-prov");
    let myLocProvsListRow = new Adw.ComboRow({
      title: _("My Loc. Provider"),
      subtitle: _("Provider for getting My Location"),
      model: myLocProvsList,
      selected: this._lastMyLocProv
    });

    let providersList = new Gtk.StringList();
    providersList.append("Nominatim/OSM");
    providersList.append("MapQuest");
    let providersListRow = new Adw.ComboRow({
      title: _("Geolocation Provider"),
      subtitle: _("Provider used for location search"),
      model: providersList,
      selected: locationProvider > 0 ? locationProvider - 1 : 0,
    });
    // Personal MapQuest API key
    let personalApiKeyMQEntry = new Gtk.Entry({
      max_length: 32,
      width_chars: 20,
      vexpand: false,
      sensitive: locationProvider === GeolocationProvider.MAPQUEST,
      valign: Gtk.Align.CENTER,
    });
    let personalApiKeyMQRow = new Adw.ActionRow({
      title: _("Personal MapQuest Key"),
      subtitle: _("Personal API Key from developer.mapquest.com"),
      activatable_widget: personalApiKeyMQEntry,
    });
    let personalApiKeyMQ = this._settings.get_string(
      "geolocation-appid-mapquest"
    );
    if (personalApiKeyMQ !== "") {
      if (personalApiKeyMQ.length !== 32) {
        personalApiKeyMQEntry.set_icon_from_icon_name(
          Gtk.PositionType.LEFT,
          "dialog-warning"
        );
      } else {
        personalApiKeyMQEntry.set_icon_from_icon_name(
          Gtk.PositionType.LEFT,
          ""
        );
      }
      personalApiKeyMQEntry.set_text(personalApiKeyMQ);
    } else {
      personalApiKeyMQEntry.set_text("");
      personalApiKeyMQEntry.set_icon_from_icon_name(
        Gtk.PositionType.LEFT,
        "dialog-warning"
      );
    }

    personalApiKeyMQRow.add_suffix(personalApiKeyMQEntry);
    providersGroup.add(myLocProvsListRow);
    providersGroup.add(providersListRow);
    providersGroup.add(personalApiKeyMQRow);
    this.add(providersGroup);

    // Bind signals
    addLocationButton.connect("clicked", this._addLocation.bind(this));
    // Detect change in locations
    this._settings.connect("changed", () => {
      if(this._settings.get_boolean("frozen")) return;

      if (this._locationsChanged())
      {
        this.cityIndex = this._settings.get_int("actual-city");
        this._refreshLocations();
      }

      if(this.myLocProvChanged())
      {
        myLocProvsListRow.selected = this._settings.get_enum("my-loc-prov");
      }
    });
    myLocProvsListRow.connect("notify::selected", widget => {
      this._settings.set_enum("my-loc-prov", widget.selected);
    });
    providersListRow.connect("notify::selected", (widget) => {
      let isMapQuest = false;
      let inx;
      switch(widget.selected)
      {
        case 0:
          inx = GeolocationProvider.OPENSTREETMAPS;
          break;
        case 1:
          inx = GeolocationProvider.MAPQUEST;
          isMapQuest = true;
          break;
        default:
          inx = GeolocationProvider.OPENSTREETMAPS;
          break;
      }
      personalApiKeyMQEntry.set_sensitive(isMapQuest);
      this._settings.set_enum("geolocation-provider", inx);
    });
    personalApiKeyMQEntry.connect("notify::text", (widget) => {
      if (widget.text.length === 32) {
        this._settings.set_string("geolocation-appid-mapquest", widget.text);
        personalApiKeyMQEntry.set_icon_from_icon_name(
          Gtk.PositionType.LEFT,
          ""
        );
      } else {
        personalApiKeyMQEntry.set_icon_from_icon_name(
          Gtk.PositionType.LEFT,
          "dialog-warning"
        );
        if (widget.text.length === 0) {
          this._settings.set_string("geolocation-appid-mapquest", "");
        }
      }
    });
  }

  _refreshLocations()
  {
    let locs = settingsGetLocs(this._settings);

    // Check if the location list UI needs updating
    if (this._locationsChanged(locs))
    {
      if (locs.length > 0)
      {
        // Remove the old list
        if (this._count)
        {
          for (let i = 0; i < this._count; i++)
          {
            this.locationsGroup.remove(this.location[i].Row);
          }
          this._count = null;
        }

        this.location = [];
        // Build new location UI list
        for (let i = 0; i < locs.length; i++)
        {
          this.location[i] = {};
          this.location[i].ButtonBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            halign: Gtk.Align.CENTER,
            spacing: 5,
            hexpand: false,
            vexpand: false,
          });
          this.location[i].EditButton = new Gtk.Button({
            icon_name: "document-edit-symbolic",
            valign: Gtk.Align.CENTER,
            hexpand: false,
            vexpand: false,
          });
          this.location[i].DeleteButton = new Gtk.Button({
            icon_name: "edit-delete-symbolic",
            valign: Gtk.Align.CENTER,
            css_classes: ["error"],
            hexpand: false,
            vexpand: false,
          });
          this.location[i].Row = new Adw.ActionRow({
            title: locs[i].getName(_),
            subtitle: locs[i].getPlaceDisplay(_),
            activatable: true,
          });
          this.location[i].ButtonBox.append(this.location[i].EditButton);
          this.location[i].ButtonBox.append(this.location[i].DeleteButton);
          this.location[i].Row.add_suffix(this.location[i].ButtonBox);
          this.locationsGroup.add(this.location[i].Row);
          this._setIcon(i, i === this.cityIndex);
        }
        // Bind signals
        for (let i = 0; i < this.location.length; i++)
        {
          this.location[i].EditButton.connect("clicked", () => {
            this._editLocation(i);
          });
          this.location[i].DeleteButton.connect("clicked", () => {
            this._deleteLocation(i);
          });
          this.location[i].Row.connect("activated", () => {
            if (i !== this.cityIndex)
            {
              this._setIcon(this.cityIndex, false);
              this._setIcon(i, true);

              this.cityIndex = i;
              this._settings.set_int("actual-city", i);
              let _toast = new Adw.Toast({
                title: _("Location changed to: %s").format(
                  this.location[i].Row.get_title()
                ),
              });
              this._window.add_toast(_toast);
            }
            return 0;
          });
        }
        this._count = this.location.length;
      }
      this._locListUi = locs;
    }
    else if(this._count)
    {
      for(let i = 0; i < this.location.length; i++)
      {
        this._setIcon(i, i === this.cityIndex);
      }
    }
  }

  _setIcon(index, isOn)
  {
    this.location[index].Row.set_icon_name(isOn ? "checkbox-checked-symbolic" : "checkbox-symbolic");
  }

  _addLocation()
  {
    let _dialog = new Gtk.Dialog({
      title: _("Add New Location"),
      use_header_bar: true,
      transient_for: this._window,
      default_width: 600,
      default_height: -1,
      modal: true,
    });
    let _dialogPage = new Adw.PreferencesPage();
    let _dialogGroup = new Adw.PreferencesGroup();
    let _dialogRow = new Adw.PreferencesRow({
      activatable: false,
      focusable: false,
    });
    let _dialogBox = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      margin_top: 10,
      margin_bottom: 10,
      margin_start: 10,
      margin_end: 10,
    });
    let _findLabel = new Gtk.Label({
      label: _("Search by Location or Coordinates"),
      halign: Gtk.Align.START,
      margin_bottom: 5,
      hexpand: true,
    });
    let _findEntry = new Gtk.Entry({
      placeholder_text: _("e.g. London, England or 51.5074456,-0.1277653"),
      secondary_icon_name: "edit-clear-symbolic",
      secondary_icon_tooltip_text: _("Clear entry"),
      valign: Gtk.Align.CENTER,
      activates_default: true,
      hexpand: true,
      vexpand: false,
      margin_bottom: 5
    });
    let myLocBtn = new Gtk.Button({
      label: _("My Location"),
      valign: Gtk.Align.END,
      hexpand: true,
      vexpand: false,
      margin_bottom: 5
    });
    let _searchButton = new Gtk.Button({
      child: new Adw.ButtonContent({
        icon_name: "edit-find-symbolic",
        label: _("Search"),
      }),
      css_classes: ["suggested-action"],
    });
    _dialog.add_action_widget(_searchButton, 0);
    _dialog.set_default_response(0);
    let _dialogArea = _dialog.get_content_area();

    _dialogBox.append(_findLabel);
    _dialogBox.append(_findEntry);
    _dialogBox.append(myLocBtn);
    _dialogRow.set_child(_dialogBox);
    _dialogGroup.add(_dialogRow);
    _dialogPage.add(_dialogGroup);
    _dialogArea.append(_dialogPage);
    _dialog.show();

    // Bind signals
    _dialog.connect("response", (w, response) => {
      if (response === 0)
      {
        let location = _findEntry.get_text().trim();
        if (!location)
        {
          // no input
          let _toast = new Adw.Toast({
            title: _("We need something to search for!"),
          });
          this._window.add_toast(_toast);
          return 0;
        }
        let resultsWindow = new SearchResultsWindow(
          this.metadata,
          this._window,
          this._settings,
          location
        );
        resultsWindow.show();
      }
      _dialog.close();
      return 0;
    });
    _findEntry.connect("icon-release", (widget) => {
      widget.set_text("");
    });
    myLocBtn.connect("clicked", () =>
    {
      let locs = settingsGetLocs(this._settings);
      if(!locs) locs = [ ];

      locs.push(Loc.myLoc());

      settingsSetLocs(this._settings, locs);

      let toast = new Adw.Toast({
        title: _("%s has been added").format(_("My Location")),
      });
      this._window.add_toast(toast);
      _dialog.destroy();
    });
    _dialog.connect("close-request", () => {
      _dialog.destroy();
    });
    return 0;
  }

  _editLocation(selected)
  {
    let locs = settingsGetLocs(this._settings);

    let _dialog = new Gtk.Dialog({
      title: _("Edit %s").format(locs[selected].getName(_)),
      use_header_bar: true,
      transient_for: this._window,
      default_width: 600,
      default_height: -1,
      modal: true,
    });
    let _dialogPage = new Adw.PreferencesPage();
    let _dialogGroup = new Adw.PreferencesGroup();
    let _dialogRow = new Adw.PreferencesRow({
      activatable: false,
      focusable: false,
    });
    let _dialogBox = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      margin_top: 10,
      margin_bottom: 10,
      margin_start: 10,
      margin_end: 10,
    });
    // location display name
    let _editNameLabel = new Gtk.Label({
      label: _("Edit Name"),
      halign: Gtk.Align.START,
      margin_bottom: 5,
      hexpand: true,
    });
    
    let name = locs[selected].isSpecialName() ? "" : locs[selected].getName(_);
    let place;
    if(locs[selected].isMyLoc()) place = "here";
    else
    {
      let latLon = locs[selected].getKnownCoordsSync();
      place = `${latLon[0]}, ${latLon[1]}`;
    }

    let _editNameEntry = new Gtk.Entry({
      text: name,
      secondary_icon_name: "edit-clear-symbolic",
      secondary_icon_tooltip_text: _("Clear entry"),
      valign: Gtk.Align.CENTER,
      activates_default: true,
      hexpand: true,
      vexpand: false,
    });
    // location coordinates
    let _editCoordLabel = new Gtk.Label({
      label: _("Edit Coordinates"),
      halign: Gtk.Align.START,
      margin_top: 10,
      margin_bottom: 5,
      hexpand: true,
    });
    let _editCoordEntry = new Gtk.Entry({
      text: place,
      secondary_icon_name: "edit-clear-symbolic",
      secondary_icon_tooltip_text: _("Clear entry"),
      valign: Gtk.Align.CENTER,
      activates_default: true,
      hexpand: true,
      vexpand: false,
    });
    let searchLocNotice = new Gtk.Label({
      label: _("If you meant to search up a new location by name, " +
        "<b>add</b> a location instead."),
      use_markup: true,
      margin_top: 15,
      margin_bottom: 5
    });
    let _saveButton = new Gtk.Button({
      child: new Adw.ButtonContent({
        icon_name: "document-save-symbolic",
        label: _("Save"),
      }),
      css_classes: ["suggested-action"],
    });
    _dialog.add_action_widget(_saveButton, 0);
    _dialog.set_default_response(0);
    let _dialogArea = _dialog.get_content_area();

    _dialogBox.append(_editNameLabel);
    _dialogBox.append(_editNameEntry);
    _dialogBox.append(_editCoordLabel);
    _dialogBox.append(_editCoordEntry);
    _dialogBox.append(searchLocNotice);
    _dialogRow.set_child(_dialogBox);
    _dialogGroup.add(_dialogRow);
    _dialogPage.add(_dialogGroup);
    _dialogArea.append(_dialogPage);
    _dialog.show();

    // Bind signals
    _editNameEntry.connect("icon-release", (widget) => {
      widget.set_text("");
    });
    _editCoordEntry.connect("icon-release", (widget) => {
      widget.set_text("");
    });
    _dialog.connect("response", (w, response) => {
      if (response === 0) {
        let _location = _editNameEntry.get_text();
        let _coord = _editCoordEntry.get_text();
        let _provider = 0; // preserved for future use

        if (!_coord)
        {
          let _toast = new Adw.Toast({
            title: _("Coordinates field cannot be empty."),
          });
          this._window.add_toast(_toast);
          return 0;
        }
        else if(_coord !== "here" && !/^\s*-?\s*[0-9]*\.[0-9]+\s*,\s*-?\s*[0-9]*\.[0-9]+\s*$/.test(_coord))
        {
          let toast = new Adw.Toast({
            title: _("Coordinates field must be in the format of '%s' or the text '%s'.").format("0.0, 0.0", "here")
          });
          this._window.add_toast(toast);
          return 0;
        }
        else if(!_location && _coord !== "here")
        {
          let toast = new Adw.Toast({
            title: _("Name field can only be empty if coordinates are '%s'.").format("here")
          });
          this._window.add_toast(toast);
          return 0;
        }

        let nameTy, placeTy, newPlace;
        if(_coord === "here")
        {
          nameTy = !_location ? NAME_TYPE.MY_LOC : NAME_TYPE.CUSTOM;
          placeTy = PLACE_TYPE.MY_LOC;
          newPlace = "";
        }
        else
        {
          nameTy = NAME_TYPE.CUSTOM;
          placeTy = PLACE_TYPE.COORDS;
          let split = _coord.split(",");
          for(let i = 0; i < 2; i++)
          {
            split[i] = split[i].replace(/\s/g, "");
          }
          newPlace = `${split[0]},${split[1]}`;
        }
        locs[selected] = new Loc(nameTy, _location, placeTy, newPlace);

        settingsSetLocs(this._settings, locs);

        let _toast = new Adw.Toast({
          title: _("%s has been updated").format(locs[selected].getName(_)),
        });
        this._window.add_toast(_toast);
      }
      _dialog.close();
      return 0;
    });
    _dialog.connect("close-request", () => {
      _dialog.destroy();
    });
    return 0;
  }

  _deleteLocation(selected)
  {
    let locs = settingsGetLocs(this._settings);

    if (!locs.length) return;

    let _dialog = new Gtk.Dialog({
      title: "",
      use_header_bar: true,
      transient_for: this._window,
      resizable: false,
      modal: true,
    });
    let _dialogPage = new Adw.PreferencesPage();
    let _dialogGroup = new Adw.PreferencesGroup();
    let _selectedName = locs[selected].getName(_);

    let _dialogRow = new Adw.ActionRow({
      title: _('Are you sure you want to delete "%s"?').format(_selectedName),
      icon_name: "help-about-symbolic",
      activatable: false,
      focusable: false,
    });
    let _dialogButton = new Gtk.Button({
      child: new Adw.ButtonContent({
        icon_name: "edit-delete-symbolic",
        label: _("Delete"),
      }),
      css_classes: ["destructive-action"],
    });
    _dialog.add_button(_("Cancel"), 0);
    _dialog.add_action_widget(_dialogButton, 1);
    _dialog.set_default_response(0);

    let _dialogArea = _dialog.get_content_area();
    _dialogGroup.add(_dialogRow);
    _dialogPage.add(_dialogGroup);
    _dialogArea.append(_dialogPage);
    _dialog.show();

    _dialog.connect("response", (w, response) => {
      if (response === 1)
      {
        if (locs.length) locs.splice(selected, 1);

        if (this.cityIndex >= selected)
        {
          let newI = selected ? selected - 1 : 0;
          this._settings.set_int("actual-city", newI);
          this.cityIndex = newI;

          // this may not change anything,
          // or if the deleted one is selected select the last one
          if(this.location && this.location[newI]) this._setIcon(newI, true);
        }

        settingsSetLocs(this._settings, locs);

        let _toast = new Adw.Toast({
          title: _("%s has been deleted").format(_selectedName),
        });
        this._window.add_toast(_toast);
      }
      _dialog.close();
      return;
    });
    _dialog.connect("close-request", () => {
      _dialog.destroy();
    });
  }

  _locationsChanged(current)
  {
    return !Loc.arrsEqual(this._locListUi, current);
  }

  myLocProvChanged()
  {
    return this._lastMyLocProv !== this._settings.get_enum("my-loc-prov");
  }
}

export { LocationsPage };
