// pages/api/tiktok.js
export default async function handler(req, res) {
  const { username = "mdlawellness", count = 9 } = req.query;

  // Call TikWM’s posts API instead of TikTok’s deprecated endpoint
  const apiUrl = `https://www.tikwm.com/api/user/posts?unique_id=${username}&count=${count}`;

  let data;
  try {
    const r = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.tikwm.com",
        "Accept": "application/json"
      }
    });
    data = await r.json();
  } catch (e) {
    return res.status(500).send("Failed to fetch TikWM user posts JSON: " + e.message);
  }

  // Extract video IDs from the response
  const videos = data?.data?.videos || [];
  const ids = videos.map(video => video.video_id).filter(Boolean);

  // Return JSON with CORS enabled
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(200).json({ ids });
}
