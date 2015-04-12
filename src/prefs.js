/* jshint esnext:true */
/*
 *
 *  Weather extension for GNOME Shell preferences
 *  - Creates a widget to set the preferences of the weather extension
 *
 * Copyright (C) 2012 - 2015
 *     Canek Peláez <canek@ciencias.unam.mx>,
 *     Christian METZLER <neroth@xeked.com>,
 *     Jens Lody <jens@jenslody.de>,
 *
 * This file is part of gnome-shell-extension-openweather.
 *
 * gnome-shell-extension-openweather is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.
 *
 * gnome-shell-extension-openweather is distributed in the hope that it
 * will be useful, but WITHOUT ANY WARRANTY; without even the
 * implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
 * PURPOSE.  See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gnome-shell-extension-openweather.  If not, see
 * <http://www.gnu.org/licenses/>.
 *
 */
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const GtkBuilder = Gtk.Builder;
const Gio = imports.gi.Gio;
const Gettext = imports.gettext.domain('gnome-shell-extension-openweather');
const _ = Gettext.gettext;
const Soup = imports.gi.Soup;

const Lang = imports.lang;
const Mainloop = imports.mainloop;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Config = imports.misc.config;
const Convenience = Me.imports.convenience;

const EXTENSIONDIR = Me.dir.get_path();

const OPENWEATHER_SETTINGS_SCHEMA = 'org.gnome.shell.extensions.openweather';
const OPENWEATHER_PROVIDER_KEY = 'weather-provider';
const OPENWEATHER_UNIT_KEY = 'unit';
const OPENWEATHER_PRESSURE_UNIT_KEY = 'pressure-unit';
const OPENWEATHER_WIND_SPEED_UNIT_KEY = 'wind-speed-unit';
const OPENWEATHER_WIND_DIRECTION_KEY = 'wind-direction';
const OPENWEATHER_CITY_KEY = 'city';
const OPENWEATHER_ACTUAL_CITY_KEY = 'actual-city';
const OPENWEATHER_TRANSLATE_CONDITION_KEY = 'translate-condition';
const OPENWEATHER_USE_SYMBOLIC_ICONS_KEY = 'use-symbolic-icons';
const OPENWEATHER_USE_TEXT_ON_BUTTONS_KEY = 'use-text-on-buttons';
const OPENWEATHER_SHOW_TEXT_IN_PANEL_KEY = 'show-text-in-panel';
const OPENWEATHER_POSITION_IN_PANEL_KEY = 'position-in-panel';
const OPENWEATHER_SHOW_COMMENT_IN_PANEL_KEY = 'show-comment-in-panel';
const OPENWEATHER_SHOW_COMMENT_IN_FORECAST_KEY = 'show-comment-in-forecast';
const OPENWEATHER_REFRESH_INTERVAL_CURRENT = 'refresh-interval-current';
const OPENWEATHER_REFRESH_INTERVAL_FORECAST = 'refresh-interval-forecast';
const OPENWEATHER_CENTER_FORECAST_KEY = 'center-forecast';
const OPENWEATHER_DAYS_FORECAST = 'days-forecast';
const OPENWEATHER_DECIMAL_PLACES = 'decimal-places';
const OPENWEATHER_OWM_API_KEY = 'appid';
const OPENWEATHER_FC_API_KEY = 'appid-fc';

//URL
const OPENWEATHER_URL_BASE = 'https://open.mapquestapi.com/nominatim/v1/';
const OPENWEATHER_URL_FIND = OPENWEATHER_URL_BASE + 'search.php';
const OPENWEATHER_URL_REVERSE = OPENWEATHER_URL_BASE + 'reverse.php';

let _httpSession;

let mCities = null;

