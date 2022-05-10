# OpenWeather

<p align="left">
    <img src="https://gitlab.com/skrewball/assets/-/raw/main/openweather-screenshot.png" width="600">
</p>

OpenWeather (*gnome-shell-extension-openweather*) is a simple extension for displaying weather conditions and forecasts for any location on Earth in the GNOME Shell. It provides support for multiple locations with editable names using coordinates to store the locations, a beautiful layout, and more.

Weather data is fetched from [OpenWeatherMap](https://openweathermap.org) including 3 hour forecasts for up to 5 days.

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

## Credits

This project is a fork of the original OpenWeather extension by @jenslody. See [`AUTHORS`](https://gitlab.com/skrewball/openweather/-/blob/master/AUTHORS) for previous contributor details.

### Translations

Special thanks to the following people for updating translation `*.po` files via merge requests since forking the project:

French: @franckgaga | Slovak: @jose1711 | Chinese: @xiaozhangup

### Icons

OpenWeather's icon was designed by [Sihan Liu](https://www.sihanliu.com) and licensed under the [CC-BY-SA](http://creativecommons.org/licenses/by-sa/3.0/) licence.

Packaged weather icons are sourced from the [GNOME Project](http://www.gnome.org)'s [Adwaita Icon Theme](https://gitlab.gnome.org/GNOME/adwaita-icon-theme) under the GPLv3 license.

PayPal donate button and template used for the Gitlab button was designed by [Klemen Skerbiš](https://github.com/aha999/DonateButtons) under the GPLv3 license.

### Licence

OpenWeather is free software available under the terms of the GPLv3 license. See [`COPYING`](https://gitlab.com/skrewball/openweather/-/blob/master/COPYING) for details.
