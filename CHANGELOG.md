## v127

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

