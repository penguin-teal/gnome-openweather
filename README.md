![Screenshot](https://github.com/jenslody/gnome-shell-extension-weather/raw/master/data/Screenshot.jpg)

*gnome-shell-extension-openweather* is a simple extension for displaying weather conditions and forecasts in GNOME Shell, featuring support for multiple locations, no need for WOEID, a symmetrical layout and a settings panel through *gnome-shell-extension-prefs*.

Currently, the weather data, including forecasts for up to ten days, is fetched from [OpenWeatherMap](http://openweathermap.org/).

----

# Installation

After the installation, restart GNOME Shell (`Alt`+`F2`, `r`, `Enter`) and enable the extension through *gnome-tweak-tool*.

## Through a package manager

### [Debian](http://packages.debian.org/source/unstable/gnome-shell-extension-weather)

Debian uses the (master-) Yahoo-branch !
My fork of the extension is currently only available for unstable/sid.

Install the package through APT (or use your favourite package-manager, e.g. synaptic):

	sudo apt-get install gnome-shell-extension-weather


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
* *intltool*.
* *gnome-tweak-tool*.

Run the following commands:

	cd ~ && git clone git://github.com/jenslody/gnome-shell-extension-weather.git
	cd ~/gnome-shell-extension-weather
	git checkout openweathermap
	./autogen.sh && make local-install

If you want to use openweathermap.org with gnome-shell 3.6, please use the openweathermap_3.6 branch instead.

	cd ~ && git clone git://github.com/jenslody/gnome-shell-extension-weather.git
	cd ~/gnome-shell-extension-weather
	git checkout openweathermap_3.6
	./autogen.sh && make local-install

----

# Configuration

Launch *gnome-shell-extension-prefs* (reachable also through the *OpenWeather Settings* button on the extension popup) and select *OpenWeather* from the drop-down menu to edit the configuration.

![Screenshot](https://github.com/jenslody/gnome-shell-extension-weather/raw/master/data/weather-settings.gif)

You can also use *dconf-editor* or *gsettings* to configure the extension through the command line.

----

# Licence

Copyright (C) 2011 - 2013

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
