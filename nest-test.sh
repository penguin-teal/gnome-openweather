#!/bin/sh

env MUTTER_DEBUG_DUMMY_MODE_SPECS=1280x1024 dbus-run-session -- gnome-shell --nested --wayland
