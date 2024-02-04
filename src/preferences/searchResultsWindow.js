import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import GObject from "gi://GObject";
import Soup from "gi://Soup";
import GLib from "gi://GLib";

import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

import { GeolocationProvider } from "../constants.js";
import { Loc, settingsGetLocs, settingsSetLocs } from "../locs.js";

class SearchResultsWindow extends Adw.PreferencesWindow
{
  static {
    GObject.registerClass(this);
  }

  constructor(metadata, parent, settings, location)
  {
    let provider = settings.get_enum("geolocation-provider");
    let provName;
    switch(provider)
    {
      case GeolocationProvider.OPENSTREETMAPS:
        provName = "Nominatim/OSM";
        break;
      case GeolocationProvider.MAPQUEST:
        provName = "MapQuest";
        break;
      default:
        provName = String(provider);
        break;
    }

    super({
      title: _("Search Results from %s").format(provName),
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
    this._provider = provider;

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

  async _findLocation()
  {
    // OpenStreetMaps
    if (this._provider === GeolocationProvider.OPENSTREETMAPS) {
      let params = {
        format: "json",
        addressdetails: "1",
        q: this._location,
      };
      let _osmUrl = "https://nominatim.openstreetmap.org/search";
      try
      {
        let json = await this._loadJsonAsync(_osmUrl, params);
        if(!json)
        {
          this._resultsError(true);
          throw new Error("Server returned an invalid response");
        }
        if(Number(json.length) < 1)
        {
          this._resultsError(false);
          return 0;
        }
        
        this._processResults(json);
      }
      catch (e)
      {
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
      try
      {
        let json = await this._loadJsonAsync(_mqUrl, params);
        if (!json)
        {
          this._resultsError(true);
          throw new Error("Server returned an invalid response");
        }
        if (Number(json.length) < 1) {
          this._resultsError(false);
          return 0;
        } else {
          this._processResults(json);
          return 0;
        }
      }
      catch(e)
      {
        console.warn("_findLocation MapQuest error: " + e);
      }
    }

    return null;
  }

  _loadJsonAsync(url, params)
  {
    return new Promise((resolve, reject) => {
      // Create user-agent string from uuid and the version
      let _userAgent = this.metadata.uuid;
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
        (sess, msg) => {
          try
          {
            let jsonString = sess.send_and_read_finish(msg).get_data();
            if (jsonString instanceof Uint8Array)
            {
              jsonString = new TextDecoder().decode(jsonString);
            }

            if (!jsonString)
            {
              throw new Error("No data in response body");
            }

            resolve(JSON.parse(jsonString));
          }
          catch (e)
          {
            sess.abort();
            reject(e);
          }
        }
      );
    });
  }
  _processResults(json)
  {
    this.resultsUi = {};
    this.resultsGroup.remove(this.resultsStatus);
    this.resultsGroup.set_title(
      _('Results for "%s"').format(this._location)
    );
    // Build search results list UI
    for (let i in json)
    {
      this.resultsUi[i] = {};

      let name;
      let lat;
      let lon;

      try
      {
        name = json[i].display_name;
        lat = parseFloat(json[i].lat);
        lon = parseFloat(json[i].lon);
      }
      catch(e)
      {
        console.error("OpenWeather Refined: Error processing results: " + e);
        return;
      }

      let coordsText = `${lat}, ${lon}`;
      let simpleName = this._simplifyName(name);

      this.resultsUi[i].Row = new Adw.ActionRow({
        title: simpleName,
        subtitle: coordsText,
        tooltip_text: name,
        icon_name: "find-location-symbolic",
        activatable: true
      });
      this.resultsGroup.add(this.resultsUi[i].Row);

      this.resultsUi[i].Row.connect("activated", () => {
        this._saveResult(simpleName, lat, lon);
      });
    }
  }

  // Simplify the name returned by OSM.
  _simplifyName(s)
  {
    // Locations in the USA I'd expect to be City, State.
    // Plus a city isn't always in one county anyway so this is hardly
    // accurate
    let usa = s.match(/^(.+), .+ County, (.+), United States$/);
    if(usa)
    {
        let city = usa[1];
        let state = usa[2];
        return `${city}, ${state}`;
    }
    else return s;
  }

  _saveResult(name, lat, lon)
  {
    let locs = settingsGetLocs(this._settings);

    locs.push(Loc.fromNameCoords(name, lat, lon));

    settingsSetLocs(this._settings, locs);

    let _toast = new Adw.Toast({
      title: _("%s has been added").format(name),
    });
    this._window.add_toast(_toast);
    this.close();
    return;
  }

  _resultsError(error)
  {
    if (error)
    {
      this.resultsStatus.set_title(_("API Error"));
      this.resultsStatus.set_description(
        _('Invalid data when searching for "%s".').format(this._location)
      );
      this.resultsStatus.set_icon_name("dialog-error-symbolic");
    }
    else
    {
      this.resultsStatus.set_title(_("No Matches Found"));
      this.resultsStatus.set_description(
        _('No results found when searching for "%s".').format(this._location)
      );
    }
    return;
  }

  _destroy()
  {
    this.destroy();
    return;
  }
}

export { SearchResultsWindow };
