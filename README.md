![Screenshot](https://github.com/jenslody/gnome-shell-extension-weather/raw/master/data/Screenshot.jpg)

*gnome-shell-extension-weather* is a simple extension for displaying weather conditions and forecasts in GNOME Shell, featuring support for multiple locations, no need for WOEID, a symmetrical layout and a settings panel through *gnome-shell-extension-prefs*.

Currently, the weather report, including forecasts for up to five days, is fetched from [Yahoo! Weather](http://weather.yahoo.com/).

# News

I just pushed changes to the new openweathermap-branch.
The code surely needs more cleanup, but it is ready for testing.

Up to 10 days forecast can be shown.
The weather-data is provided by http://openweathermap.org .

Locations used by the master-branch ()!Yahoo) will not be deleted by the switch, but they can not be used. Make sure you use only owm locations with owm and yahoo locations with yahoo or you get incorrect (or no) results).

I'm always interested in feedback.

To use this branch just pull my repo and switch to it with;

	cd ~ && git clone git://github.com/jenslody/gnome-shell-extension-weather.git
	cd ~/gnome-shell-extension-weather
	git checkout openweathermap
	./autogen.sh && make local-install

----

# Installation

After the installation, restart GNOME Shell (`Alt`+`F2`, `r`, `Enter`) and enable the extension through *gnome-tweak-tool*.

**Currently only the generic installation is possible, sorry.**

## Generic (Local installation)

Make sure you have the following dependencies installed:
* *dconf*,
* *gettext*,
* *pkg-config*,
* *git*,
* *glib2*,
* *gnome-common*,
* *autoconf*,
* *automake*,
* *intltool*,
* *gnome-tweak-tool*.

Run the following commands:

	cd ~ && git clone git://github.com/jenslody/gnome-shell-extension-weather.git
	cd ~/gnome-shell-extension-weather
	./autogen.sh && make local-install

----

# Configuration

Launch *gnome-shell-extension-prefs* (reachable also through the *Weather Settings* button on the extension popup) and select *Weather* from the drop-down menu to edit the configuration.

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

This file is part of *gnome-shell-extension-weather*.

*gnome-shell-extension-weather* is free software: you can redistribute it and/or modify it under the terms of the **GNU General Public License as published by the Free Software Foundation, either version 3** of the License, or (at your option) any later version.

*gnome-shell-extension-weather* is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with *gnome-shell-extension-weather*.  If not, see <http://www.gnu.org/licenses/>.
