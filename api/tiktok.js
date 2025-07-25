// pages/api/tiktok.js
export default async function handler(req, res) {
  const { username = "mdlawellness", count = 9 } = req.query;

  // 1) fetch profile HTML
  const htmlRes = await fetch(`https://www.tiktok.com/@${username}`, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const html = await htmlRes.text();

  // 2) extract the JSON blob from <script id="SIGI_STATE">
  const m = html.match(
    /<script id="SIGI_STATE" type="application\/json">([^<]+)<\/script>/
  );
  if (!m) return res.status(500).send("Profile JSON not found");

  const state = JSON.parse(m[1]);
  const user  = state.UserModule.users[username];
  if (!user) return res.status(500).send("User data missing");

  // 3) call TikTok’s own video-list API
  const apiUrl =
    `https://www.tiktok.com/api/post/item_list/?` +
    `count=${count}&secUid=${user.secUid}&id=${user.id}` +
    `&type=1&cursor=0&aid=1988`;

  const jsonRes = await fetch(apiUrl, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const data = await jsonRes.json();
  const ids  = (data.itemList || []).map(i => i.id);

  // 4) return JSON + CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.json(ids);
}
