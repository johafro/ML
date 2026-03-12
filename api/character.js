export default async function handler(req, res) {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: "Missing character name" });
  }

  try {
    const response = await fetch(
      `https://maplelegends.com/api/character?name=${encodeURIComponent(name)}`
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch character" });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Server error while fetching character" });
  }
}