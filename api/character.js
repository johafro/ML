export default async function handler(req, res) {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: "Missing character name." });
  }

  try {
    const response = await fetch(
      `https://maplelegends.com/api/character?name=${encodeURIComponent(name)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json,text/plain,*/*"
        }
      }
    );

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "MapleLegends returned an error.",
        details: text
      });
    }

    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch {
      return res.status(500).json({
        error: "Character response was not valid JSON.",
        details: text
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch character.",
      details: String(error)
    });
  }
}