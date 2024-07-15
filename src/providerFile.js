/*
  Copyright 2024 Teal Penguin

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import Gio from "gi://Gio";
import GLib from "gi://GLib";

export async function loadProviderFile(providerId)
{
  return new Promise((resolve, reject) => {
    if(!/[a-z0-9]/.test(providerId)) reject("Provider ID not lowercase alphanumeric.");

    let file = Gio.File.new_for_path(`./providers/${providerId}`);
    file.load_contents_async(
      null,
      (result) =>
      {
        let [success, contents] = Gio.File.read_finish(result);

        if(!success) reject("IO Error");

        let decoder = new TextDecoder("utf-8");
        let str = decoder.decode(contents);

        let obj = JSON.parse(str);
        if(obj.id === providerId) resolve(obj);
        else
        {
          reject(`ID (${obj.id}) in JSON didn't match file ID of ${providerId}.`);
        }

      }
    );
  });
}

