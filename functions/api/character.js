export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const name = url.searchParams.get("name");

  if (!name) {
    return Response.json({ error: "Missing character name." }, { status: 400 });
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
      return Response.json(
        {
          error: "MapleLegends returned an error.",
          details: text
        },
        { status: response.status }
      );
    }

    try {
      const data = JSON.parse(text);
      return Response.json(data, { status: 200 });
    } catch {
      return Response.json(
        {
          error: "Character response was not valid JSON.",
          details: text
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return Response.json(
      {
        error: "Failed to fetch character.",
        details: String(error)
      },
      { status: 500 }
    );
  }
}