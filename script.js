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

  const startCell = document.getElementById(`start${rowNum}`);
  const endCell = document.getElementById(`end${rowNum}`);

  const gainedCell = document.getElementById(`gained${rowNum}`);
  const feeCell = document.getElementById(`fee${rowNum}`);

  const rateInput = document.getElementById(`rate${rowNum}`);

  const startExp = Number(startCell.dataset.value || 0);
  const endExp = Number(endCell.dataset.value || 0);
  const rate = Number(rateInput.value || 0);

  if (startExp && endExp) {

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

  const ign = document.getElementById(`ign${rowNum}`).value.trim();

  if (!ign) return;

  try {

    const result = await fetchExactExp(ign);

    document.getElementById(`startLevel${rowNum}`).textContent = result.level;

    document.getElementById(`startExp${rowNum}`).textContent =
      result.exactExp.toLocaleString();

    document.getElementById(`startPercent${rowNum}`).textContent =
      result.percent + "%";

    const startCell = document.getElementById(`start${rowNum}`);

    startCell.dataset.value = result.exactExp;

    updateRow(rowNum);

  } catch (err) {

    document.getElementById(`startExp${rowNum}`).textContent = err.message;

  }

}


async function setEnd(rowNum) {

  const ign = document.getElementById(`ign${rowNum}`).value.trim();

  if (!ign) return;

  try {

    const result = await fetchExactExp(ign);

    document.getElementById(`endLevel${rowNum}`).textContent = result.level;

    document.getElementById(`endExp${rowNum}`).textContent =
      result.exactExp.toLocaleString();

    document.getElementById(`endPercent${rowNum}`).textContent =
      result.percent + "%";

    const endCell = document.getElementById(`end${rowNum}`);

    endCell.dataset.value = result.exactExp;

    updateRow(rowNum);

  } catch (err) {

    document.getElementById(`endExp${rowNum}`).textContent = err.message;

  }

}


for (let i = 1; i <= 10; i++) {

  const rateInput = document.getElementById(`rate${i}`);

  if (rateInput) {
    rateInput.addEventListener("input", () => updateRow(i));
  }

}
