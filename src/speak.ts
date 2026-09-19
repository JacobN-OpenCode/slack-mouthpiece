import { mkdtemp, rm } from "node:fs/promises"
import * as os from "node:os"
import { join } from "node:path"
import { config } from "./config"
import { playFileToBlackHole } from "./playback"
import { synth } from "./tts"

let chain: Promise<void> = Promise.resolve()

async function speakNow(text: string) {
  const dir = await mkdtemp(join(os.tmpdir(), "mouthpiece-"))
  try {
    const { file } = await synth(text, dir)
    console.log(`[mouthpiece] playing ${text.length} chars via ${config.ttsProvider}`)
    await playFileToBlackHole(file, config.blackholeDevice)
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

export function speak(text: string): Promise<void> {
  const task = speakNow(text).catch((err: Error) => {
    console.error(`[mouthpiece] speak failed: ${err.message}`)
  })
  chain = chain.then(() => task)
  return chain
}