const WeatherPrefsWidget = new GObject.Class({
    Name: 'OpenWeatherExtension.Prefs.Widget',
    GTypeName: 'OpenWeatherExtensionPrefsWidget',
    Extends: Gtk.Box,

    _init: function(params) {
        this.parent(params);

        this.initWindow();

        this.refreshUI();

        this.add(this.MainWidget);
    },

    Window: new Gtk.Builder(),

    initWindow: function() {
        mCities = null;

        this.Window.add_from_file(EXTENSIONDIR + "/weather-settings.ui");

        this.MainWidget = this.Window.get_object("main-widget");
        this.treeview = this.Window.get_object("tree-treeview");
        this.liststore = this.Window.get_object("tree-liststore");
        this.editWidget = this.Window.get_object("edit-widget");
        this.editName = this.Window.get_object("edit-name");
        this.editCoord = this.Window.get_object("edit-coord");
        this.searchWidget = this.Window.get_object("search-widget");
        this.searchMenu = this.Window.get_object("search-menu");
        this.searchName = this.Window.get_object("search-name");

        this.searchName.connect("icon-release", Lang.bind(this, this.clearEntry));
        this.editName.connect("icon-release", Lang.bind(this, this.clearEntry));
        this.editCoord.connect("icon-release", Lang.bind(this, this.clearEntry));

        this.Window.get_object("tree-toolbutton-add").connect("clicked", Lang.bind(this, function() {
            this.searchWidget.show_all();
        }));

        this.Window.get_object("tree-toolbutton-remove").connect("clicked", Lang.bind(this, this.removeCity));

        this.Window.get_object("tree-toolbutton-edit").connect("clicked", Lang.bind(this, this.editCity));

        this.Window.get_object("treeview-selection").connect("changed", Lang.bind(this, function(selection) {
            this.selectionChanged(selection);
        }));

        this.Window.get_object("button-edit-cancel").connect("clicked", Lang.bind(this, this.editCancel));

        this.Window.get_object("button-edit-save").connect("clicked", Lang.bind(this, this.editSave));

        this.Window.get_object("button-search-cancel").connect("clicked", Lang.bind(this, function() {
            this.searchWidget.hide();
        }));

        this.Window.get_object("button-search-save").connect("clicked", Lang.bind(this, this.searchSave));

        this.Window.get_object("button-search-find").connect("clicked", Lang.bind(this, function() {

            let location = this.searchName.get_text().trim();
            if (location === "")
                return 0;
            let params = {
                format: 'json',
                addressdetails: '1',
                q: location
            };
            this.loadJsonAsync(OPENWEATHER_URL_FIND, params, Lang.bind(this, function() {
                if (!arguments[0])
                    return 0;
                let newCity = arguments[0];

                if (Number(newCity.length) < 1)
                    return 0;

                this.clearSearchMenu();

                var m = {};
                for (var i in newCity) {

                    let cityText = newCity[i].display_name;
                    let cityCoord = "[" + newCity[i].lat + "," + newCity[i].lon + "]";

                    let item = new Gtk.MenuItem({
                        label: cityText + " " + cityCoord
                    });
                    item.connect("activate", Lang.bind(this, this.onActivateItem));
                    this.searchMenu.append(item);
                }
                this.searchMenu.show_all();
                this.searchMenu.popup(null, null, Lang.bind(this, this.placeSearchMenu), 0, this.searchName);
                return 0;
            }));
            return 0;
        }));

        let column = new Gtk.TreeViewColumn();
        this.treeview.append_column(column);

        let renderer = new Gtk.CellRendererText();
        column.pack_start(renderer, null);

        column.set_cell_data_func(renderer, function() {
            arguments[1].markup = arguments[2].get_value(arguments[3], 0);
        });


        let theObjects = this.Window.get_objects();
        for (let i in theObjects) {
            let name = theObjects[i].get_name ? theObjects[i].get_name() : 'dummy';
            if (this[name] !== undefined) {
                if (theObjects[i].class_path()[1].indexOf('GtkEntry') != -1)
                    this.initEntry(theObjects[i]);
                else if (theObjects[i].class_path()[1].indexOf('GtkComboBoxText') != -1)
                    this.initComboBox(theObjects[i]);
                else if (theObjects[i].class_path()[1].indexOf('GtkSwitch') != -1)
                    this.initSwitch(theObjects[i]);
                this.configWidgets.push([theObjects[i], name]);
            }
        }
    },

    clearEntry: function() {
        arguments[0].set_text("");
    },

    onActivateItem: function() {
        this.searchName.set_text(arguments[0].get_label());
    },

    placeSearchMenu: function() {
        let[gx, gy, gw, gh] = this.searchName.get_window().get_geometry();
        let[px, py] = this.searchName.get_window().get_position();
        return [gx + px, gy + py + this.searchName.get_allocated_height()];
    },

    clearSearchMenu: function() {
        let children = this.searchMenu.get_children();
        for (let i in children) {
            this.searchMenu.remove(children[i]);
        }
    },

    initEntry: function(theEntry) {
        let name = theEntry.get_name();
        theEntry.text = this[name];
        if (this[name].length != 32)
            theEntry.set_icon_from_icon_name(Gtk.PositionType.LEFT, 'dialog-warning');

        theEntry.connect("notify::text", Lang.bind(this, function() {
            let key = arguments[0].text;
            this[name] = key;
            if (key.length == 32)
                theEntry.set_icon_from_icon_name(Gtk.PositionType.LEFT, '');
            else
                theEntry.set_icon_from_icon_name(Gtk.PositionType.LEFT, 'dialog-warning');
        }));
    },

    initComboBox: function(theComboBox) {
        let name = theComboBox.get_name();
        theComboBox.connect("changed", Lang.bind(this, function() {
            this[name] = arguments[0].active;
        }));
    },

    initSwitch: function(theSwitch) {
        let name = theSwitch.get_name();
        theSwitch.connect("notify::active", Lang.bind(this, function() {
            this[name] = arguments[0].active;
        }));
    },

    refreshUI: function() {
        this.MainWidget = this.Window.get_object("main-widget");
        this.treeview = this.Window.get_object("tree-treeview");
        this.liststore = this.Window.get_object("tree-liststore");

        this.Window.get_object("tree-toolbutton-remove").sensitive = Boolean(this.city.length);
        this.Window.get_object("tree-toolbutton-edit").sensitive = Boolean(this.city.length);

        if (mCities != this.city) {
            if (this.liststore !== undefined)
                this.liststore.clear();

            if (this.city.length > 0) {
                let city = String(this.city).split(" && ");

                if (city && typeof city == "string")
                    city = [city];

                let current = this.liststore.get_iter_first();

                for (let i in city) {
                    current = this.liststore.append();
                    this.liststore.set_value(current, 0, this.extractLocation(city[i]));
                }
            }

            mCities = this.city;
        }

        this.changeSelection();

        let config = this.configWidgets;
        for (let i in config) {
            if (config[i][0].active != this[config[i][1]])
                config[i][0].active = this[config[i][1]];
        }
    },

    configWidgets: [],

    selectionChanged: function(select) {
        let a = select.get_selected_rows(this.liststore)[0][0];

        if (a !== undefined)
            if (this.actual_city != parseInt(a.to_string()))
                this.actual_city = parseInt(a.to_string());
    },

    removeCity: function() {
        let city = this.city.split(" && ");
        if (!city.length)
            return 0;
        let ac = this.actual_city;
        let textDialog = _("Remove %s ?").format(this.extractLocation(city[ac]));
        let dialog = new Gtk.Dialog({
            title: ""
        });
        let label = new Gtk.Label({
            label: textDialog
        });
        label.margin_bottom = 12;

        dialog.set_border_width(12);
        dialog.set_modal(1);
        dialog.set_resizable(0);
        //dialog.set_transient_for(***** Need parent Window *****);

        dialog.add_button(Gtk.STOCK_NO, 0);
        let d = dialog.add_button(Gtk.STOCK_YES, 1);

        d.set_can_default(true);
        dialog.set_default(d);

        let dialog_area = dialog.get_content_area();
        dialog_area.pack_start(label, 0, 0, 0);
        dialog.connect("response", Lang.bind(this, function(w, response_id) {
            if (response_id) {
                if (city.length === 0)
                    city = [];

                if (city.length > 0 && typeof city != "object")
                    city = [city];

                if (city.length > 0)
                    city.splice(ac, 1);

                if (city.length > 1)
                    this.city = city.join(" && ");
                else if (city[0])
                    this.city = city[0];
                else
                    this.city = "";
            }
            dialog.hide();
            return 0;
        }));

        dialog.show_all();
        return 0;
    },

    editCity: function() {
        let city = this.city.split(" && ");
        if (!city.length)
            return 0;
        let ac = this.actual_city;
        this.editName.set_text(this.extractLocation(city[ac]));
        this.editCoord.set_text(this.extractCoord(city[ac]));
        this.editWidget.show_all();
        return 0;
    },

    searchSave: function() {
        let cityText = this.searchName.get_text().split(/\[/)[0];
        let coord = this.searchName.get_text().split(/\[/)[1].split(/\]/)[0];

        if (this.city)
            this.city = this.city + " && " + coord + ">" + cityText;
        else
            this.city = coord + ">" + cityText;

        this.searchWidget.hide();
        return 0;
    },

    editSave: function() {
        let theCity = this.city.split(" && ");

        if (theCity.length === 0)
            return 0;
        if (theCity.length > 0 && typeof theCity != "object")
            theCity = [theCity];

        let ac = this.actual_city;
        let location = this.editName.get_text();
        let coord = this.editCoord.get_text();
        theCity[ac] = coord + ">" + location;

        if (theCity.length > 1)
            this.city = theCity.join(" && ");
        else if (theCity[0])
            this.city = theCity[0];

        this.editWidget.hide();

        this.actual_city = ac;

        return 0;
    },

    editCancel: function() {
        this.editName.set_text("");
        this.editCoord.set_text("");
        this.editWidget.hide();
    },

    changeSelection: function() {
        let path = this.actual_city;
        if (arguments[0])
            path = arguments[0];
        path = Gtk.TreePath.new_from_string(String(path));
        this.treeview.get_selection().select_path(path);
    },

    loadJsonAsync: function(url, params, fun, id) {
        if (_httpSession === undefined) {
            if (ExtensionUtils.versionCheck(['3.6'], Config.PACKAGE_VERSION)) {
                // Soup session (see https://bugzilla.gnome.org/show_bug.cgi?id=661323#c64) (Simon Legner)
                _httpSession = new Soup.SessionAsync();
                Soup.Session.prototype.add_feature.call(_httpSession, new Soup.ProxyResolverDefault());
            } else
                _httpSession = new Soup.Session();
        }

        let here = this;

        let message = Soup.form_request_new_from_hash('GET', url, params);

        if (this.asyncSession === undefined)
            this.asyncSession = {};

        if (this.asyncSession[id] !== undefined && this.asyncSession[id]) {
            _httpSession.abort();
            this.asyncSession[id] = 0;
        }

        this.asyncSession[id] = 1;
        _httpSession.queue_message(message, function(_httpSession, message) {
            here.asyncSession[id] = 0;
            if (!message.response_body.data) {
                fun.call(here, 0);
                return 0;
            }

            try {
                let jp = JSON.parse(message.response_body.data);
                fun.call(here, jp);
            } catch (e) {
                fun.call(here, 0);
                return 0;
            }
            return 0;
        });
    },

    loadConfig: function() {
        this.Settings = Convenience.getSettings(OPENWEATHER_SETTINGS_SCHEMA);
        this.Settings.connect("changed", Lang.bind(this, function() {
            this.refreshUI();
        }));
    },

    get weather_provider() {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.get_enum(OPENWEATHER_PROVIDER_KEY);
    },

    set weather_provider(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_enum(OPENWEATHER_PROVIDER_KEY, v);
    },

    get units() {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.get_enum(OPENWEATHER_UNIT_KEY);
    },

    set units(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_enum(OPENWEATHER_UNIT_KEY, v);
    },

    get pressure_unit() {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.get_enum(OPENWEATHER_PRESSURE_UNIT_KEY);
    },

    set pressure_unit(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_enum(OPENWEATHER_PRESSURE_UNIT_KEY, v);
    },

    get wind_speed_unit() {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.get_enum(OPENWEATHER_WIND_SPEED_UNIT_KEY);
    },

    set wind_speed_unit(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_enum(OPENWEATHER_WIND_SPEED_UNIT_KEY, v);
    },

    get wind_direction() {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.get_boolean(OPENWEATHER_WIND_DIRECTION_KEY);
    },

    set wind_direction(v) {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.set_boolean(OPENWEATHER_WIND_DIRECTION_KEY, v);
    },

    get city() {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.get_string(OPENWEATHER_CITY_KEY);
    },

    set city(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_string(OPENWEATHER_CITY_KEY, v);
    },

    get actual_city() {
        if (!this.Settings)
            this.loadConfig();
        let a = this.Settings.get_int(OPENWEATHER_ACTUAL_CITY_KEY);
        let citys = this.city.split(" && ");

        if (citys && typeof citys == "string")
            citys = [citys];

        let l = citys.length - 1;

        if (a < 0)
            a = 0;

        if (l < 0)
            l = 0;

        if (a > l)
            a = l;

        return a;
    },

    set actual_city(a) {
        if (!this.Settings)
            this.loadConfig();
        let citys = this.city.split(" && ");

        if (citys && typeof citys == "string")
            citys = [citys];

        let l = citys.length - 1;

        if (a < 0)
            a = 0;

        if (l < 0)
            l = 0;

        if (a > l)
            a = l;

        this.Settings.set_int(OPENWEATHER_ACTUAL_CITY_KEY, a);
    },

    get translate_condition() {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.get_boolean(OPENWEATHER_TRANSLATE_CONDITION_KEY);
    },

    set translate_condition(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_boolean(OPENWEATHER_TRANSLATE_CONDITION_KEY, v);
    },

    get icon_type() {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.get_boolean(OPENWEATHER_USE_SYMBOLIC_ICONS_KEY);
    },

    set icon_type(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_boolean(OPENWEATHER_USE_SYMBOLIC_ICONS_KEY, v);
    },

    get use_text_on_buttons() {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.get_boolean(OPENWEATHER_USE_TEXT_ON_BUTTONS_KEY);
    },

    set use_text_on_buttons(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_boolean(OPENWEATHER_USE_TEXT_ON_BUTTONS_KEY, v);
    },

    get text_in_panel() {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.get_boolean(OPENWEATHER_SHOW_TEXT_IN_PANEL_KEY);
    },

    set text_in_panel(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_boolean(OPENWEATHER_SHOW_TEXT_IN_PANEL_KEY, v);
    },

    get position_in_panel() {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.get_enum(OPENWEATHER_POSITION_IN_PANEL_KEY);
    },

    set position_in_panel(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_enum(OPENWEATHER_POSITION_IN_PANEL_KEY, v);
    },

    get comment_in_panel() {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.get_boolean(OPENWEATHER_SHOW_COMMENT_IN_PANEL_KEY);
    },

    set comment_in_panel(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_boolean(OPENWEATHER_SHOW_COMMENT_IN_PANEL_KEY, v);
    },

    get comment_in_forecast() {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.get_boolean(OPENWEATHER_SHOW_COMMENT_IN_FORECAST_KEY);
    },

    set comment_in_forecast(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_boolean(OPENWEATHER_SHOW_COMMENT_IN_FORECAST_KEY, v);
    },

    get refresh_interval_current() {
        if (!this.Settings)
            this.loadConfig();
        let v = this.Settings.get_int(OPENWEATHER_REFRESH_INTERVAL_CURRENT);
        return ((v >= 600) ? v : 600);
    },

    set refresh_interval_current(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_int(OPENWEATHER_REFRESH_INTERVAL_CURRENT, ((v >= 600) ? v : 600));
    },

    get refresh_interval_forecast() {
        if (!this.Settings)
            this.loadConfig();
        let v = this.Settings.get_int(OPENWEATHER_REFRESH_INTERVAL_FORECAST);
        return ((v >= 600) ? v : 600);
    },

    set refresh_interval_forecast(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_int(OPENWEATHER_REFRESH_INTERVAL_FORECAST, ((v >= 600) ? v : 600));
    },

    get center_forecast() {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.get_boolean(OPENWEATHER_CENTER_FORECAST_KEY);
    },

    set center_forecast(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_boolean(OPENWEATHER_CENTER_FORECAST_KEY, v);
    },

    get days_forecast() {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.get_int(OPENWEATHER_DAYS_FORECAST) - 2;
    },

    set days_forecast(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_int(OPENWEATHER_DAYS_FORECAST, v + 2);
    },

    get decimal_places() {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.get_int(OPENWEATHER_DECIMAL_PLACES);
    },

    set decimal_places(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_int(OPENWEATHER_DECIMAL_PLACES, v);
    },

    get appid() {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.get_string(OPENWEATHER_OWM_API_KEY);
    },

    set appid(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_string(OPENWEATHER_OWM_API_KEY, v);
    },

    get appid_fc() {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.get_string(OPENWEATHER_FC_API_KEY);
    },

    set appid_fc(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_string(OPENWEATHER_FC_API_KEY, v);
    },

    extractLocation: function(a) {
        if (a.search(">") == -1)
            return _("Invalid city");
        return a.split(">")[1];
    },

    extractCoord: function(a) {
        if (a.search(">") == -1)
            return 0;
        return a.split(">")[0];
    }
});

function init() {
    Convenience.initTranslations('gnome-shell-extension-openweather');
}

function buildPrefsWidget() {
    let widget = new WeatherPrefsWidget();
    widget.show_all();
    return widget;
}
