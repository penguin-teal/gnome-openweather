#!/bin/sh
# Run this to generate all the initial makefiles, etc.
#
#
#  Weather extension for GNOME Shell
#  - generate Makefiles
#
# Copyright (C) 2012 - 2021
#     Jens Lody <jens@jenslody.de>,
# Copyright (C) 2022
#     Jason Oickle <openweather at joickle dot com>,
#
# This file is part of gnome-shell-extension-openweather.
#
# gnome-shell-extension-openweather is free software: you can
# redistribute it and/or modify it under the terms of the GNU
# General Public License as published by the Free Software
# Foundation, either version 3 of the License, or (at your option)
# any later version.
#
# gnome-shell-extension-openweather is distributed in the hope that it
# will be useful, but WITHOUT ANY WARRANTY; without even the
# implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
# PURPOSE.  See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with gnome-shell-extension-openweather.  If not, see
# <http://www.gnu.org/licenses/>.
#



srcdir=`dirname $0`
test -z "$srcdir" && srcdir=.

touch ChangeLog

test -f $srcdir/configure.ac || {
    echo -n "**Error**: Directory "\`$srcdir\'" does not look like the"
    echo " top-level gnome-shell-extensions directory"
    exit 1
}

which gnome-autogen.sh || {
    echo "You need to install gnome-common from GNOME Git (or from"
    echo "your OS vendor's package manager)."
    exit 1
}
. gnome-autogen.sh
