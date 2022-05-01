# OpenWeather

<p align="left">
    <img src="https://gitlab.com/skrewball/assets/-/raw/main/openweather-screenshot.png" width="520">
</p>

OpenWeather (*gnome-shell-extension-openweather*) is a simple extension for displaying weather conditions and forecasts for any location on Earth in the GNOME Shell. It provides support for multiple locations with editable names using coordinates to store the locations, a beautiful layout, and more.

Weather data is fetched from [OpenWeatherMap](https://openweathermap.org) including 3 hour forecasts for up to five days.

*Forked from the original OpenWeather extension by @jenslody.*

<br>

## Installation

After completing one of the installation methods below, restart GNOME Shell (`Alt`+`F2`, `r`, `Enter`) and enable the extension through the *gnome-extensions* app.

#### Official E.G.O Release

Visit OpenWeather on the [Official GNOME Extensions](https://extensions.gnome.org/extension/750/openweather) website.

<p align="left">
  <a href="https://extensions.gnome.org/extension/750/openweather">
    <img src="https://gitlab.com/skrewball/assets/-/raw/main/get-it-on-ego.png" width="240" style="margin-left: 5px">
  </a>
</p>

### Package Manager

I have an 'official' package in the AUR that aligns with the E.G.O releases. However I'm not aware if any package maintainers have updated their sources yet. I will add them here as they become available.

#### [Arch Linux (AUR)](https://aur.archlinux.org/packages?O=0&K=gnome-shell-extension-openweather)

For the latest official E.G.O version releases:

```
paru -S gnome-shell-extension-openweather
```

A 3rd party maintains a rolling release package synced with this git repo:

```
paru -S gnome-shell-extension-openweather-git
```

### Install From Source

Make sure you have the following dependencies installed:

| Arch Based     | Debian Based                  | Fedora                 |
| ---            | ---                           | ---                    |
| `dconf`        | `dconf-gsettings-backend`     | `dconf`                |
| `gnome-shell`  | `gnome-shell-extension-prefs` | `gnome-extensions-app` |
| `git`          | `git`                         | `git`                  |
| `base-devel`   | `build-essential`             | `glib2-devel`          |
|                |                               | `gettext-devel`        |


Run the following commands:

```
git clone https://gitlab.com/skrewball/openweather.git
```
```
cd openweather
```
```
make && make install
```

<br>

## Support OpenWeather

OpenWeather (*gnome-shell-extension-openweather*) is provided completely free of charge. If you enjoy using this extension and would like to help support the project, please feel free to hit the button below!

<p align="left">
    <a href="https://www.paypal.com/donate/?hosted_button_id=VZ7VLXPU2M9RQ" target="_blank"><img src="https://gitlab.com/skrewball/assets/-/raw/main/paypal-donate.png" width="250"></a>
</p>

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
