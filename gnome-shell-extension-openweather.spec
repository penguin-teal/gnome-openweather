%global git e56e4ae
%global uuid openweather-extension@jenslody.de
%global github jenslody-gnome-shell-extension-openweather
%global checkout git%{git}
%global gs_version %(dnf info gnome-shell | grep Version | cut -d \":\" -f 2 | cut -d \" \" -f 2)
%global gs_major_version %(echo %{gs_version} | cut -d \".\" -f 1-2)

Name:           gnome-shell-extension-openweather
Version:        1
Release:        0.0.%(date +%Y%m%d).%{checkout}%{?dist}
Summary:        An extension to display weather information from many locations in the world

Group:          User Interface/Desktops

# The entire source code is GPLv3+ except convenience.js, which is BSD
License:        GPLv3+ and BSD
URL:            https://github.com/jenslody/gnome-shell-extension-openweather
Source0:        https://github.com/jenslody/gnome-shell-extension-openweather/tarball/master/%{github}-%{git}.tar.gz
BuildArch:      noarch

BuildRequires:  autoconf >= 2.53, automake >= 1.9, glib2-devel, gnome-common >= 3.12.0, intltool >= 0.25, dnf
Requires:       gnome-shell-extension-common >= 3.12.0

%description
gnome-shell-extension-openweather is an extension to display weather information
from http://openweathermap.org/ or http://forecast.io for (almost) all locations
of the world in GNOME Shell.

%prep
%setup -q -n %{github}-%{git}

%build
sed -i "s/^\"shell-version\":.*/\"shell-version\": [ \"%{gs_version}\", \"%{gs_major_version}\" ],/g" data/metadata.json.in
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
%license COPYING
%doc AUTHORS README.md
%{_datadir}/glib-2.0/schemas/org.gnome.shell.extensions.openweather.gschema.xml
%{_datadir}/gnome-shell/extensions/%{uuid}/

%changelog
* Fri Aug 14 2015 Jens Lody <fedora@jenslody.de> - 1-0.2.20150814.gite56e4ae
- Automatically set gnome-shell major- and minor-version to metadata.json, so
  the extension can be used in rawhide after repackaging, without the need
  of manual fixes.
* Sat Jul 25 2015 Jens Lody <fedora@jenslody.de> - 1-0.1.20150725.git377244c
- Initial package for Fedora of the weather-extension fork using
  http://openweathermap.org or http://forecast.io.

