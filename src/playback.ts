import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

export function run(cmd: string, args: string[]): Promise<{ stdout: string }> {
  return execFileAsync(cmd, args).catch((err: NodeJS.ErrnoException) => {
    if (err.code === "ENOENT") {
      throw new Error(
        cmd === "afplay"
          ? "afplay is built into macOS"
          : `"${cmd}" not found. Install it with: brew install ${cmd}`
      )
    }
    throw new Error(`${cmd} ${args.join(" ")} failed: ${err.message}`)
  })
}

async function currentOutputDevice(): Promise<string | undefined> {
  for (const args of [["-c", "-t", "output"], ["-c"]]) {
    try {
      const { stdout } = await run("SwitchAudioSource", args)
      const name = stdout.trim()
      if (name) return name
    } catch {
      // try next
    }
  }
  return undefined
}

async function setOutputDevice(name: string) {
  await run("SwitchAudioSource", ["-s", name])
}

const settle = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function playFileToBlackHole(file: string, device: string) {
  let previous: string | undefined
  try {
    previous = await currentOutputDevice()
  } catch {
    // fine, we just won't restore
  }

  try {
    await setOutputDevice(device)
    await settle(250)
    await run("afplay", [file])
  } catch (err) {
    throw err
  } finally {
    if (previous) {
      try {
        await setOutputDevice(previous)
        await settle(150)
      } catch {
        // best effort
      }
    }
  }
}