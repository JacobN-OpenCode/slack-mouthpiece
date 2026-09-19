import { tmpdir } from "node:os"
import { join } from "node:path"
import "dotenv/config"

export type TtsProvider = "macos-say" | "elevenlabs" | "xtts"

export const config = {
  botToken: process.env.SLACK_BOT_TOKEN ?? "",
  appToken: process.env.SLACK_APP_TOKEN ?? "",
  channelId: process.env.MOUTHPIECE_CHANNEL_ID ?? "",
  userId: process.env.MOUTHPIECE_USER_ID ?? "",
  ttsProvider: (process.env.TTS_PROVIDER ?? "macos-say") as TtsProvider,
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY ?? "",
  elevenlabsVoiceId: process.env.ELEVENLABS_VOICE_ID ?? "",
  elevenlabsModel: process.env.ELEVENLABS_MODEL ?? "eleven_flash_v2_5",
  blackholeDevice: process.env.BLACKHOLE_DEVICE ?? "BlackHole 2ch",
  reactEmoji: process.env.MOUTHPIECE_REACT_EMOJI ?? "",
  maxChars: Number(process.env.MOUTHPIECE_MAX_CHARS ?? "500"),
  tmpDir: process.env.MOUTHPIECE_TMP_DIR ?? join(tmpdir(), "mouthpiece"),
}

export function requireTts(configValue: typeof config) {
  if (configValue.ttsProvider === "elevenlabs") {
    if (!configValue.elevenlabsApiKey || !configValue.elevenlabsVoiceId) {
      throw new Error(
        "TTS_PROVIDER=elevenlabs but ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID are not set in .env"
      )
    }
  }
  if (configValue.ttsProvider === "xtts") {
    throw new Error("xtts provider is not implemented yet — use elevenlabs or macos-say")
  }
}

export function requireSlack(appToken: string, botToken: string) {
  if (!appToken || !botToken) {
    throw new Error(
      "SLACK_APP_TOKEN (xapp-...) and SLACK_BOT_TOKEN (xoxb-...) are required in .env. See README section 'Create the Slack app'."
    )
  }
}

export function trimTo(text: string) {
  if (text.length > config.maxChars) {
    return `${text.slice(0, config.maxChars)}…`
  }
  return text
}