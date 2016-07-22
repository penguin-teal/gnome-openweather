![Screenshot](https://github.com/jenslody/gnome-shell-extension-openweather/raw/master/data/Screenshot.jpg)

*gnome-shell-extension-openweather* is a simple extension for displaying weather conditions and forecasts in GNOME Shell, featuring support for multiple locations, no need for WOEID, a symmetrical layout and a settings panel through *gnome-shell-extension-prefs*.

The weather data is fetched from [OpenWeatherMap](https://openweathermap.org/) (including forecasts for up to ten days) or [forecast.io](https://forecast.io) (including forecasts for up to eight days).

#### Note: since version 29 this extensions uses coordinates to store the locations and makes the names editable to support multiple weather-providers!
#### If you update from versions prior to 29 to 29 or greater (with forecast.io - support) you have to recreate your locations.

----

# Installation

After the installation, restart GNOME Shell (`Alt`+`F2`, `r`, `Enter`) and enable the extension through *gnome-tweak-tool*.

## Through extensions.gnome.org (Local installation)

Go on the [OpenWeather](https://extensions.gnome.org/extension/750/openweather/) extension page on extensions.gnome.org, click on the switch ("OFF" => "ON"), click on the install button. That's it !

## Through a package manager

#### Note: you need the root password for all these installation modes, if you do not have root-access, and the needed build-dependencies are installed, use the generic install.

### [Debian](http://packages.debian.org/source/unstable/gnome-shell-extension-weather)

Debian uses the (former master now ) yahoo-branch !

My fork of the extension is currently only available for unstable/sid.

Install the package through APT (or use your favourite package-manager, e.g. synaptic):

	sudo apt-get install gnome-shell-extension-weather


### [Fedora](https://fedoraproject.org/)

You can install the extension from the official Fedora repos.

## Generic (Local installation)

Make sure you have the following dependencies installed:
* *dconf*,
* *gettext*,
* *pkg-config*,
* *git*,
* *glib2 (and development packages)*,
* *zip*,
* *gnome-common*,
* *autoconf*,
* *automake*,
* *gettext-devel*.
* *gnome-tweak-tool*.

Run the following commands:

	cd ~ && git clone git://github.com/jenslody/gnome-shell-extension-openweather.git
	cd ~/gnome-shell-extension-openweather
	./autogen.sh && make local-install

----

# Configuration

Launch *gnome-shell-extension-prefs* (reachable also through the *OpenWeather Settings* button on the extension popup) and select *OpenWeather* from the drop-down menu to edit the configuration.

![Screenshot](https://github.com/jenslody/gnome-shell-extension-openweather/raw/master/data/weather-settings.gif)

You can also use *dconf-editor* or *gsettings* to configure the extension through the command line.

On [OpenWeatherMap](https://openweathermap.org/) you can either use the extensions default-key or register to get a [personal API key](http://openweathermap.org/appid). This key has to be added in the preferences dialog. Don't forget to switch the a appropriate switch in the dialog to "off" in this case.

To use [Forecast.io](https://forecast.io) you also need to [register](https://developer.forecast.io/register) and get an API key. With this key you can make 1000 requests per day for free. This should be enough for this extension in any normal use case. Do not add billing information, otherwise you might have to pay for the weather-data if something went wrong !

----

# Licence

Copyright (C) 2011 - 2015

* Elad Alfassa <elad@fedoraproject.org>,
* Mark Benjamin <weather.gnome.Markie1@dfgh.net>,
* Simon Claessens <gagalago@gmail.com>,
* Ecyrbe <ecyrbe+spam@gmail.com>,
* Timur Kristóf <venemo@msn.com>,
* Simon Legner <Simon.Legner@gmail.com>,
* Mattia Meneguzzo <odysseus@fedoraproject.org>,
* Christian Metzler <neroth@xeked.com>,
* Jens Lody <jens@jenslody.de>.

This file is part of *gnome-shell-extension-openweather*.

*gnome-shell-extension-openweather* is free software: you can redistribute it and/or modify it under the terms of the **GNU General Public License as published by the Free Software Foundation, either version 3** of the License, or (at your option) any later version.

*gnome-shell-extension-openweather* is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with *gnome-shell-extension-openweather*.  If not, see <http://www.gnu.org/licenses/>.
