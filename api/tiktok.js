// pages/api/tiktok.js
export default async function handler(req, res) {
  const { username = "mdlawellness", count = 9 } = req.query;
  const profileUrl = `https://www.tiktok.com/@${username}?lang=en`;

  // 1) fetch profile HTML
  const htmlRes = await fetch(profileUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
  });
  const html = await htmlRes.text();

  let state = null;

  // 2) Attempt #1: <script id="SIGI_STATE">…</script>
  const sigiTag = html.match(
    /<script[^>]*id=["']SIGI_STATE["'][^>]*>([\s\S]*?)<\/script>/
  );
  if (sigiTag) {
    try { state = JSON.parse(sigiTag[1]); }
    catch (e) { /* parse fail? ignore */ }
  }

  // 3) Attempt #2: window['SIGI_STATE'] = {…};
  if (!state) {
    const winMatch = html.match(
      /window\['SIGI_STATE'\]\s*=\s*({[\s\S]*?});/
    );
    if (winMatch) {
      try { state = JSON.parse(winMatch[1]); }
      catch (e) { /* ignore */ }
    }
  }

  // 4) Attempt #3: Next.js data blob
  if (!state) {
    const nextData = html.match(
      /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/
    );
    if (nextData) {
      try {
        const nd = JSON.parse(nextData[1]);
        // user info lives under nd.props.pageProps.user; adjust if you find it elsewhere
        state = nd?.props?.pageProps?.user ? {
          UserModule: { users: { [username]: nd.props.pageProps.user } }
        } : null;
      } catch (e) {}
    }
  }

  if (!state) {
    return res
      .status(500)
      .send("Profile JSON not found (tried SIGI_STATE & Next blob)");
  }

  // 5) grab your user object
  const user = state.UserModule?.users?.[username];
  if (!user) {
    return res
      .status(500)
      .send("User data missing in pulled JSON");
  }

  // 6) call TikTok’s own feed API
  const apiUrl =
    `https://www.tiktok.com/api/post/item_list/` +
    `?count=${count}` +
    `&secUid=${encodeURIComponent(user.secUid)}` +
    `&id=${encodeURIComponent(user.id)}` +
    `&type=1&cursor=0&aid=1988`;

  const feedRes = await fetch(apiUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
  });
  const feedJson = await feedRes.json();
  const ids = (feedJson.itemList || []).map(item => item.id);

  // 7) return JSON + CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json(ids);
}
