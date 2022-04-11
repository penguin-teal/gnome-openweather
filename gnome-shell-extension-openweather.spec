%global git 0e9e9ac
%global uuid openweather@skrewball
%global gitlab gnome-shell-extension-openweather
%global checkout git%{git}
%global checkout_date 20180616


Name:           gnome-shell-extension-openweather
Version:        1
Release:        0.32.%{checkout_date}%{checkout}%{?dist}
Summary:        Display weather information from many locations in the world

Group:          User Interface/Desktops

# The entire source code is GPLv3+ except convenience.js, which is BSD
License:        GPLv3+ and BSD
URL:            https://gitlab.com/skrewball/gnome-openweather
Source0:        https://gitlab.com/skrewball/gnome-openweather/-/archive/%{git}/%{gitlab}-%{git}.tar.gz
BuildArch:      noarch

# The version of gnome-common in CentOS7 is only 3.7.4
BuildRequires:  autoconf, automake, glib2-devel, gnome-common >= 3.7.4, gettext-devel
Requires:       gnome-shell >= 3.14.0

%description
gnome-shell-extension-openweather is an extension to display weather information
from https://openweathermap.org/ or https://darksky.net for (almost) all locations
of the world in GNOME Shell.
Be aware, that system-wide installed gnome-shell-extensions are disabled by
default and have to be enable by the user(s), if they get installed the first
time.
You can use gnome-tweak-tool (additional package) or run:
"gnome-shell-extension-tool -e %uuid" (without the
quotes) on a console.

%prep
%setup -q -n %{gitlab}-%{git}

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
* Wed Feb 07 2018 Fedora Release Engineering <releng@fedoraproject.org> - 1-0.32.20171030gita86b949
- Rebuilt for https://fedoraproject.org/wiki/Fedora_28_Mass_Rebuild

* Sun Nov 26 2017 Jens Lody <fedora@jenslody.de> - 1-0.32.20171126gitcac94f2
- Fix search-results popup not shown in last revision.

* Mon Oct 30 2017 Jens Lody <fedora@jenslody.de> - 1-0.31.20171030gita86b949
- Fix warnings, because of deprecated functions and wrong function parameter-count.
- Minor enhancements.

* Wed Jul 26 2017 Fedora Release Engineering <releng@fedoraproject.org> - 1-0.30.20170423git648d491
- Rebuilt for https://fedoraproject.org/wiki/Fedora_27_Mass_Rebuild

* Sun Apr 23 2017 Jens Lody <fedora@jenslody.de> - 1-0.29.20170423git648d491
- Workaround for incorrect displayed localized decimals.

* Tue Mar 07 2017 Jens Lody <fedora@jenslody.de> - 1-0.28.20170307git48ee4af
- Fix rhbz#1429776 (double initialization of variable).
- fix minor version of gnome-shell needed

* Sat Feb 25 2017 Jens Lody <fedora@jenslody.de> - 1-0.27.20170225git59aa498
- Disable gnome-shell < 3.14 and support 3.24 .
- Layout fixes (pref-dialog).
- Updated localization.

* Fri Feb 10 2017 Fedora Release Engineering <releng@fedoraproject.org> - 1-0.26.20161004git34d7e39
- Rebuilt for https://fedoraproject.org/wiki/Fedora_26_Mass_Rebuild

* Mon Oct 03 2016 Jens Lody <fedora@jenslody.de> - 1-0.25.20161004git34d7e39
- Support gnome-shell 3.22.
- Updated french translation.

* Tue Sep 20 2016 Jens Lody <fedora@jenslody.de> - 1-0.24.20160920git39821fa
- Switch name and url from forecast.io to Dark Sky, because they changed/unified
  their name, url and api.

* Wed Sep 14 2016 Jens Lody <fedora@jenslody.de> - 1-0.23.20160914git58dd4f4
- Add option to configure the position of the menu-box relative to the
  panel-text.
