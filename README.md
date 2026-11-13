# Pip, the desk pet for Claude Code

![Pip landing page](docs/hero.jpg)

Pip is a small animated pet that sits in the corner of your screen and watches every
[Claude Code](https://claude.com/claude-code) session you have open. It tells you the moment
a session is done, or when Claude is waiting on you.

**[Website](https://pip-pet.vercel.app)** · **[Download for Windows](https://github.com/youssef-110/pip-pet/releases/latest/download/Pip-Setup.exe)**

<img src="docs/desktop.png" alt="Pip on the desktop announcing that a session is done" width="360">

## What it does

- **Working**: while Claude thinks or runs tools, Pip types on a tiny laptop.
- **Done**: Pip hops, chimes, and shows the project name and the last line Claude wrote.
- **Needs you**: on a permission prompt or a question, Pip waves until you come back.
- **All sessions**: one dot per running session. Hover to see what each one is doing.
- **There when Claude is**: open the Claude desktop app or start `claude` in a terminal and Pip pops up and waves hello. Close the last one and it waves goodbye and leaves. Right-click to hide it until Claude needs you, or switch it off in Settings.
- **Toys**: give Simba the cat the white cheese (under Wearing) and he eats it, three bites at a time.
- **Picks up nicely**: drag Pip anywhere; it dangles and kicks while you carry it.
- **Yours**: three sizes, sound on or off, start with Windows, and an update notice when a new version is out.
- **Out of the way**: Pip hides when you go fullscreen and only pops up when a session is done or needs you.
- **Works with a Claude subscription and with an API key**, because it listens to Claude Code hooks, not to your account.

## Characters

28 characters, 13 colours and 7 things to wear or hold.

- **Pip**, the default: a small fox. The tip of its tail turns amber while Claude works, green when a session is done and red when Claude needs you.
- **Simba**, a real seal-point Ragdoll cat, drawn from photos. He loves white cheese.
- **Zuck**, a parody founder with one expression for every occasion.
- **David**, **Lucy** and **Geralt**: fan art of characters from Cyberpunk: Edgerunners and The Witcher.
- Earlier Pips, still on call: **Scamp** the horned imp and **Classic**, the first Pip.
- The rest: Spark, Nyx, Kage, Titan, Vale, Orbit, Grim, Blaze, Mochi, Boo, Bit, Lotl, Fig, Bun, Nori, Quack the rubber duck, Kapi the capybara, Mame the shiba, Inky the octopus and Sage the wizard.

Simba, Zuck, David, Lucy and Geralt keep their own colours; for them the colour you pick sets the app theme.

All artwork is drawn for this project as SVG; no game or show assets are used. David, Lucy and Geralt are unofficial fan art: Cyberpunk and The Witcher belong to CD PROJEKT RED, and this project is not affiliated with or endorsed by CD PROJEKT RED, Studio Trigger or Netflix. Spark and Nyx are fan tributes and not official artwork of Anthropic or of any game or show. Zuck is a cartoon parody and is not affiliated with or endorsed by the person it pokes fun at.

Open Pip from the Start menu or the tray icon to choose. Launching Pip opens its app window, where you pick a character, watch your sessions live and change settings.

![Pip app window](docs/app.png)

![Character sheet](docs/characters.png)

## How it works

Pip is an Electron overlay window. On first launch it adds a few `type: "http"` hooks to
`~/.claude/settings.json` (a backup is saved next to it as `settings.json.pip-backup`).
Claude Code then posts session events to `http://127.0.0.1:47821/hook`. Nothing leaves your machine.

Hooks used: `UserPromptSubmit`, `PostToolUse`, `PermissionRequest`, `Notification`, `Stop`,
`StopFailure`, `SessionEnd`. Remove them any time in **Settings > Remove hooks**. Uninstalling Pip removes them too.

## Run from source

```bash
cd app
npm install
npm start        # run the pet
npm test         # session logic and hook installer tests
npm run dist     # build the Windows installer into app/dist
npm run icon     # redraw the app and tray icons from Pip's drawing
```

The landing page is static: open `site/index.html`, or serve the `site` folder.
`app/renderer/pet.js` and `pet.css` hold the characters and are copied into `site/` when they change.

## Limits

- Windows only for now. The fullscreen detection uses a Windows API.
- "Claude is open" means a Claude desktop window, or a native `claude.exe` running in a terminal. If you installed Claude Code through npm, Pip appears on your first prompt instead of when the terminal opens.
- The installer is unsigned, so Windows SmartScreen asks once.
- Hiding only triggers on true fullscreen. For windowed video, pick **Show > Only when Claude is done or needs me**.

## Licence

MIT. Pip is an independent fan project and is not affiliated with or endorsed by Anthropic.
