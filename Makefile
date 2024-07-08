# Basic Makefile

PKG_NAME = gnome-shell-extension-openweatherrefined
UUID = openweather-extension@penguin-teal.github.io
BASE_MODULES = metadata.json COPYING AUTHORS
SRC_MODULES       := $(shell find ./src -maxdepth 1 -type f -printf '%f ')
SRC_FILES		      := $(addprefix ./src/, $(SRC_MODULES))
PREFS_MODULES     := $(shell find ./src/preferences -type f -printf '%f ')
PREFS_FILES	     	:= $(addprefix ./src/preferences/, $(PREFS_MODULES))
EXTRA_DIRECTORIES := media
TOLOCALIZE        := $(SRC_FILES) $(PREFS_FILES) \
             schemas/org.gnome.shell.extensions.openweatherrefined.gschema.xml
MSGSRC            := $(wildcard po/*.po)
SCHEMA_XML			  := ./schemas/org.gnome.shell.extensions.openweatherrefined.gschema.xml

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
	FOUNDVERSION := $(VERSION)
else
	FOUNDVERSION := $(shell cat metadata.json | sed '/"version"/!d' | sed s/\"version\"://g | sed s/\ //g)
endif
ZIPVER = -v$(FOUNDVERSION)

TARGZ := ./releases/$(PKG_NAME)$(ZIPVER).tar.gz

.PHONY: all clean potfile mergepo install help
.SILENT: help

all: _build

clean:
	rm -f ./schemas/gschemas.compiled
	rm -f ./po/*.mo
	rm -rf ./releases
	rm -rf ./_build

./schemas/gschemas.compiled: $(SCHEMA_XML)
	glib-compile-schemas --strict ./schemas/

potfile: ./po/openweather.pot

mergepo: potfile
	for l in $(MSGSRC); do \
		msgmerge -U $$l ./po/openweather.pot; \
	done;

./po/openweather.pot: $(TOLOCALIZE)
	mkdir -p po
	xgettext -k_ -kN_ --from-code utf-8 -o po/openweather.pot --keyword=XGT --package-name $(PKG_NAME) $(TOLOCALIZE)

./po/%.mo: ./po/%.po
	msgfmt -c $< -o $@

install: _build
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

releases: mergepo _build
	printf -- 'NEEDED: zip tar\n'
	mkdir -p ./releases

	cd ./_build ; \
	zip -qr "../$(PKG_NAME)$(ZIPVER).zip" .
	mv ./$(PKG_NAME)$(ZIPVER).zip ./releases

	cd ./_build ; \
	tar -czf "../$(PKG_NAME)$(ZIPVER).tar.gz" .
	mv "./$(PKG_NAME)$(ZIPVER).tar.gz" $(TARGZ)
	sha256sum $(TARGZ) > $(addsuffix .sha256,$(TARGZ))
	cat $(addsuffix .sha256,$(TARGZ))

./_build: ./schemas/gschemas.compiled $(SCHEMA_XML) $(MSGSRC:.po=.mo) $(BASE_MODULES) $(SRC_FILES) $(PREFS_FILES) $(EXTRA_DIRECTORIES)
	-rm -fR ./_build
	mkdir -p ./_build/preferences
	cp $(BASE_MODULES) $(addprefix src/, $(SRC_MODULES)) ./_build
	cp $(addprefix src/preferences/, $(PREFS_MODULES)) ./_build/preferences
	cp -r $(EXTRA_DIRECTORIES) ./_build
	mkdir -p ./_build/schemas
	cp $(SCHEMA_XML) ./_build/schemas/
	cp ./schemas/gschemas.compiled ./_build/schemas/
	mkdir -p ./_build/locale
	for l in $(MSGSRC:.po=.mo) ; do \
		lf=_build/locale/`basename $$l .mo`; \
		mkdir -p $$lf; \
		mkdir -p $$lf/LC_MESSAGES; \
		cp $$l $$lf/LC_MESSAGES/$(PKG_NAME).mo; \
	done;
ifdef VERSION
	sed -i 's/"version": .*/"version": $(VERSION)/' ./_build/metadata.json;
else ifneq ($(strip $(GIT_VER)),)
	sed -i '/"version": .*/i\ \ "git-version": "$(GIT_VER)",' ./_build/metadata.json;
endif

help:
	printf '\n** OpenWeather Refined v%s (%s) **\n' `grep -oP --color=never '(?<="version-name": ")[^"]*' ./metadata.json` "$(GIT_VER)"
	printf "Switch git to latest release (recommended if you're just trying to install):\n"
	printf '\tgit switch --detach latest\n'
	printf 'Build to output directory (./_build) and regenerate translation files:\n'
	printf '\tmake\n'
	printf 'Install to local user profile (log-out required after):\n'
	printf '\tmake install\n'
	printf 'Install system-wide (log-out required after):\n'
	printf '\tmake install DESTDIR=/usr/share\n'
	printf 'Build translations:\n'
	printf '\tmake mergepo\n'
	printf 'Make Gzip and Zip archives of release build (in ./releases)\n'
	printf '\tmake releases\n'
	printf 'Clean build files:\n'
	printf '\tmake clean\n'
	printf 'See changelog:\n'
	printf '\tless CHANGELOG.md\n'
	printf 'Test in nested GNOME shell:\n'
	printf '\t./nest-test.sh\n'
	printf '\n'

