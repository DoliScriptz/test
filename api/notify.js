import crypto from 'crypto'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { token, players, link, found } = req.body || {}
  if (!token || !Array.isArray(found)) return res.status(400).end()
  const parts = token.split(':')
  if (parts.length !== 4) return res.status(400).end()
  const [userid, username, exp, sig] = parts
  const payload = `${userid}:${username}:${exp}`
  const check = crypto.createHmac('sha256', process.env.HWID_SECRET).update(payload).digest('hex')
  if (sig !== check) return res.status(403).end()
  if (Date.now() > parseInt(exp)) return res.status(403).end()
  const mainWebhook = process.env.WEBHOOK_URL
  const secretWebhook = process.env.SECRET_WEBHOOK_URL
  if (!mainWebhook || !secretWebhook) return res.status(500).end()
  for (const base of found) {
    let desc = `- ${base.owner}'s Base\n`
    for (const b of base.brainrots) {
      desc += `• ${b.displayName} - ${b.rarity}\n`
    }
    const embed = {
      title: `Brainrots Found`,
      description: desc + `\n[Join Here](${link})`,
      color: 0x00FF00,
      fields: [{ name: "Players Inside", value: `${players}`, inline: true }],
      timestamp: new Date().toISOString(),
      footer: {
        text: "Makal Hub • Brainrot Notifier",
        icon_url: "https://media.discordapp.net/attachments/1279117246836375593/1384781511697633310/download.webp"
      }
    }
    await fetch(mainWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    })
    if (base.brainrots.some(b => b.rarity === 'Secret')) {
      await fetch(secretWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      })
    }
  }
  return res.status(200).end()
}
