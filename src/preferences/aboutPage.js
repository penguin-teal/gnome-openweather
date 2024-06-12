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
import GLib from "gi://GLib";

import { PACKAGE_VERSION } from "resource:///org/gnome/Shell/Extensions/js/misc/config.js";

import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";
import { Loc, settingsGetLocs, settingsGetKeys, toLocsGVariant } from "../locs.js";
import { getWeatherProviderName, getWeatherProviderUrl } from "../getweather.js";

function getLocale()
{
    let locale = GLib.get_language_names()[0];
    if (locale.indexOf("_") !== -1) return locale.split("_")[0];
    // Fallback for 'C', 'C.UTF-8', and unknown locales.
    else return "en";
}

class AboutPage extends Adw.PreferencesPage {
  static {
    GObject.registerClass(this);
  }

  constructor(metadata, settings, wnd)
  {
    super({
      title: _("About"),
      icon_name: "help-about-symbolic",
      name: "AboutPage",
      margin_start: 10,
      margin_end: 10,
    });

    // Extension logo and description
    let aboutGroup = new Adw.PreferencesGroup();
    let aboutBox = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      hexpand: false,
      vexpand: false,
    });
    let openWeatherImage = new Gtk.Image({
      icon_name: "openweather-icon",
      margin_bottom: 5,
      pixel_size: 100,
    });
    let openWeatherLabel = new Gtk.Label({
      label: '<span size="larger"><b>OpenWeather Refined</b></span>',
      use_markup: true,
      margin_bottom: 15,
      vexpand: true,
      valign: Gtk.Align.FILL,
    });
    let aboutDescription = new Gtk.Label({
      label: _(
        "Display weather information for any location on Earth in the GNOME Shell."
      ),
      margin_bottom: 3,
      hexpand: false,
      vexpand: false,
    });

    aboutBox.append(openWeatherImage);
    aboutBox.append(openWeatherLabel);
    aboutBox.append(aboutDescription);
    aboutGroup.add(aboutBox);
    this.add(aboutGroup);

    // Info group
    let infoGroup = new Adw.PreferencesGroup();
    let releaseVersion = String(metadata["version-name"] ?? _("Unknown"));
    let gitVersion = String(metadata["git-version"] ?? _("Unknown"));

    // Extension version
    let openWeatherVersionRow = new Adw.ActionRow({
      title: _("OpenWeather Refined Version"),
    });
    openWeatherVersionRow.add_suffix(
      new Gtk.Label({
        label: releaseVersion,
      })
    );

    // Git version for self builds
    let gitVersionRow = null;
    if (gitVersion) {
      gitVersionRow = new Adw.ActionRow({
        title: _("Git Version"),
      });
      gitVersionRow.add_suffix(
        new Gtk.Label({
          label: gitVersion,
        })
      );
    }

    // shell version
    let gnomeVersionRow = new Adw.ActionRow({
      title: _("GNOME Version"),
    });
    gnomeVersionRow.add_suffix(
      new Gtk.Label({
        label: String(PACKAGE_VERSION),
      })
    );

    // Copy settings
    let copySettingsRow = new Adw.ActionRow({
      title: _("Copy Settings JSON"),
    });
    let copySettingsBtn = new Gtk.Button({
      label: _("Copy")
    });
    copySettingsRow.add_suffix(copySettingsBtn);
    
    let pasteSettingsBtn = new Gtk.Button({
      label: _("Paste")
    });
    copySettingsRow.add_suffix(pasteSettingsBtn);

    copySettingsBtn.connect("clicked", (widget) =>
    {
      // The settings of these keys will exist in the data but their value
      // will be replaced with the string "<REDACTED>"
      let redact = [
        "appid", "weatherapidotcom-key",
        "geolocation-appid-mapquest"
      ];

      // This object will hold the data to turn to JSON
      // Start with some extra info here that isn't in the settings
      let obj =
      {
        "app-version": releaseVersion,
        "git-version": gitVersion,
        "gnome-version": String(PACKAGE_VERSION),
        "user-locale": getLocale()
      };
      let keys = settings.list_keys();
      for(let k of keys)
      {
        // Redact "locs" and older "cities" keys
        if(k === "locs")
        {
          let locs = settingsGetLocs(settings);
          for(let i in locs)
          {
            // Remove location names and coordinates
            locs[i] = new Loc(
              locs[i].getNameType(), locs[i].isMyLoc() ? "" : "<NAME>",
              locs[i].getPlaceType(), locs[i].isMyLoc() ? "" : "<PLACE>"
            );
          }
          obj[k] = locs;
        }
        else if(k === "cities")
        {
          obj["cities"] = "<CITIES>";
        }
        else if(redact.includes(k))
        {
          obj[k] = "<REDACTED>";
        }
        else if(k === "custom-keys")
        {
          let customKeys = settingsGetKeys(settings);
          for(let i in customKeys)
          {
            customKeys[i] = customKeys[i] ? "<REDACTED>" : "";
          }
          obj[k] = customKeys;
        }
        else
        {
          let val = settings.get_user_value(k);
          if(val === null) continue;

          obj[k] = val.print(false);
        }
      }

      let clipboard = widget.get_clipboard();
      clipboard.set(JSON.stringify(obj));

      let toast = new Adw.Toast({
        title: _("Copied settings JSON to clipboard.")
      });
      wnd.add_toast(toast);
    });

    pasteSettingsBtn.connect("clicked", widget => {
      let clipboard = widget.get_clipboard();
      clipboard.read_text_async(null, (c, result) =>
      {
        let text;
        try
        {
          text = clipboard.read_text_finish(result);
        }
        catch
        {
          wnd.add_toast(new Adw.Toast({ title: _("Clipboard contains no text.") }));
          return;
        }

        let obj = JSON.parse(text);
        if(!obj)
        {
          wnd.add_toast(new Adw.Toast({ title: _("Clipboard didn't contain valid JSON.") }));
          return;
        }

        settings.set_boolean("frozen", true);

        let skipKeys = [
          "app-version", "gnome-version", "git-version", "user-locale", "locs",
          "frozen", "appid", "weatherapidotcom-key", "custom-keys",
          "use-default-owm-key", "use-default-weatherapidotcom-key",
          "geolocation-appid-mapquest"
        ];
        for(let k of Object.keys(obj))
        {
          if(skipKeys.includes(k)) continue;
          let v = obj[k];
          if(v[0] === "'" && v.endsWith("'")) settings.set_string(k, v);
          else if(v === "true" || v === "false") settings.set_boolean(k, v === "true");
          else if(v.includes(".")) settings.set_double(k, parseFloat(v));
          else settings.set_int(k, parseInt(obj[k]));
        }

        settings.set_boolean("frozen", false);
        wnd.close();
      });
    });

    infoGroup.add(openWeatherVersionRow);
    if(gitVersion) infoGroup.add(gitVersionRow);
    infoGroup.add(gnomeVersionRow);
    infoGroup.add(copySettingsRow);
    this.add(infoGroup);

    // Maintainer
    let maintainerGroup = new Adw.PreferencesGroup();

    let maintainerBox = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      hexpand: false,
      vexpand: false,
    });
    let repoLink = "<a href=\"https://github.com/penguin-teal/gnome-openweather\">%s</a>";
    let maintainerAbout = new Gtk.Label({
      label: _("Maintained by: %s").format(repoLink.format("Teal Penguin")),
      use_markup: true,
      hexpand: false,
      vexpand: false,
    });
    let contribute = new Gtk.Label({
      label: _("Contribute or translate the project on %s.").format(repoLink.format("GitHub")),
      use_markup: true,
      hexpand: false,
      vexpand: false
    });
    let fork = new Gtk.Label({
      label: _("This is a fork of %s's extension.").format("Jason Oickle"),
      use_markup: false,
      hexpand: false,
      vexpand: false
    });

    maintainerBox.append(maintainerAbout);
    maintainerBox.append(contribute);
    maintainerBox.append(fork);
    maintainerGroup.add(maintainerBox);
    this.add(maintainerGroup);

    // Provider
    let curProv = settings.get_enum("weather-provider");

    if(curProv !== 0)
    {
      let providerGroup = new Adw.PreferencesGroup();
      let providerBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        margin_top: 15,
        hexpand: false,
        vexpand: false,
      });
      let providerAbout = new Gtk.Label({
        label: _("Weather data provided by: %s").format(
          `<a href="${getWeatherProviderUrl(curProv)}">${getWeatherProviderName(curProv)}</a>`
        ),
        use_markup: true,
        hexpand: false,
        vexpand: false,
      });
      providerBox.append(providerAbout);
      providerGroup.add(providerBox);
      this.add(providerGroup);
    }

    // License
    let gnuLicense =
      '<span size="small">' +
      _("This program comes with ABSOLUTELY NO WARRANTY.") +
      "\n" +
      _("See the") +
      ' <a href="https://gnu.org/licenses/old-licenses/gpl-2.0.html">' +
      _("GNU General Public License, version 2 or later") +
      "</a> " +
      _("for details.") +
      "</span>";
    let gplGroup = new Adw.PreferencesGroup();
    let gplLabel = new Gtk.Label({
      label: gnuLicense,
      use_markup: true,
      justify: Gtk.Justification.CENTER,
    });
    let gplLabelBox = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      valign: Gtk.Align.END,
      vexpand: true,
    });
    gplLabelBox.append(gplLabel);
    gplGroup.add(gplLabelBox);
    this.add(gplGroup);
  }
}

export { AboutPage };
