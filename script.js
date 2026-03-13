async function fetchCharacters() {
  const resultBox = document.getElementById("result");
  resultBox.innerHTML = "Loading...";

  const names = [];

  for (let i = 1; i <= 10; i++) {
    const value = document.getElementById("ign" + i).value.trim();
    if (value) names.push(value);
  }

  if (names.length === 0) {
    resultBox.innerHTML = "No characters entered.";
    return;
  }

  const requests = names.map(async (name) => {
    try {
      const response = await fetch(`/api/character?name=${encodeURIComponent(name)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Character not found");
      }

      const level = Number(data.level);
      const percent = parseFloat(String(data.exp).replace("%", "").trim());
      const row = expTable[level];

      if (!row) {
        throw new Error(`EXP table is missing level ${level}`);
      }

      const exactExp = Math.floor(row.acc + row.next * (percent / 100));
      const remaining = Math.ceil(row.next * (1 - percent / 100));

      return `
        <div class="card">
          <div><b>${data.name}</b></div>
          <div>Level: ${level}</div>
          <div>EXP: ${data.exp}</div>
          <div>Exact EXP: ${exactExp.toLocaleString()}</div>
          <div>EXP Remaining: ${remaining.toLocaleString()}</div>
        </div>
      `;
    } catch (err) {
      return `
        <div class="card">
          <div><b>${name}</b></div>
          <div class="error">Error: ${err.message}</div>
        </div>
      `;
    }
  });

  const results = await Promise.all(requests);
  resultBox.innerHTML = results.join("");
}
