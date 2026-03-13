export default async function handler(req, res) {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: "Missing character name" });
  }

  try {
    const response = await fetch(
      `https://maplelegends.com/api/character?name=${encodeURIComponent(name)}`
    );

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch character" });
  }
}