# OpenWeather

<p align="left">
    <img src="https://gitlab.com/skrewball/assets/-/raw/main/openweather-screenshot.png" width="520">
</p>

OpenWeather (*gnome-shell-extension-openweather*) is a simple extension for displaying weather conditions and forecasts for any location on Earth in the GNOME Shell. It provides support for multiple locations with editable names using coordinates to store the locations, a beautiful layout, and more.

Weather data is fetched from [OpenWeatherMap](https://openweathermap.org) including forecasts for up to ten days.

*This is a fork of the original [OpenWeather](https://gitlab.com/jenslody/gnome-shell-extension-openweather) extension by @jenslody.*

Some outstanding issues addressed so far:

- Latest GNOME support added 76047866 | [#303](jenslody/gnome-shell-extension-openweather#303) [#307](jenslody/gnome-shell-extension-openweather#307) [!251](jenslody/gnome-shell-extension-openweather!251)
- Location search is finally working again. !2 | [#305](jenslody/gnome-shell-extension-openweather#305)
- Added option to choose the position inside the panel box !1 | [!236](jenslody/gnome-shell-extension-openweather!236)
- Fix for icons not shown 25703765 | [#278](jenslody/gnome-shell-extension-openweather#278) [!243](jenslody/gnome-shell-extension-openweather!243)
- Fix 'C.UTF-8' locale 6c83b441 | [!247](jenslody/gnome-shell-extension-openweather!247)

<br>

## Installation

After completing one of the installation methods below, restart GNOME Shell (`Alt`+`F2`, `r`, `Enter`) and enable the extension through the *gnome-extensions* app.

#### To install the most recent official release: Visit OpenWeather on the [Official GNOME Extensions](https://extensions.gnome.org/extension/750/openweather) website.

<p align="left">
  <a href="https://extensions.gnome.org/extension/750/openweather">
    <img src="https://gitlab.com/skrewball/assets/-/raw/main/get-it-on-ego.png" width="240" style="margin-left: 5px">
  </a>
</p>

**NOTE: Currently this leads to the older version of the extension before the fork while we [transfer ownership of the E.G.O listing](https://gitlab.gnome.org/Infrastructure/extensions-web/-/issues/185). I will upload a new version as soon as it's complete!**

To get the latest release you will need to use one of the below options for now:

### Package Manager

I have added an 'official' package to the AUR that will align with the E.G.O releases. However I'm not aware of this fork updated on any other package manager repositories yet. I will add them here as they become available.

#### [Arch Linux (AUR)](https://aur.archlinux.org/packages?O=0&K=gnome-shell-extension-openweather)

For the latest 'official' version releases:

```
paru -S gnome-shell-extension-openweather
```

A 3rd party maintains a rolling release package synced with this git repo:

```
paru -S gnome-shell-extension-openweather-git
```

### Install From Source

Make sure you have the following dependencies installed:
* `dconf`
* `gettext`
* `pkg-config`
* `git`
* `glib2` (and development packages)
* `zip`
* `gnome-common`
* `autoconf`
* `automake`
* `gettext-devel`
* `gnome-extensions`

Run the following commands:

```
cd ~ && git clone https://gitlab.com/skrewball/openweather.git
cd ~/openweather
./autogen.sh && make local-install
```

<br>

## Configuration

Launch the *gnome-extensions* app look for the *OpenWeather* extension and click to activate. The settings can be accessed here and are also reachable through the settings button on the extension popup.

You can also use *dconf-editor* or *gsettings* to configure the extension through the command line.
- The settings are under the `org.gnome.shell.extensions.openweather` schema.

With [OpenWeatherMap](https://openweathermap.org) you can either use the extensions default-key or register to get a [personal API key](https://openweathermap.org/appid). This key has to be added in the preferences dialog. Don't forget to switch the a appropriate switch in the dialog to "off" in this case.

<br>

## Bugs

Bugs should be reported [here](https://gitlab.com/skrewball/openweather/issues) on the GitLab issues page.

When submitting a bug report, please make sure to provide as much information as you can about the issue, your Linux distribution, GNOME Shell version, and OpenWeather (*gnome-shell-extension-openweather*) version.

<br>

## Licence

Copyright &copy; 2011 - 2013
* Elad Alfassa <elad@fedoraproject.org>,
* Mark Benjamin <weather.gnome.Markie1@dfgh.net>,
* Simon Claessens <gagalago@gmail.com>,
* Ecyrbe <ecyrbe+spam@gmail.com>,
* Timur Kristóf <venemo@msn.com>,
* Simon Legner <Simon.Legner@gmail.com>,
* Mattia Meneguzzo <odysseus@fedoraproject.org>,
* Christian Metzler <neroth@xeked.com>,
* Jens Lody <jens@jenslody.de>.

Copyright &copy; 2018
* Taylor Raack <taylor@raack.info>.

Copyright &copy; 2013 - 2021
* Jens Lody <openweather@jenslody.de>.

Copyright &copy; 2022
* Jason Oickle <openweather[at]joickle[dot]com>.


OpenWeather (*gnome-shell-extension-openweather*) is free software: you can redistribute it and/or modify it under the terms of the **GNU General Public License as published by the Free Software Foundation, either version 3** of the License, or (at your option) any later version.

OpenWeather is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with OpenWeather (*gnome-shell-extension-openweather*).  If not, see <http://www.gnu.org/licenses/>.