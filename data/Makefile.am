extensionurl = https://github.com/jenslody/gnome-shell-extension-openweather

# Change these to modify how installation is performed
topextensiondir = $(datadir)/gnome-shell/extensions

uuid = openweather-extension@jenslody.de

extensiondir = $(topextensiondir)/$(uuid)

dist_extension_DATA = OpenWeather.png stylesheet.css weather-settings.ui

nodist_extension_DATA = metadata.json $(EXTRA_EXTENSION)

EXTRA_DIST = metadata.json.in

metadata.json: metadata.json.in $(top_builddir)/config.status
	$(AM_V_GEN) sed -e "s|[@]LOCALEDIR@|$(datadir)/locale|" \
	    -e "s|[@]uuid@|$(uuid)|" \
	    -e "s|[@]url@|$(extensionurl)|" \
	    -e "s|[@]version@|$(GIT_VERSION)|" $< > $@

CLEANFILES = metadata.json

gsettings_SCHEMAS = org.gnome.shell.extensions.openweather.gschema.xml

@GSETTINGS_RULES@

EXTRA_DIST += $(gsettings_SCHEMAS)