- Update metadata.json to support newest development build of gnome-shell
  on rawhide.
- Added/updated language files.

* Thu Aug 25 2016 Jens Lody <fedora@jenslody.de> - 1-0.22.20160825gitcefbfb0
- Update metadata.json to support newest development build of gnome-shell
  on rawhide.

* Sun Aug 21 2016 Jens Lody <fedora@jenslody.de> - 1-0.21.20160821gita44cb9e
- Fix glibc error-message, when disabling the extension.
- Fix minor issues in preferences-dialog.
- Add/update translations.

* Fri Jul 22 2016 Jens Lody <fedora@jenslody.de> - 1-0.20.20160722git4c98fe3
- Update po-files via Makefile with gettext instead of using update.js .
- Get rid of (mostly unmaintained) intltools.
- Make gsettings schema translatable

* Wed Jul 06 2016 Jens Lody <fedora@jenslody.de> - 1-0.19.20160706git2cc5cfe
- Several language files updated.
- Enabled on gnome-shell 3.21.3.

* Fri Mar 25 2016 Jens Lody <fedora@jenslody.de> - 1-0.18.20160325git8dd1696
- Updated dutch translation.
- Add support for new version of gnome-shell (3.20).

* Wed Feb 03 2016 Fedora Release Engineering <releng@fedoraproject.org> - 1-0.17.20160123git35e912a
- Rebuilt for https://fedoraproject.org/wiki/Fedora_24_Mass_Rebuild

* Sat Jan 23 2016 Jens Lody <fedora@jenslody.de> - 1-0.16.20160123git35e912a
- Add support for new development version of gnome-shell (3.19.4).
- Updated russian, spanish french and italian translation files.

* Thu Dec 17 2015 Jens Lody <fedora@jenslody.de> - 1-0.15.20151217git27c779c
- Add support for new development version of gnome-shell (3.19.3).

* Sat Dec 12 2015 Jens Lody <fedora@jenslody.de> - 1-0.14.20151212gita80c8a3
- Bump release to be higher than the last copr-(test-)build.

* Sat Dec 12 2015 Jens Lody <fedora@jenslody.de> - 1-0.13.20151212gita80c8a3
- Update polish translation.
- Add hint about enabling system-wide installed shell-extensions.
- Re-add gnome-shell 3.8 and 3.10 compatibilty (epel7).

* Wed Nov 25 2015 Jens Lody <fedora@jenslody.de> - 1-0.12.20151125gitccaa1eb
- Add support for new development version of gnome-shell (3.19.2).

* Sun Nov 08 2015 Jens Lody <fedora@jenslody.de> - 1-0.11.20151108git23a83b3
- Add support for new development version of gnome-shell.

* Sun Nov 08 2015 Jens Lody <fedora@jenslody.de> - 1-0.10.20151108git6368d32
- Fix typo in metadata.json .

* Sun Nov 08 2015 Jens Lody <fedora@jenslody.de> - 1-0.9.20151108gite4dbfee
- Add default API-key for openweathermap.org. The key is in their FOSS-whitelist
  now. Thanks to openweathermap.org .

* Sat Nov 07 2015 Jens Lody <fedora@jenslody.de> - 1-0.8.20151107gitae12283
- Fixes #1278686, can block gnome-shell temporarily in some cases .
  See also: https://github.com/jenslody/gnome-shell-extension-openweather/issues/82 .

* Sat Oct 17 2015 Jens Lody <fedora@jenslody.de> - 1-0.7.20151017git34aa242
- Bug fix: warn message for empty forecast.io api-key was shown if the key
  exists, not the if the key was empty, sorry.

* Fri Oct 16 2015 Jens Lody <fedora@jenslody.de> - 1-0.6.20151016git13f9abf
- Bug fix: forecast.io no longer accepts non-https requests.
- Updated russioan translation, added indonesian translation.
- Add warn-message if an api-key is empty.

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
  https://openweathermap.org or https://forecast.io.

