# Basic Makefile

PKG_NAME = gnome-shell-extension-openweatherrefined
UUID = openweather-extension@penguin-teal.github.io
BASE_MODULES = metadata.json COPYING AUTHORS
SRC_MODULES = extension.js openweathermap.js prefs.js stylesheet.css constants.js location.js
PREFS_MODULES = generalPage.js layoutPage.js locationsPage.js aboutPage.js searchResultsWindow.js
EXTRA_DIRECTORIES = media
TOLOCALIZE = $(addprefix src/, extension.js openweathermap.js prefs.js constants.js location.js) \
             $(addprefix src/preferences/, $(PREFS_MODULES)) \
             schemas/org.gnome.shell.extensions.openweatherrefined.gschema.xml
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
# Set a git version for self builds from the latest git tag with the revision
# (a monotonically increasing number that uniquely identifies the source tree)
# and the current short commit SHA1. (Note: not set if VERSION passed)
GIT_VER = $(shell git describe --long --tags | sed 's/^v//;s/\([^-]*-g\)/r\1/;s/-/./g')
# The command line passed variable VERSION is used to set the version integer
# in the metadata and in the generated zip file. If no VERSION is passed, we
# won't touch the metadata version and instead use that for the zip file.
ifdef VERSION
	ZIPVER = -v$(VERSION)
else
	ZIPVER = -v$(shell cat metadata.json | sed '/"version"/!d' | sed s/\"version\"://g | sed s/\ //g)
endif

.PHONY: all clean potfile mergepo install install-local zip-file

all: _build

clean:
	rm -f ./schemas/gschemas.compiled
	rm -f ./po/*.mo

./schemas/gschemas.compiled: ./schemas/org.gnome.shell.extensions.openweatherrefined.gschema.xml
	glib-compile-schemas --strict ./schemas/

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

_build: ./schemas/gschemas.compiled $(MSGSRC:.po=.mo)
	-rm -fR ./_build
	mkdir -p _build/preferences
	cp $(BASE_MODULES) $(addprefix src/, $(SRC_MODULES)) _build
	cp $(addprefix src/preferences/, $(PREFS_MODULES)) _build/preferences
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
ifdef VERSION
	sed -i 's/"version": .*/"version": $(VERSION)/' _build/metadata.json;
else ifneq ($(strip $(GIT_VER)),)
	sed -i '/"version": .*/i\ \ "git-version": "$(GIT_VER)",' _build/metadata.json;
endif

