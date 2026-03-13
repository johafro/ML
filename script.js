const rowState = {};

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

function ensureRowState(rowNum) {
  if (!rowState[rowNum]) {
    rowState[rowNum] = {
      startExp: null,
      endExp: null
    };
  }
}

function updateRow(rowNum) {
  ensureRowState(rowNum);

  const gainedCell = document.getElementById(`gained${rowNum}`);
  const feeCell = document.getElementById(`fee${rowNum}`);
  const rateInput = document.getElementById(`rate${rowNum}`);

  if (!gainedCell || !feeCell || !rateInput) {
    console.error(`Missing gained/fee/rate element(s) for row ${rowNum}`);
    return;
  }

  const startExp = rowState[rowNum].startExp;
  const endExp = rowState[rowNum].endExp;
  const rate = Number(rateInput.value || 0);

  if (startExp !== null && endExp !== null) {
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
  const levelEl = document.getElementById(`startLevel${rowNum}`);
  const expEl = document.getElementById(`startExp${rowNum}`);
  const percentEl = document.getElementById(`startPercent${rowNum}`);

  if (!ignInput || !levelEl || !expEl || !percentEl) {
    console.error(`Missing start-side element(s) for row ${rowNum}`);
    return;
  }

  const ign = ignInput.value.trim();

  if (!ign) {
    expEl.textContent = "Enter IGN first";
    return;
  }

  expEl.textContent = "Loading...";

  try {
    const result = await fetchExactExp(ign);

    levelEl.textContent = result.level;
    expEl.textContent = result.exactExp.toLocaleString();
    percentEl.textContent = `${result.percent}%`;

    ensureRowState(rowNum);
    rowState[rowNum].startExp = result.exactExp;

    updateRow(rowNum);
  } catch (err) {
    levelEl.textContent = "-";
    expEl.textContent = err.message;
    percentEl.textContent = "-";

    ensureRowState(rowNum);
    rowState[rowNum].startExp = null;

    updateRow(rowNum);
  }
}

async function setEnd(rowNum) {
  const ignInput = document.getElementById(`ign${rowNum}`);
  const levelEl = document.getElementById(`endLevel${rowNum}`);
  const expEl = document.getElementById(`endExp${rowNum}`);
  const percentEl = document.getElementById(`endPercent${rowNum}`);

  if (!ignInput || !levelEl || !expEl || !percentEl) {
    console.error(`Missing end-side element(s) for row ${rowNum}`);
    return;
  }

  const ign = ignInput.value.trim();

  if (!ign) {
    expEl.textContent = "Enter IGN first";
    return;
  }

  expEl.textContent = "Loading...";

  try {
    const result = await fetchExactExp(ign);

    levelEl.textContent = result.level;
    expEl.textContent = result.exactExp.toLocaleString();
    percentEl.textContent = `${result.percent}%`;

    ensureRowState(rowNum);
    rowState[rowNum].endExp = result.exactExp;

    updateRow(rowNum);
  } catch (err) {
    levelEl.textContent = "-";
    expEl.textContent = err.message;
    percentEl.textContent = "-";

    ensureRowState(rowNum);
    rowState[rowNum].endExp = null;

    updateRow(rowNum);
  }
}

for (let i = 1; i <= 10; i++) {
  const rateInput = document.getElementById(`rate${i}`);
  if (rateInput) {
    rateInput.addEventListener("input", () => updateRow(i));
  }
}
