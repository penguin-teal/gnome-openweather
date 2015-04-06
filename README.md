![Screenshot](https://github.com/jenslody/gnome-shell-extension-openweather/raw/master/data/Screenshot.jpg)

*gnome-shell-extension-openweather* is a simple extension for displaying weather conditions and forecasts in GNOME Shell, featuring support for multiple locations, no need for WOEID, a symmetrical layout and a settings panel through *gnome-shell-extension-prefs*.

The weather data is fetched from [OpenWeatherMap](https://openweathermap.org/) (including forecasts for up to ten days) or [forecast.io](https://forecast.io) (including forecasts for up to eight days).

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

You can install the extension from [my repo](http://rpm.jenslody.de/).
I have packages for Fedora 20, 21, 22, rawhideand RedHat/CentOS 7.

To install my repo download and install [this rpm for all non-rawhide versions](https://rpm.jenslody.de/fedora-jenslody.de-0.3-1.fc19.noarch.rpm), [this rpm for rawhide](https://rpm.jenslody.de/fedora-rawhide-jenslody.de-0.3-1.fc22.noarch.rpm) and [this rpm for RedHat/CentOS 7](https://rpm.jenslody.de/centos-jenslody.de-0.2-2.el5.centos.noarch.rpm).

If it is not installed automatically, just run (for non-rawhide):

    sudo yum localinstall --nogpgcheck https://rpm.jenslody.de/fedora-jenslody.de-0.3-1.fc19.noarch.rpm

for rawhide:

    sudo yum localinstall --nogpgcheck https://rpm.jenslody.de/fedora-rawhide-jenslody.de-0.3-1.fc22.noarch.rpm

for RedHat/CentOs 7:

    sudo yum localinstall --nogpgcheck https://rpm.jenslody.de/centos-jenslody.de-0.2-2.el5.centos.noarch.rpm

Now you can install the extension, either via your favourite package-manager or on a console:

    sudo yum install gnome-shell-extension-openweather

Or go to my [site on fedoras copr-project](https://copr.fedoraproject.org/coprs/jenslody/gnome-shell-extensions/), the files are build and hosted there.

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

	cd ~ && git clone git://github.com/jenslody/gnome-shell-extension-openweather.git
	cd ~/gnome-shell-extension-openweather
	./autogen.sh && make local-install

----

# Configuration

Launch *gnome-shell-extension-prefs* (reachable also through the *OpenWeather Settings* button on the extension popup) and select *OpenWeather* from the drop-down menu to edit the configuration.

![Screenshot](https://github.com/jenslody/gnome-shell-extension-openweather/raw/master/data/weather-settings.gif)

You can also use *dconf-editor* or *gsettings* to configure the extension through the command line.

The [OpenWeatherMap](https://openweathermap.org/) maintainers recommend to use an [API key](http://openweathermap.org/appid). This key can be added in the preferences dialog.
To use [Forecast.io](https://forecast.io) you need an to [register](https://developer.forecast.io/register) and get an API key. With this key you can make 1000 requests per day for free. This should be enough for this extension in any normal use case.

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
