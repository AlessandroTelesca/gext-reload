import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import {ExtensionState} from 'resource:///org/gnome/shell/misc/extensionUtils.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const PATH = '/io/github/alessandrotelesca/GextReload';
const INTERFACE = `
<node>
  <interface name="io.github.alessandrotelesca.GextReload">
    <method name="Reload">
      <arg type="s" direction="in" name="uuid"/>
      <arg type="s" direction="in" name="dir"/>
    </method>
  </interface>
</node>`;

const PER_USER = 2;

export default class GextReloadExtension extends Extension {
    enable() {
        this._dbus = Gio.DBusExportedObject.wrapJSObject(INTERFACE, this);
        this._dbus.export(Gio.DBus.session, PATH);
    }

    disable() {
        this._dbus?.unexport();
        this._dbus = null;
    }

    // Swaps the extension `uuid` (running or not yet known to the shell) for the copy in `dir`, which the
    // gext-reload script has prepared.
    async _reload(uuid, dir) {
        if (uuid === this.uuid)
            throw new Error('The helper cannot reload itself');
        // Only what the script prepares: <runtime dir>/gext-reload/<stamp>/<uuid>.
        const root = `${GLib.get_user_runtime_dir()}/gext-reload/`;
        const file = Gio.File.new_for_path(dir);
        if (!file.get_path().startsWith(root) || file.get_basename() !== uuid)
            throw new Error(`Not a gext-reload copy of ${uuid}: ${dir}`);

        const manager = Main.extensionManager;
        const old = manager.lookup(uuid);
        if (old)
            await manager.unloadExtension(old);
        // The shell refuses a version other than the one it unloaded.
        manager._unloadedExtensions.delete(uuid);

        const extension = manager.createExtensionObject(uuid, file, PER_USER);
        await manager.loadExtension(extension);
        if (extension.state === ExtensionState.ERROR)
            throw new Error(extension.error || 'The extension failed to load');
        if (extension.state === ExtensionState.OUT_OF_DATE)
            throw new Error('The extension does not support this GNOME Shell version');
    }

    ReloadAsync([uuid, dir], invocation) {
        this._reload(uuid, dir).then(
            () => invocation.return_value(null),
            e => invocation.return_dbus_error('io.github.alessandrotelesca.GextReload.Error', e.message));
    }
}
