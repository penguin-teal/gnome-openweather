# Basic Makefile

PKG_NAME = gnome-shell-extension-openweather
UUID = openweather-extension@jenslody.de
BASE_MODULES = metadata.json COPYING AUTHORS
SRC_MODULES = extension.js openweathermap_org.js stylesheet.css prefs.js prefs.css weather-settings.ui
EXTRA_DIRECTORIES = media
TOLOCALIZE = $(addprefix src/, extension.js openweathermap_org.js prefs.js weather-settings.ui) schemas/org.gnome.shell.extensions.openweather.gschema.xml
MSGSRC = $(wildcard po/*.po)

# Packagers: Use DESTDIR for system wide installation
ifeq ($(strip $(DESTDIR)),)
	INSTALLTYPE = local
	INSTALLBASE = $(HOME)/.local/share/gnome-shell/extensions
else
	INSTALLTYPE = system
	SHARE_PREFIX = $(DESTDIR)/usr/share
	INSTALLBASE = $(SHARE_PREFIX)/gnome-shell/extensions
endif
# The command line passed variable VERSION is used to set the version string
# in the metadata and in the generated zip-file. If no VERSION is passed, the
# version is pulled from the latest git tag with the revision (a monotonically
# increasing number that uniquely identifies the source tree) and the current
# short commit SHA1. It's used as the version number in the metadata while the
# generated zip file has no string attached.
ifdef VERSION
	ZIPVER = -v$(VERSION)
else
	VERSION = $(shell git describe --tags | sed 's/^v//;s/\([^-]*-g\)/r\1/;s/-/./g')
	ZIPVER =
endif

all: extension

clean:
	rm -f ./schemas/gschemas.compiled
	rm -f ./po/*.mo

extension: ./schemas/gschemas.compiled $(MSGSRC:.po=.mo)

./schemas/gschemas.compiled: ./schemas/org.gnome.shell.extensions.openweather.gschema.xml
	glib-compile-schemas ./schemas/

potfile: ./po/openweather.pot

mergepo: potfile
	for l in $(MSGSRC); do \
		msgmerge -U $$l ./po/openweather.pot; \
	done;

./po/openweather.pot: $(TOLOCALIZE)
	mkdir -p po
	xgettext -k_ -kN_ --from-code utf-8 -o po/openweather.pot --package-name $(PKG_NAME) $(TOLOCALIZE)

./po/%.mo: ./po/%.po
	msgfmt -c $< -o $@

install: install-local

install-local: _build
	rm -rf $(INSTALLBASE)/$(UUID)
	mkdir -p $(INSTALLBASE)/$(UUID)
	cp -r ./_build/* $(INSTALLBASE)/$(UUID)/
ifeq ($(INSTALLTYPE),system)
	# system-wide settings and locale files
	rm -r  $(addprefix $(INSTALLBASE)/$(UUID)/, schemas locale COPYING)
	mkdir -p $(SHARE_PREFIX)/glib-2.0/schemas \
		$(SHARE_PREFIX)/locale \
		$(SHARE_PREFIX)/licenses/$(PKG_NAME)
	cp -r ./schemas/*gschema.xml $(SHARE_PREFIX)/glib-2.0/schemas
	cp -r ./_build/locale/* $(SHARE_PREFIX)/locale
	cp -r ./_build/COPYING $(SHARE_PREFIX)/licenses/$(PKG_NAME)
endif
	-rm -fR _build
	echo done

zip-file: _build
	cd _build ; \
	zip -qr "$(PKG_NAME)$(ZIPVER).zip" .
	mv _build/$(PKG_NAME)$(ZIPVER).zip ./
	-rm -fR _build

_build: all
	-rm -fR ./_build
	mkdir -p _build
	cp $(BASE_MODULES) $(addprefix src/, $(SRC_MODULES)) _build
	cp -r $(EXTRA_DIRECTORIES) _build
	mkdir -p _build/schemas
	cp schemas/*.xml _build/schemas/
	cp schemas/gschemas.compiled _build/schemas/
	mkdir -p _build/locale
	for l in $(MSGSRC:.po=.mo) ; do \
		lf=_build/locale/`basename $$l .mo`; \
		mkdir -p $$lf; \
		mkdir -p $$lf/LC_MESSAGES; \
		cp $$l $$lf/LC_MESSAGES/$(PKG_NAME).mo; \
	done;
	sed -i 's/"version": .*/"version": "$(VERSION)"/'  _build/metadata.json;
