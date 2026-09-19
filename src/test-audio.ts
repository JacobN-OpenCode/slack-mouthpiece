import { config, trimTo } from "./config"
import { speak } from "./speak"

const text = trimTo(
  process.argv.slice(2).join(" ") ||
    "Hello, this is the mouthpiece, testing one two three."
)

console.log(`[test] provider=${config.ttsProvider} device=${config.blackholeDevice}`)
console.log(`[test] saying: "${text}"`)
await speak(text)
console.log("[test] done. If your Slack mic is set to BlackHole and you were in a huddle, that was heard.")