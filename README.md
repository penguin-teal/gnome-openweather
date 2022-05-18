# OpenWeather

<p align="left">
    <img src="https://gitlab.com/skrewball/assets/-/raw/main/openweather-screenshot.png" width="600">
</p>

OpenWeather (*gnome-shell-extension-openweather*) is a simple extension for displaying weather conditions and forecasts for any location on Earth in the GNOME Shell. It provides support for multiple locations with editable names using coordinates to store the locations, a beautiful layout, and more.

Weather data is fetched from [OpenWeatherMap](https://openweathermap.org) including 3 hour forecasts for up to 5 days.

<br>

## Installation

After completing one of the installation methods below, restart GNOME Shell (*Xorg: `Alt`+`F2`, `r`, `Enter` - Wayland: `log out` or `reboot`*) and enable the extension through the *gnome-extensions* app.

### Official E.G.O Release

Visit OpenWeather on the [Official GNOME Extensions](https://extensions.gnome.org/extension/750/openweather) website.

<p align="left">
  <a href="https://extensions.gnome.org/extension/750/openweather">
    <img src="https://gitlab.com/skrewball/assets/-/raw/main/get-it-on-ego.png" width="240" style="margin-left: 5px">
  </a>
</p>

### Package Manager

These are the currently available 'official' release packages that align with the E.G.O release version. There is a [package in the AUR](https://aur.archlinux.org/packages/gnome-shell-extension-openweather) that I maintain myself, and `Artem Polishchuk` maintains a package in the [official Fedora repos](https://src.fedoraproject.org/rpms/gnome-shell-extension-openweather).

Installing the extension this way provides a system wide installation.

#### Arch Linux

Install using your favourite AUR helper, for example:

```
paru -S gnome-shell-extension-openweather
```

#### Fedora

To install from the official fedora repos simply run:

```
sudo dnf install gnome-shell-extension-openweather
```

<br>

## Install From Source

This method installs to your `~/.local/share/gnome-shell/extensions` directory from the latest source code on the `master` branch.

First make sure you have the following dependencies installed:

| Arch Based     | Debian Based                  | Fedora                 |
| ---            | ---                           | ---                    |
| `dconf`        | `dconf-gsettings-backend`     | `dconf`                |
| `gnome-shell`  | `gnome-shell-extension-prefs` | `gnome-extensions-app` |
| `git`          | `git`                         | `git`                  |
| `base-devel`   | `build-essential`             | `glib2-devel`          |
|                | `gettext`                     | `gettext-devel`        |


Then run the following commands:

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

Or you can support my work by sending some crypto:

- **Bitcoin**: bc1q5r64qtsuxwfywfvesspathy2yun2aagpw58sv6
- **Monero**: 431XdMq2GsNZUXarUPtvW1j4Amt1VAzR3JYv3CHeZdTaQvn2pSKfFHM8MZi2RpN2B4JSssbKHrxVtNWrdyNDaEh3AZnstqS
- **Pirate Chain**: zs1eq5ju85hsutvepj9g6ysq80mlsx5wjpdty755z4l37we37crgs7lsk0zy2xyv2566gcyqlkwrla
- **Equilibria**: Tsz4p7GZpofQpXh2QW5St2Z1bSNfLR82gQLuV6P53LGTjDgzt3YcKt6im2eoYi5bCpddMHRaivYEidA2tE3fGz3e5MmoEtTVfA

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
