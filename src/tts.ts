import { join } from "node:path"
import { writeFile } from "node:fs/promises"
import { config, requireTts } from "./config"
import { run } from "./playback"

export type SynthResult = { file: string; ext: string }

export async function synth(text: string, dir: string): Promise<SynthResult> {
  requireTts(config)

  switch (config.ttsProvider) {
    case "macos-say": {
      const file = join(dir, "say.aiff")
      await run("say", ["-o", file, text])
      return { file, ext: "aiff" }
    }

    case "elevenlabs": {
      const file = join(dir, "voice.mp3")
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${config.elevenlabsVoiceId}?output_format=mp3_44100_128`
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "xi-api-key": config.elevenlabsApiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: config.elevenlabsModel,
        }),
      })
      if (!res.ok) {
        throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`)
      }
      const buf = Buffer.from(await res.arrayBuffer())
      await writeFile(file, buf)
      return { file, ext: "mp3" }
    }

    case "xtts": {
      throw new Error("xtts provider is not implemented yet — use elevenlabs or macos-say")
    }
  }
}