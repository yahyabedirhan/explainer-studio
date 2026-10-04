# Brief: shipyard architecture

## Source project

Read-only sources:

- `yahyabedirhan/shipyard`, PR #206 (effort notes-and-notify) at commit `862fe6f`: ADR 0005 (remote pings through Herdr), 0008 (two config files), 0009 (notes in Notion), 0010 (notices over the tailnet); `skills/shipyard/references/notices.md` and `notes.md`; `docs/references/tailscale-serve.md`; `docs/low-level-design.md` traces 14 to 16.
- `yahyabedirhan/herdr-shipyard`, PR #2 (the plugin's `notices` and `notices-read` actions) at commit `bf5340f`, and its README.
- The private Tailscale and Notion setup docs: used for shape only. No hostnames, IPs, logins, tokens or machine labels appear in the video.

## Goal

Show how every piece connects: the Mac, the remote machines, the Shipyard app, the `shipyard` command on macOS and on Linux, the herdr-shipyard plugin, Tailscale and Notion. Follow one notice and one note end to end.

## Audience

The maintainer, who knows each piece by name but wants the whole map in one picture.

## Length

About three and a half to four minutes, 15 scenes. Approved.

## Aspect ratio

16:9, 1920 x 1080.

## fps

30

## Brand colors (hex)

Shipyard's khaki green as the main accent. One colour per route, kept the same in every scene:

- the Mac and the app: khaki green
- Herdr and the poll route: amber
- Tailscale and the tailnet route: blue
- Notion and notes: off-white on near-black, Notion's own neutral

## Fonts

A bold grotesk for headings, a monospace for commands and config keys.

## Tone

Calm and exact, like a good engineer at a whiteboard. One idea per scene. The diagram builds one piece at a time, and each scene adds to the same map.

## Scene list

A single map builds up across the video: the Mac on the left, the machines on the right, Notion at the top. Each scene adds or lights up one part of it.

