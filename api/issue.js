import crypto from 'crypto';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userid, username } = req.body || {};
  if (!userid || !username) return res.status(400).end();
  const exp = Date.now() + 20000;
  const payload = `${userid}:${username}:${exp}`;
  const sig = crypto.createHmac('sha256', process.env.HWID_SECRET).update(payload).digest('hex');
  return res.status(200).json({ token: `${payload}:${sig}` });
}
