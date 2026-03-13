async function fetchExactExp(name) {
  const response = await fetch(`/api/character?name=${encodeURIComponent(name)}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Character not found");
  }

  const level = Number(data.level);
  const percent = parseFloat(String(data.exp).replace("%", "").trim());
  const row = expTable[level];

  if (!row) {
    throw new Error(`EXP table missing level ${level}`);
  }

  const exactExp = Math.floor(row.acc + row.next * (percent / 100));

  return {
    level,
    percent,
    exactExp
  };
}

function updateRow(rowNum) {
  const startExpInput = document.getElementById(`startExp${rowNum}`);
  const endExpInput = document.getElementById(`endExp${rowNum}`);
  const rateInput = document.getElementById(`rate${rowNum}`);
  const gainedCell = document.getElementById(`gained${rowNum}`);
  const feeCell = document.getElementById(`fee${rowNum}`);

  if (!startExpInput || !endExpInput || !rateInput || !gainedCell || !feeCell) {
    return;
  }

  const startExp = Number(startExpInput.value || 0);
  const endExp = Number(endExpInput.value || 0);
  const rate = Number(rateInput.value || 0);

  if (startExp > 0 && endExp > 0) {
    const gained = endExp - startExp;
    gainedCell.textContent = gained.toLocaleString();

    if (rate > 0) {
      const fee = gained / rate;
      feeCell.textContent = Math.ceil(fee).toLocaleString();
    } else {
      feeCell.textContent = "-";
    }
  } else {
    gainedCell.textContent = "-";
    feeCell.textContent = "-";
  }
}

async function setStart(rowNum) {
  const ignInput = document.getElementById(`ign${rowNum}`);
  const levelInput = document.getElementById(`startLevel${rowNum}`);
  const expInput = document.getElementById(`startExp${rowNum}`);
  const percentInput = document.getElementById(`startPercent${rowNum}`);

  if (!ignInput || !levelInput || !expInput || !percentInput) {
    alert(`Missing start fields for row ${rowNum}`);
    return;
  }

  const ign = ignInput.value.trim();

  if (!ign) {
    alert("Enter IGN first");
    return;
  }

  expInput.value = "";
  percentInput.value = "";
  levelInput.value = "";

  try {
    const result = await fetchExactExp(ign);

    levelInput.value = result.level;
    expInput.value = result.exactExp;
    percentInput.value = result.percent;

    updateRow(rowNum);
  } catch (err) {
    alert(err.message);
  }
}

async function setEnd(rowNum) {
  const ignInput = document.getElementById(`ign${rowNum}`);
  const levelInput = document.getElementById(`endLevel${rowNum}`);
  const expInput = document.getElementById(`endExp${rowNum}`);
  const percentInput = document.getElementById(`endPercent${rowNum}`);

  if (!ignInput || !levelInput || !expInput || !percentInput) {
    alert(`Missing end fields for row ${rowNum}`);
    return;
  }

  const ign = ignInput.value.trim();

  if (!ign) {
    alert("Enter IGN first");
    return;
  }

  expInput.value = "";
  percentInput.value = "";
  levelInput.value = "";

  try {
    const result = await fetchExactExp(ign);

    levelInput.value = result.level;
    expInput.value = result.exactExp;
    percentInput.value = result.percent;

    updateRow(rowNum);
  } catch (err) {
    alert(err.message);
  }
}

for (let i = 1; i <= 2; i++) {
  document.getElementById(`startExp${i}`)?.addEventListener("input", () => updateRow(i));
  document.getElementById(`endExp${i}`)?.addEventListener("input", () => updateRow(i));
  document.getElementById(`rate${i}`)?.addEventListener("input", () => updateRow(i));
}
