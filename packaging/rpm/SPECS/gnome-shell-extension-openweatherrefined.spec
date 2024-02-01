Name:           gnome-shell-extension-openweatherrefined
Version:        128
Release:        1%{?dist}
Summary:        A GNOME Shell extension to show the weather of any location on Earth. 

License:        GPL3
URL:            https://github.com/penguin-teal/gnome-openweather
Source0:        https://github.com/penguin-teal/gnome-openweather/releases/latest/download/gnome-shell-extension-openweatherrefined-v%{Version}.tar.gz

Requires:       gnome-shell dconf

%description
A GNOME Shell extension to show the weather of any location on Earth. 

%prep
%autosetup


%build
%configure
%make_build


%install
%make_install


%files
%license ${_bindir}/COPYING

%changelog
* Thu Feb 01 2024 penguin-teal <_penguin@tuta.io> - 128
- Packaging v128
