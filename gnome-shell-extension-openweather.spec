%global git fe00513
%global uuid openweather-extension@jenslody.de
%global github jenslody-gnome-shell-extension-openweather
%global checkout git%{git}
%global checkout_date 20151010


Name:           gnome-shell-extension-openweather
Version:        1
Release:        0.5.%{checkout_date}%{checkout}%{?dist}
Summary:        Display weather information from many locations in the world

Group:          User Interface/Desktops

# The entire source code is GPLv3+ except convenience.js, which is BSD
License:        GPLv3+ and BSD
URL:            https://github.com/jenslody/gnome-shell-extension-openweather
Source0:        https://github.com/jenslody/gnome-shell-extension-openweather/tarball/master/%{github}-%{git}.tar.gz
BuildArch:      noarch

BuildRequires:  autoconf, automake, glib2-devel, gnome-common >= 3.12.0, intltool
Requires:       gnome-shell >= 3.12.0

%description
gnome-shell-extension-openweather is an extension to display weather information
from http://openweathermap.org/ or http://forecast.io for (almost) all locations
of the world in GNOME Shell.

%prep
%setup -q -n %{github}-%{git}

%build
NOCONFIGURE=1 ./autogen.sh
%configure --prefix=%{_prefix} GIT_VERSION=%{checkout}
make %{?_smp_mflags}

%install
make install DESTDIR=%{buildroot}
%find_lang %{name}

# Fedora uses file-triggers for some stuff (e.g. compile schemas) since fc24.
# Compiling schemas is the only thing done in %%postun and %%posttrans, so
# I decided to make both completely conditional.
%if 0%{?fedora} < 24
%postun
if [ $1 -eq 0 ] ; then
        %{_bindir}/glib-compile-schemas %{_datadir}/glib-2.0/schemas &> /dev/null || :
fi

%posttrans
%{_bindir}/glib-compile-schemas %{_datadir}/glib-2.0/schemas &> /dev/null || :
%endif

%files -f %{name}.lang
%license COPYING
%doc AUTHORS README.md
%{_datadir}/glib-2.0/schemas/org.gnome.shell.extensions.openweather.gschema.xml
%if 0%{?fedora} < 23
%dir %{_datadir}/gnome-shell/extensions
%endif
%{_datadir}/gnome-shell/extensions/%{uuid}

%changelog
* Sat Oct 10 2015 Jens Lody <fedora@jenslody.de> - 1-0.5.20151010gitfe00513
- New upstream:
  make refresh-intervall configurable,
  fix minor issue, when last location is removed,
  add new languages for forecast.io.

* Thu Sep 24 2015 Jens Lody <fedora@jenslody.de> - 1-0.4.20150924gite55253e
- Always depend on gnome-shell (it's needed anyway).
- On Fedora < 23 own the extensions dir explicitely to avoid unowned
  directories.

* Thu Sep 24 2015 Jens Lody <fedora@jenslody.de> - 1-0.3.20150924gite55253e
- Do not require gnome-shell-extensions-common.
- Require gnome-shell instead on Fedora >= 23.

* Thu Sep 24 2015 Jens Lody <fedora@jenslody.de> - 1-0.2.20150924gite55253e
- Use checkout-date instead of build-date in package-version.

* Thu Aug 20 2015 Jens Lody <fedora@jenslody.de> - 1-0.1.20150821gitcb1f6f6
- Remove dot before git in Release-tag.
- Use (conditional) file-triggers for schema compiling, introduced in fc24.

* Sat Jul 25 2015 Jens Lody <fedora@jenslody.de> - 1-0.1.20150725.git377244c
- Initial package for Fedora of the weather-extension fork using
  http://openweathermap.org or http://forecast.io.

