// pages/api/tiktok.js
export default async function handler(req, res) {
  const { username = "mdlawellness", count = 9 } = req.query;

  // 1) call TikTok's share JSON endpoint
  const apiUrl = `https://www.tiktok.com/node/share/user/@${username}` +
                 `?lang=en&count=${count}`;

  let data;
  try {
    const r = await fetch(apiUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    data = await r.json();
  } catch (e) {
    return res
      .status(500)
      .send("Failed to fetch TikTok share JSON: " + e.message);
  }

  // 2) extract the video IDs
  const list = data?.body?.itemList || [];
  const ids = list.map(item => item.id).filter(Boolean);

  // 3) return JSON + CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(200).json(ids);
}
