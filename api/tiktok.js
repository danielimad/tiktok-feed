// pages/api/tiktok.js
export default async function handler(req, res) {
  const { username = "mdlawellness", count = 9 } = req.query;

  // 1) fetch the profile HTML (force English so we get the JSON)
  const profile = await fetch(
    `https://www.tiktok.com/@${username}?lang=en`,
    { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } }
  );
  const html = await profile.text();

  // 2) pull out the SIGI_STATE JSON blob (more permissive regex)
  const sigiMatch = html.match(
    /<script[^>]*id=["']SIGI_STATE["'][^>]*>([\s\S]*?)<\/script>/
  );
  if (!sigiMatch) {
    return res
      .status(500)
      .send("Profile JSON not found (SIGI_STATE script tag)");
  }
  let state;
  try {
    state = JSON.parse(sigiMatch[1]);
  } catch (e) {
    return res.status(500).send("Unable to parse SIGI_STATE JSON");
  }

  // 3) extract your user object
  const user = state?.UserModule?.users?.[username];
  if (!user) {
    return res.status(500).send("User data missing in SIGI_STATE");
  }

  // 4) call TikTok’s own API for the latest posts
  const apiUrl =
    `https://www.tiktok.com/api/post/item_list/` +
    `?count=${count}` +
    `&secUid=${encodeURIComponent(user.secUid)}` +
    `&id=${encodeURIComponent(user.id)}` +
    `&type=1&cursor=0&aid=1988`;

  const feedRes = await fetch(apiUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
  });
  const feedJson = await feedRes.json();
  const ids = (feedJson.itemList || []).map((item) => item.id);

  // 5) return just the array of IDs with CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.json(ids);
}
