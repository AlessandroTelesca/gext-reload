# gext-reload

Loads the installed version of a GNOME Shell extension into the running shell, without logging out (Wayland).

```sh
gext-reload <uuid>
```

Works for a newly installed extension and for an update of one that is already running.

Two parts:

- `gext-reload` (script, goes in `~/.local/bin`): copies the installed extension to `$XDG_RUNTIME_DIR/gext-reload/<timestamp>/<uuid>` and, in the copy, renames the classes passed to `GObject.registerClass`. The shell keeps loaded code in memory by file path and GObject classes registered by name, so a fresh path and fresh names make it load the new code.
- `gext-reload@alessandrot` (helper extension): takes the script's request over D-Bus and swaps the running extension for the copy. Without it the script prints, and copies, a line that does the same from Looking Glass.

The copy is gone after logout; the next login loads the installed version.

Install:

```sh
install -m 755 gext-reload ~/.local/bin/
gnome-extensions pack --force --extra-source=gext-reload . && gnome-extensions install --force gext-reload@alessandrot.shell-extension.zip
```

then log out and in once and `gnome-extensions enable gext-reload@user`.

Limits:

- The old code stays in memory until logout.
- An extension that leaves things behind when disabled can misbehave after a reload.
- The renaming goes by pattern on the source text; an extension that registers classes in an unusual way may still fail with `already registered`.
- The helper lets any program in your session load code into the shell at once, from a folder only you can write to. A program running as you could already do that by installing an extension, though only from the next login.

GNOME Shell 50.

License: GPL-2.0-or-later, see `LICENSE`.
