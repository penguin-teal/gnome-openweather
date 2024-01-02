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
import GLib from "gi://GLib";
import Gtk from "gi://Gtk";
import GObject from "gi://GObject";

import { PACKAGE_VERSION } from "resource:///org/gnome/Shell/Extensions/js/misc/config.js";

import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

class AboutPage extends Adw.PreferencesPage {
  static {
    GObject.registerClass(this);
  }

  constructor(metadata) {
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
      label: '<span size="larger"><b>OpenWeather</b></span>',
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
    let releaseVersion = metadata.version ? metadata.version : _("unknown");
    let gitVersion = metadata["git-version"] ? metadata["git-version"] : null;
    let windowingLabel =
      GLib.getenv("XDG_SESSION_TYPE") === "wayland" ? "Wayland" : "X11";

    // Extension version
    let openWeatherVersionRow = new Adw.ActionRow({
      title: _("OpenWeather Version"),
    });
    openWeatherVersionRow.add_suffix(
      new Gtk.Label({
        label: releaseVersion + "",
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
          label: gitVersion + "",
        })
      );
    }
    // shell version
    let gnomeVersionRow = new Adw.ActionRow({
      title: _("GNOME Version"),
    });
    gnomeVersionRow.add_suffix(
      new Gtk.Label({
        label: PACKAGE_VERSION + "",
      })
    );
    // session type
    let sessionTypeRow = new Adw.ActionRow({
      title: _("Session Type"),
    });
    sessionTypeRow.add_suffix(
      new Gtk.Label({
        label: windowingLabel,
      })
    );

    infoGroup.add(openWeatherVersionRow);
    gitVersion && infoGroup.add(gitVersionRow);
    infoGroup.add(gnomeVersionRow);
    infoGroup.add(sessionTypeRow);
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

    maintainerBox.append(maintainerAbout);
    maintainerBox.append(contribute);
    maintainerGroup.add(maintainerBox);
    this.add(maintainerGroup);

    // Provider
    let providerGroup = new Adw.PreferencesGroup();
    let providerBox = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      margin_top: 15,
      hexpand: false,
      vexpand: false,
    });
    let providerAbout = new Gtk.Label({
      label: _("Weather data provided by: %s").format(
        "<a href=\"https://openweathermap.org\">OpenWeatherMap</a>"
      ),
      use_markup: true,
      hexpand: false,
      vexpand: false,
    });
    providerBox.append(providerAbout);
    providerGroup.add(providerBox);
    this.add(providerGroup);

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
