%global git 2701627
%global uuid openweather-extension@jenslody.de
%global github jenslody-gnome-shell-extension-openweather
%global checkout git%{git}

Name:           gnome-shell-extension-openweather
Version:        1
Release:        0.0.%(date +%Y%m%d).%{checkout}%{?dist}
Summary:        An extension to display weather information from many locations in the world

Group:          User Interface/Desktops
License:        GPLv3+
URL:            https://github.com/jenslody/gnome-shell-extension-openweather
Source0:        https://github.com/jenslody/gnome-shell-extension-openweather/tarball/master/%{github}-%{git}.tar.gz
BuildArch:      noarch

BuildRequires:  autoconf >= 2.53, automake >= 1.9, glib2-devel, gnome-common >= 3.12.0, intltool >= 0.25
Requires:       gnome-shell >= 3.12.0

%description
gnome-shell-extension-openweather is an extension to display weather information
from http://openweathermap.org/ or http://forecast.io for (almost) all locations
of the world in GNOME Shell.

%license COPYING

%prep
%setup -q -n %{github}-%{git}

%build
NOCONFIGURE=1 ./autogen.sh
%configure --prefix=%{_prefix}
make %{?_smp_mflags}

%install
make install DESTDIR=%{buildroot}
%find_lang %{name}

%postun
if [ $1 -eq 0 ] ; then
        %{_bindir}/glib-compile-schemas %{_datadir}/glib-2.0/schemas &> /dev/null || :
fi

%posttrans
%{_bindir}/glib-compile-schemas %{_datadir}/glib-2.0/schemas &> /dev/null || :

%files -f %{name}.lang
%doc AUTHORS README.md
%{_datadir}/glib-2.0/schemas/org.gnome.shell.extensions.openweather.gschema.xml
%{_datadir}/gnome-shell/extensions/%{uuid}/

%changelog
* Sat Jul 25 2015 Jens Lody <fedora@jenslody.de> - 1-0.1.20150725.git377244c
- Initial package for Fedora of the weather-extension fork using
  http://openweathermap.org or http://forecast.io.

