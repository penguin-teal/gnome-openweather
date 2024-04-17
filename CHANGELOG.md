## v134 (IN PROGRESS)

This version provides a large rewrite with support for an additional provider.

Improvements:
- Choose between OpenWeatherMap.org or WeatherAPI.com
- More icons
- Package Breeze icons instead of Adwaita

Bug Fixes:
- Fix geolocation provider selector in preferences not working correctly
- Checkboxes on locations in preferences finally show correctly

## v133

This version fixes some bugs left in GNOME 45.

Improvements:
- Hide "Gusts" in pop-up if unavailable (instead of showing "?")
- Colon after "Gusts" in pop-up
- "-0" will now never appear as a temperature

Bug Fixes:
- Forecast blank in pop-up on GNOME 45
- Weird positioning of panel on GNOME 45
- Text overflowing and being ellipsised on GNOME 45
- Fix crash on first-run if location services are off

## v132

This version supports GNOME 46 (and maintains support for GNOME 45).

- GNOME 46 Support

Improvements:
- "Use Extension API Key" now is flipped and reads "Use Custom API Key" for clarity
- Revert wind direction to use letters instead of arrows by default
- Improve Czech translations (thanks lev741)
- Improve Dutch translations (thanks Heimen Stoffels)

## v131

Improvements:
- Notice on how to search up new locations in "Edit Location" menu
- No more space between humidity value and "%"

Bug Fixes:
- Fix extension not initializing sometimes
- Fix migrations only happening on first extension download

## v130

Improvements:
- Remove "hPa" presure unit since it was a duplicate of "mbar" (existing configurations will be migrated)
- Pressure decimal places are now independent of temperature
- Wind speed decimal places are now independent of temperature

Bug Fixes:
- Fix panel location dropdown not working

## v129

Features:
- Now use device location services by default (requires location permission to be on).
- Can optionally still use HTTP location service.
- Copy settings JSON in About settings page
- Remove "Geocode.farm" from Geolocation Providers

Bug Fixes:
- Fix "Position in Panel" only taking effect on restart

## v128

v128 changes how locations are stored and adds many options.

Features/Improvements:
- No more boot delay by default
- Default location is now "My Location" for laptops or your current city at first load for desktops
- Option to only show degree sign instead of deg. fahrenheit, deg. celsisus, etc.
- Make manual refreshes refresh current location (for "My Location")
- No more space between temperature and degree unit
- About page now says "OpenWeather Refined" instead of "OpenWeather"
- High contrast now mode affects entire pop-up
- Major re-work in the way locations are stored internally
- Automatic migration from old (pre-v128) location format
- Automatic import of settings from "openweather@jenslody.de"
- Minor miscellaneous display changes
- Minor performance improvements

Bug Fixes:
- Fix Edit Location refusing to save
- Resetting settings now closes the preferences window since before it was un-updated and wrong
- Fix about page extension version being wrong/misleading when downloaded from GNOME Extension website

## v127

v127 allows to use the current location for the weather and some other improvements.

Features/Improvements:
- Special "My Location" city that refreshes by default every 60 minutes but is adjustable
- Use imperial units by default if in United States
- Option to have clock format (AM/PM or 24-hour) follow GNOME desktop setting
- Button to reset settings to default

## v126

v126 had some changes to change the name and settings path, and also adds the
feature to display the coming sunset/sunrise in the panel alongside
the temperature/conditions.

Features/Improvements:
- Option to display the time of the coming sunrise or sunset in the panel
- Option to choose if that sun time comes before or after the temperature/conditions
- Change settings path to not conflict with original OpenWeather extension

## v125

v125 changed some stuff to get on GNOME extensions.

Features/Improvements:
- Name now "OpenWeather 2"
- Description mentions this is a fork

## v124

v124 fixes a major bug in v123 and adds a 24-hour or AM/PM time option.

Features/Improvements:
- AM/PM or 24-hour clock option
- Default setting for position is now 'right'
Bug Fixes:
- Fix searching for wrong UUID breaking most things

## v123

Features/Improvements:
- GNOME 45 Support (from Kenneth Topp's fork)
- Simplify unnecessarily long names (e.g. 'Savannah, Chatham County, Georgia, United States' -> 'Savannah, Georgia')
- Making 'Loading' message '...' since it was sometimes way too long
- Default setting for temperature decimal places is now '0'

Bug Fixes:
- Fix "Weather Data By..." URL not opening website
- Fix weird errors that happen sometimes when deleting a location
- Fix location look-up forever "pretending" to be searching with no Internet

