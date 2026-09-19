# slack-mouthpiece

Type a message in a chosen Slack channel and it says it out loud — to your huddle — in a clone of *your* voice. No separate "bot user account" needed, no workspace admin required. The voice rides your own Slack mic.

## How it works

There is no public Slack API for a bot to emit audio into a huddle, so this uses the other well-known trick instead:

1. A small Slack app (Socket Mode, bot token, runs locally) watches the magic channel.
2. When **you** post there, it hands the text to a TTS engine.
3. The audio is played into a **virtual microphone** (BlackHole).
4. Your Slack client has its huddle mic set to that virtual mic, so everyone in the huddle hears your clone speak.

```
you type in channel
   │  (Events API, Socket Mode, local Bolt app)
   ▼
Bolt listener → filter: your user ID + magic channel
   ▼
TTS (elevenlabs clone of your voice | macos-say for testing)
   ▼
audio → BlackHole virtual device (your Slack mic)
   ▼
Slack huddle hears you say it
```

## Repo layout

```
manifest.yaml        # Slack app manifest (scopes, events, socket mode)
src/config.ts        # reads .env
src/tts.ts           # providers: macos-say (test) / elevenlabs (clone)
src/playback.ts      # routes playback to BlackHole via SwitchAudioSource + afplay
src/speak.ts         # serialised speak queue
src/index.ts         # Bolt listener → speak
src/test-audio.ts    # test the audio chain without Slack: bun run test:audio "hi"
```

## One-time setup

### 1. Audio — virtual mic (needs your password + a reboot, so do this in your own terminal)

```sh
brew install switchaudio-osx blackhole-2ch   # blackhole will ask for your Mac password
sudo reboot   # or just log out/in — required for the audio driver to load
```

Then:
- **Audio MIDI Setup** (Spotlight it) → + → "Create Aggregate Device"
- Tick **BlackHole 2ch** and your real mic (e.g. MacBook Air Microphone) → name it `Voice Combo`
- In Slack (`Preferences → Audio & video` / your huddle settings) set **Microphone** to `Voice Combo`, and turn **off** noise suppression + automatic gain control (they mumble TTS).

### 2. Slack app

1. [api.slack.com/apps](https://api.slack.com/apps) → Create New App → **From an app manifest** → paste `manifest.yaml` → install to your workspace.
2. App Settings → **Socket Mode** → Enable, then "Generate Level 1 App-Level Token" → copy `xapp-...` → `SLACK_APP_TOKEN`.
3. OAuth & Permissions → copy **Bot User OAuth Token** (`xoxb-...`) → `SLACK_BOT_TOKEN`.
4. Add the **Mouthpiece** bot to the magic channel (channel details → More → Add apps).
5. Double-check the app isn't blocked by workspace app-approval settings.

### 3. `.env`

```sh
cp .env.example .env
```

Fill in `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, `MOUTHPIECE_CHANNEL_ID`, `MOUTHPIECE_USER_ID` (for a channel as a member: right-click its name → copy link → the `C...`; your own ID is the `U...` under your full profile URL).

### 4. Voice

- **Test first (free, no keys):** leave `TTS_PROVIDER=macos-say` and run `bun run test:audio "hello there"` — you'll hear a Mac system voice through BlackHole.
- **Your clone (ElevenLabs):** sign up at [elevenlabs.io](https://elevenlabs.io) → VoiceLab → **Instant Voice Cloning** → add a ~1–5 min clean recording of yourself. Set `TTS_PROVIDER=elevenlabs`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`. Starter plan (~$5/mo) covers instant cloning + ~30 min of audio/mo.

## Run

```sh
bun install
bun run test:audio "hi this is a test"   # verify the audio chain first
bun run start                             # listens + speaks
```

Then: join (or start) a huddle on your Mac in the usual way, type in the magic channel, and your clone reads it out loud.

## Notes & quirks

- It's your account and your mic — no separate participant shows up. That's the point: it is "you" speaking hands-free.
- While speaking, the Mac's system output is briefly switched to BlackHole, so your own audio ducks for the second the speech plays.
- Autopilot mode: only speaks while your Slack gets the message; if you're not in a huddle, nothing is audible (it's just your mic).
- `MOUTHPIECE_REACT_EMOJI` (default `loud_sound`) makes the bot react to your message so you can see it picked it up. Blank disables it.
- This is against nothing in particular, but it *is* an automated session on a human account — fine for personal use, keep it low-profile in shared channels.

## Roadmap

- `xtts` provider: free local clone via `coqui-tts` running on this Mac's MPS — no monthly cost.
- Optional auto-join: AppleScript UI automation to hop your session into the channel's huddle when you type.
- Gate on "actually in huddle" via the `user_huddle_changed` RTM event.