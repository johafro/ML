async function fetchExactExp(name) {
  const response = await fetch(`/api/character?name=${encodeURIComponent(name)}`);
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || "API did not return valid JSON");
  }

  if (!response.ok) {
    throw new Error(data.details || data.error || "Character not found");
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

function calculateExactExpFromLevelPercent(level, percent) {
  const row = expTable[level];
  if (!row) return "";

  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  return Math.floor(row.acc + row.next * (safePercent / 100));
}

function maybeUpdateExactExp(prefix, rowNum) {
  const levelInput = document.getElementById(`${prefix}Level${rowNum}`);
  const percentInput = document.getElementById(`${prefix}Percent${rowNum}`);
  const expInput = document.getElementById(`${prefix}Exp${rowNum}`);

  if (!levelInput || !percentInput || !expInput) return;

  const level = Number(levelInput.value);
  const percent = Number(percentInput.value);

  if (!level || Number.isNaN(percent)) return;

  const exactExp = calculateExactExpFromLevelPercent(level, percent);
  if (exactExp !== "") {
    expInput.value = exactExp;
  }
}

function clampRate(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  return Math.max(0.1, Math.min(4, num));
}

function syncRateFromSlider(rowNum) {
  const slider = document.getElementById(`rateSlider${rowNum}`);
  const input = document.getElementById(`rate${rowNum}`);
  if (!slider || !input) return;

  input.value = slider.value;
  updateRow(rowNum);
}

function syncRateFromInput(rowNum) {
  const slider = document.getElementById(`rateSlider${rowNum}`);
  const input = document.getElementById(`rate${rowNum}`);
  if (!slider || !input) return;

  const clamped = clampRate(input.value);
  if (clamped === "") {
    updateRow(rowNum);
    return;
  }

  input.value = clamped;
  slider.value = clamped;
  updateRow(rowNum);
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

  levelInput.value = "";
  percentInput.value = "";
  expInput.value = "";

  try {
    const result = await fetchExactExp(ign);

    levelInput.value = result.level;
    percentInput.value = result.percent;
    expInput.value = result.exactExp;

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

  levelInput.value = "";
  percentInput.value = "";
  expInput.value = "";

  try {
    const result = await fetchExactExp(ign);

    levelInput.value = result.level;
    percentInput.value = result.percent;
    expInput.value = result.exactExp;

    updateRow(rowNum);
  } catch (err) {
    alert(err.message);
  }
}

function fetchStartAll() {
  for (let i = 1; i <= 2; i++) {
    const ignInput = document.getElementById(`ign${i}`);
    if (!ignInput) continue;

    const ign = ignInput.value.trim();
    if (ign !== "") {
      setStart(i);
    }
  }
}

function fetchEndAll() {
  for (let i = 1; i <= 2; i++) {
    const ignInput = document.getElementById(`ign${i}`);
    if (!ignInput) continue;

    const ign = ignInput.value.trim();
    if (ign !== "") {
      setEnd(i);
    }
  }
}

function copyFee(row) {
  const feeElement = document.getElementById(`fee${row}`);
  if (!feeElement) return;

  const feeText = feeElement.innerText;

  if (!feeText || feeText === "-") {
    alert("No fee to copy yet.");
    return;
  }

  const cleanFee = feeText.replace(/,/g, "");
  navigator.clipboard.writeText(cleanFee);
}

document.addEventListener("DOMContentLoaded", () => {
  for (let i = 1; i <= 2; i++) {
    const startLevel = document.getElementById(`startLevel${i}`);
    const startPercent = document.getElementById(`startPercent${i}`);
    const startExp = document.getElementById(`startExp${i}`);

    const endLevel = document.getElementById(`endLevel${i}`);
    const endPercent = document.getElementById(`endPercent${i}`);
    const endExp = document.getElementById(`endExp${i}`);

    const rate = document.getElementById(`rate${i}`);
    const rateSlider = document.getElementById(`rateSlider${i}`);

    startLevel?.addEventListener("input", () => {
      maybeUpdateExactExp("start", i);
      updateRow(i);
    });

    startPercent?.addEventListener("input", () => {
      maybeUpdateExactExp("start", i);
      updateRow(i);
    });

    startExp?.addEventListener("input", () => updateRow(i));

    endLevel?.addEventListener("input", () => {
      maybeUpdateExactExp("end", i);
      updateRow(i);
    });

    endPercent?.addEventListener("input", () => {
      maybeUpdateExactExp("end", i);
      updateRow(i);
    });

    endExp?.addEventListener("input", () => updateRow(i));

    rate?.addEventListener("input", () => syncRateFromInput(i));
    rateSlider?.addEventListener("input", () => syncRateFromSlider(i));
  }
});
