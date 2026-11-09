# gext-reload

Loads the installed version of a GNOME Shell extension into the running shell, without logging out (Wayland). Two
parts: the `gext-reload` script and the helper extension `gext-reload@alessandrot`. See README.md for how it works.
The user's notes: `~/Dokumente/Obsidian/LinuxDocs/Customizations/15-Load-New-GNOME-Extension-Without-Relogin.md`.

The user's other extensions in `~/GIT` reload with it (`gext-reload <uuid>`), and their CLAUDE.md files say so.

## Install

```sh
install -m 755 gext-reload ~/.local/bin/
gnome-extensions pack --force --extra-source=gext-reload . && gnome-extensions install --force gext-reload@alessandrot.shell-extension.zip
```

- **The script:** a change takes effect as soon as it is copied to `~/.local/bin`; nothing needs reloading.
- **The helper extension:** don't reload it with `gext-reload` itself. Its D-Bus method would unload the code that is
  answering the call. Reload it with the Looking Glass line the script prints when the helper isn't running, or log
  out and in.
- Check: `gnome-extensions info gext-reload@alessandrot` shows State: ACTIVE.

## Testing a change

- Try it on a small extension first, such as `gext-reload hide-spotify-tray@alessandrot`.
- Then check:
  - `gnome-extensions info <uuid>` shows State: ACTIVE.
  - `journalctl --user -b --since -1min -g "JS ERROR|gext-reload"` shows no errors.
- A reload runs code in the live session. A Clutter layout error in the reloaded extension aborts the shell, which
  logs the user out. To recover:
  - Find the cause: `journalctl -b -g "Clutter-ERROR|ClutterBoxLayout|JS ERROR"`.
  - Then `gnome-extensions disable <uuid>` and `gsettings set org.gnome.shell disable-user-extensions false`.
