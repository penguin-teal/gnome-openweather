import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import GObject from "gi://GObject";
import Soup from "gi://Soup";
import GLib from "gi://GLib";

import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

import { GeolocationProvider } from "../constants.js";

class SearchResultsWindow extends Adw.PreferencesWindow {
  static {
    GObject.registerClass(this);
  }

  constructor(metadata, parent, settings, location) {
    super({
      title: _("Search Results"),
      transient_for: parent,
      search_enabled: false,
      modal: true,
    });
    let mainPage = new Adw.PreferencesPage();
    this.add(mainPage);
    this.metadata = metadata;
    this._window = parent;
    this._settings = settings;
    this._location = location;
    this._provider = this._settings.get_enum("geolocation-provider");

    // Search results group
    let searchButton = new Gtk.Button({
      child: new Adw.ButtonContent({
        icon_name: "edit-find-symbolic",
        label: _("New Search"),
      }),
    });
    this.resultsGroup = new Adw.PreferencesGroup({
      header_suffix: searchButton,
    });
    this.resultsStatus = new Adw.StatusPage({
      title: _("Searching ..."),
      description: _(
        'Please wait while searching for locations matching "%s"'
      ).format(this._location),
      icon_name: "edit-find-symbolic",
      hexpand: true,
      vexpand: true,
    });
    this.resultsGroup.add(this.resultsStatus);
    mainPage.add(this.resultsGroup);
    // Query provider and load the results
    this._findLocation();

    // Bind signals
    searchButton.connect("clicked", () => {
      this._window.get_visible_page()._addLocation();
      this.close();
      return 0;
    });
    this.connect("close-request", this._destroy.bind(this));
  }
  async _findLocation() {
    let json = null;
    // OpenStreetMaps
    if (this._provider === GeolocationProvider.OPENSTREETMAPS) {
      let params = {
        format: "json",
        addressdetails: "1",
        q: this._location,
      };
      let _osmUrl = "https://nominatim.openstreetmap.org/search";
      try {
        json = await this._loadJsonAsync(_osmUrl, params).then(async (json) => {
          if (!json) {
            this._resultsError(true);
            throw new Error("Server returned an invalid response");
          }
          if (Number(json.length) < 1) {
            this._resultsError(false);
            return 0;
          } else {
            await this._processResults(json);
            return 0;
          }
        });
      } catch (e) {
        console.warn("_findLocation OpenStreetMap error: " + e);
      }
    }
    // MapQuest
    else if (this._provider === GeolocationProvider.MAPQUEST) {
      let _mqKey = this._settings.get_string("geolocation-appid-mapquest");
      if (_mqKey === "") {
        this.resultsStatus.set_title(_("AppKey Required"));
        this.resultsStatus.set_description(
          _("You need an AppKey to use MapQuest, get one at: %s").format(
            "developer.mapquest.com"
          )
        );
        this.resultsStatus.set_icon_name("dialog-error-symbolic");
        return 0;
      }
      let params = {
        key: _mqKey,
        format: "json",
        addressdetails: "1",
        q: this._location,
      };
      let _mqUrl = "https://open.mapquestapi.com/nominatim/v1/search.php";
      try {
        json = await this._loadJsonAsync(_mqUrl, params).then(async (json) => {
          if (!json) {
            this._resultsError(true);
            throw new Error("Server returned an invalid response");
          }
          if (Number(json.length) < 1) {
            this._resultsError(false);
            return 0;
          } else {
            await this._processResults(json);
            return 0;
          }
        });
      } catch (e) {
        console.warn("_findLocation MapQuest error: " + e);
      }
    }
    // Geocode.Farm
    else if (this._provider === GeolocationProvider.GEOCODE) {
      let params = {
        addr: this._location,
      };
      let _gcodeUrl = "https://www.geocode.farm/v3/json/forward";
      try {
        json = await this._loadJsonAsync(_gcodeUrl, params).then(
          async (json) => {
            if (!json) {
              this._resultsError(true);
              throw new Error("Server returned an invalid response");
            } else {
              json = json.geocoding_results;
              if (Number(json.length) < 1) {
                this._resultsError(true);
                throw new Error("Server returned an empty response");
              } else {
                if (
                  Number(json.STATUS.result_count) < 1 ||
                  !json.STATUS.result_count
                ) {
                  this._resultsError(false);
                  return 0;
                }
                await this._processResults(json.RESULTS);
              }
            }
          }
        );
      } catch (e) {
        console.warn("_findLocation Geocode error: " + e);
      }
    }
    return 0;
  }
  _loadJsonAsync(url, params) {
    return new Promise((resolve, reject) => {
      // Create user-agent string from uuid and the version
      let _userAgent = this.metadata.uuid;
      if (
        this.metadata.version !== undefined &&
        this.metadata.version.toString().trim() !== ""
      ) {
        _userAgent += "/";
        _userAgent += this.metadata.version.toString();
      }

      let _httpSession = new Soup.Session();
      let _paramsHash = Soup.form_encode_hash(params);
      let _message = Soup.Message.new_from_encoded_form(
        "GET",
        url,
        _paramsHash
      );
      // add trailing space, so libsoup adds its own user-agent
      _httpSession.user_agent = _userAgent + " ";

      _httpSession.send_and_read_async(
        _message,
        GLib.PRIORITY_DEFAULT,
        null,
        (_httpSession, _message) => {
          let _jsonString = _httpSession
            .send_and_read_finish(_message)
            .get_data();
          if (_jsonString instanceof Uint8Array) {
            _jsonString = new TextDecoder().decode(_jsonString);
          }
          try {
            if (!_jsonString) {
              throw new Error("No data in response body");
            }
            resolve(JSON.parse(_jsonString));
          } catch (e) {
            _httpSession.abort();
            reject(e);
          }
        }
      );
    });
  }
  _processResults(json) {
    return new Promise((resolve, reject) => {
      try {
        this.resultsUi = {};
        this.resultsGroup.remove(this.resultsStatus);
        this.resultsGroup.set_title(
          _('Results for "%s"').format(this._location)
        );
        // Build search results list UI
        for (let i in json) {
          this.resultsUi[i] = {};

          let _cityText = json[i]["display_name"];
          let _cityCoord = json[i]["lat"] + "," + json[i]["lon"];
          if (this._provider === GeolocationProvider.GEOCODE) {
            _cityText = json[i].formatted_address;
            _cityCoord =
              json[i].COORDINATES.latitude +
              "," +
              json[i].COORDINATES.longitude;
          }
          this.resultsUi[i].Row = new Adw.ActionRow({
            title: _cityText,
            subtitle: _cityCoord,
            icon_name: "find-location-symbolic",
            activatable: true,
          });
          this.resultsGroup.add(this.resultsUi[i].Row);
        }
        // Bind signals
        for (let i in this.resultsUi) {
          this.resultsUi[i].Row.connect("activated", (widget) => {
            this._saveResult(widget);
            return 0;
          });
        }
        resolve(0);
      } catch (e) {
        reject("Error processing results: " + e);
      }
    });
  }
  _saveResult(widget) {
    let _location = widget.get_title();
    let _coord = widget.get_subtitle();
    let _city = this._settings.get_string("city");

    if (_city) {
      _city = _city + " && " + _coord + ">" + _location + ">0";
      this._settings.set_string("city", _city);
    } else {
      _city = _coord + ">" + _location + ">0";
      this._settings.set_string("city", _city);
    }
    let _toast = new Adw.Toast({
      title: _("%s has been added").format(_location),
    });
    this._window.add_toast(_toast);
    this.close();
    return 0;
  }
  _resultsError(error) {
    if (error) {
      this.resultsStatus.set_title(_("API Error"));
      this.resultsStatus.set_description(
        _('Invalid data when searching for "%s".').format(this._location)
      );
      this.resultsStatus.set_icon_name("dialog-error-symbolic");
    } else {
      this.resultsStatus.set_title(_("No Matches Found"));
      this.resultsStatus.set_description(
        _('No results found when searching for "%s".').format(this._location)
      );
    }
    return 0;
  }
  _destroy() {
    this.destroy();
    return 0;
  }
}

export { SearchResultsWindow };