| # | id | On screen | Narration |
|---|---|---|---|
| 1 | hook | Pieces scattered and unconnected: a Mac, two servers, a menu bar, a Notion page, a Tailscale knot. Hard cut to the title. | You run coding agents on your Mac, and on a few servers. You keep notes in Notion. And a little menu bar app called Shipyard is meant to tie it all together. So how does it actually connect? |
| 2 | the-mac | The Mac box. The menu bar with Shipyard's icon, the panel dropping down. Inside the app bundle, the `shipyard` command. A socket line `control.sock` between them. | Start with the Mac. Shipyard lives in the menu bar and lists your pull requests, issues and runs. Inside the app sits a command line tool, also called shipyard. An agent on the Mac runs that command, and it talks to the app over a private socket on the same machine. |
| 3 | the-machines | Two Linux servers on the right. Each runs Herdr. The herdr-shipyard plugin installs, pulls `shipyard-linux` from a GitHub release, checks its checksum. | Now the servers. Your agents there run inside herder, a terminal manager for agents. On each server you install one herder plugin, herder shipyard. It downloads the Linux build of the same shipyard command, checks it, and puts it on the path. So an agent on a server types exactly what it would type on the Mac. |
| 4 | the-rule | An amber line from the Mac's Herdr to each server. Arrow points out from the Mac only. Caption: "The Mac reaches out. A machine never reaches in." Clock icon, 30 seconds. | How do they talk? Through herder too. The herder on your Mac already keeps a connection to each saved server. Shipyard rides on it, with one rule. The Mac reaches out. A server never reaches in. Every thirty seconds the Mac asks each server's plugin, what do you have for me? |
| 5 | two-files | Two file cards. `config.toml`, on the Mac only, read by the app. `cli.toml`, on every machine, read by the command. A red X on a key appearing in both. | Settings follow the same split. The app reads config dot toml, and it lives only on the Mac. The command reads its own file, C L I dot toml, on every machine. No setting appears in both, so it's always clear which side acts on it. |
| 6 | ping-or-notice | Two cards side by side. Ping: listed in the menu, numbered, kept until seen. Notice: one banner, never listed, gone. | Agents talk to you in two ways. A ping is something you must act on. It stays in the menu until you've seen it. A notice is a status you glance at. Tests running. Done. It shows once, as a banner, and is never kept. Let's follow one notice down each road it can take. |
| 7 | notice-on-mac | Green path: `shipyard notify "Tests passed"` → socket → app → rules check `agent.notice` → banner. Terminal prints `shown`. | Road one, on the Mac. The agent runs shipyard notify. The command hands the notice to the app over the socket. The app files it under a project, checks that project's rules allow notices, and shows the banner. Then it answers, shown. |
| 8 | notice-poll | Amber path on a server: notify → plugin's queue folder → terminal prints `queued`. Then the 30-second clock ticks; the Mac pulls `notices`, drops anything older than ten minutes, sends `notices-read`, shows the banner. | Road two, from a server, the slow way. The command can't reach the Mac, so it leaves the notice with the plugin, and prints queued. On the Mac's next poll, it collects waiting notices, drops any older than ten minutes, tells the plugin they're read, and shows the rest. Up to thirty seconds late, and no images. But nothing on the server ever reaches the Mac. |
| 9 | tailscale | Blue tailnet ring around the Mac and servers. Zoom into the Mac: the app listening on 127.0.0.1 only. `tailscale serve` in front, stamping each request with the sender's login. The app compares it with its own login. A browser request bounces off. | Thirty seconds is too slow for "this just happened". So notices get one narrow exception: the tailnet. Tailscale already links your machines as you. On the Mac, the app listens only on its own loopback address, and only when you turn it on. Tailscale serve opens that port to your tailnet alone, and stamps every request with who sent it. The app accepts a notice only when that login is your own. |
| 10 | notice-tailnet | Blue path: server `cli.toml` with `app-machine` → request across the tailnet → serve → listener → login check → rules → banner. Timer reads under one second. Terminal prints `shown`. A Herdr button on the notice is crossed out. | Road three. A server whose C L I dot toml names your Mac sends the notice straight across the tailnet. Serve stamps it, the app checks the login, applies the same rules, and shows it, in about a second. The server even hears back, shown. One catch: a button that jumps to a herder pane is refused here, because the Mac couldn't tell which server's herder you meant. |
| 11 | notes-in-notion | Notion at the top of the map. "Shipyard Notes" page, under it one database per project, rows numbered SHIP-1, SHIP-2. | Now notes. Notes are yours, not your agents'. They live in Notion. One page called Shipyard Notes, and under it, one database per project, named exactly like the project. Each note gets a number that only grows, like ship seven. |
| 12 | note-written | You speak into a phone; an agent (phone, Mac or server) writes into Notion through the Notion connector, Notion's MCP server or the ntn command. Shipyard is not in this path. | You dictate a thought to any agent. Claude on your phone, an agent on the Mac, or one on a server. It writes the note straight into Notion with its own Notion tools. Shipyard isn't in this path at all, and there's no shipyard command for notes. |
| 13 | note-read | The Mac app with a key icon labelled Keychain → Notion API every 60 seconds and when the menu opens → a Notes group in the project: `SHIP-7 · Group pings by agent`. The pencil icon on the header creates an empty note and opens Notion. | The app reads notes itself. You give it a Notion token once, and it stays in the Mac's keychain. Agents never see it. Every minute, and whenever you open the menu, the app asks Notion for each project's open notes, and lists them. The pencil on a project starts a new, empty note and opens it in Notion. |
| 14 | the-map | The whole map at once, three coloured lanes: amber, Herdr and pings and the poll route; blue, Tailscale and fast notices; neutral, Notion and notes. | So here is the whole map. Herdr carries pings, and slow notices, with the Mac always asking. Tailscale carries fast notices, straight in, from you to you. And Notion holds your notes, read by the app with a key that never leaves the Mac. |
| 15 | outro | Hard cut: Shipyard logo, one line, "Everything your agents do, in one menu." | Three roads, one menu. That's Shipyard. |

## Preferred Kokoro voice

af_heart.

## Music or SFX

No music. Subtle SFX, generated locally: a soft tick as each diagram piece lands, a chime when a notice banner shows.

## Captions (yes/no)

Yes, burned in, one sentence at a time.

## Reference videos

None.
