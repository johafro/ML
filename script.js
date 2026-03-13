async function fetchCharacter() {
  const name = document.getElementById("name").value.trim();
  const resultBox = document.getElementById("result");

  if (!name) {
    resultBox.innerHTML = "Please enter a character name.";
    return;
  }

  resultBox.innerHTML = "Loading...";

  try {
    const response = await fetch(`/api/character?name=${encodeURIComponent(name)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.details || data.error || "Could not fetch character data.");
    }

    const level = Number(data.level);
    const percent = parseFloat(String(data.exp).replace("%", ""));
    const table = expTable[level];

    if (!table) {
      resultBox.innerHTML = `Character found, but EXP table is missing level ${level}.`;
      return;
    }

    const exactExp = table.acc + (table.next * (percent / 100));
    const remaining = table.next * (1 - percent / 100);

    resultBox.innerHTML = `
      Name: ${data.name}<br>
      Level: ${level}<br>
      EXP: ${data.exp}<br>
      Exact EXP: ${Math.floor(exactExp).toLocaleString()}<br>
      EXP Remaining: ${Math.ceil(remaining).toLocaleString()}
    `;
  } catch (error) {
    resultBox.innerHTML = `Error: ${error.message}`;
  }
}