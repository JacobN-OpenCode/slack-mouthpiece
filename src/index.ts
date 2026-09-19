import { App } from "@slack/bolt"
import { config, requireSlack, trimTo } from "./config"
import { speak } from "./speak"

type AmbientMessage = {
  channel?: string
  user?: string
  text?: string
  subtype?: string
  bot_id?: string
  ts?: string
}

requireSlack(config.appToken, config.botToken)

const app = new App({
  token: config.botToken,
  appToken: config.appToken,
  socketMode: true,
})

app.event("message", async ({ event, client }) => {
  const msg = event as AmbientMessage
  if (msg.subtype || msg.bot_id) return
  if (typeof msg.channel !== "string" || typeof msg.user !== "string") return
  if (msg.channel !== config.channelId || msg.user !== config.userId) return

  const text = (msg.text ?? "").trim()
  if (!text) return

  if (config.reactEmoji && msg.ts) {
    client.reactions
      .add({ channel: msg.channel, name: config.reactEmoji, timestamp: msg.ts })
      .catch(() => {})
  }

  console.log(`[mouthpiece] ${msg.user} sent ${text.length} chars — speaking`)
  await speak(trimTo(text))
})

app.error(async (error) => {
  console.error(`[mouthpiece] app error: ${error.message}`)
})

await app.start()
console.log(`[mouthpiece] listening — your messages in ${config.channelId} get spoken`)
if (!config.channelId || !config.userId) {
  console.warn("[mouthpiece] set MOUTHPIECE_CHANNEL_ID and MOUTHPIECE_USER_ID in .env to enable")
}