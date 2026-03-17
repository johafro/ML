let completedCounter = 0;
let activeRowCount = 0;
let nextRowId = 1;
const MAX_ACTIVE_ROWS = 10;

async function fetchExactExp(name) {
  const response = await fetch(`/api/character?name=${encodeURIComponent(name)}`);
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    if (text.includes("503 Service Temporarily Unavailable")) {
      throw new Error("MapleLegends API is temporarily unavailable. Please try again in a few seconds.");
    }
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

  return { level, percent, exactExp };
}

function calculateExactExpFromLevelPercent(level, percent) {
  const row = expTable[level];
  if (!row) return "";

  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  return Math.floor(row.acc + row.next * (safePercent / 100));
}

function clampRate(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  return Math.max(0.1, Math.min(4, num));
}

function maybeUpdateExactExpByIds(levelId, percentId, expId) {
  const levelInput = document.getElementById(levelId);
  const percentInput = document.getElementById(percentId);
  const expInput = document.getElementById(expId);

  if (!levelInput || !percentInput || !expInput) return;

  const level = Number(levelInput.value);
  const percent = Number(percentInput.value);

  if (!level || Number.isNaN(percent)) return;

  const exactExp = calculateExactExpFromLevelPercent(level, percent);
  if (exactExp !== "") {
    expInput.value = exactExp;
  }
}

function updateRowByIds(startExpId, endExpId, rateId, gainedId, feeId) {
  const startExpInput = document.getElementById(startExpId);
  const endExpInput = document.getElementById(endExpId);
  const rateInput = document.getElementById(rateId);
  const gainedCell = document.getElementById(gainedId);
  const feeCell = document.getElementById(feeId);

  if (!startExpInput || !endExpInput || !rateInput || !gainedCell || !feeCell) return;

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

function updateRow(rowKey) {
  updateRowByIds(
    `startExp${rowKey}`,
    `endExp${rowKey}`,
    `rate${rowKey}`,
    `gained${rowKey}`,
    `fee${rowKey}`
  );
}

function syncRateFromSliderById(sliderId, inputId, gainedId, feeId) {
  const slider = document.getElementById(sliderId);
  const input = document.getElementById(inputId);
  if (!slider || !input) return;

  input.value = slider.value;
  updateRowByIds(
    inputId.replace("rate", "startExp"),
    inputId.replace("rate", "endExp"),
    inputId,
    gainedId,
    feeId
  );
}

function syncRateFromInputById(sliderId, inputId, gainedId, feeId) {
  const slider = document.getElementById(sliderId);
  const input = document.getElementById(inputId);
  if (!slider || !input) return;

  const clamped = clampRate(input.value);
  if (clamped === "") {
    updateRowByIds(
      inputId.replace("rate", "startExp"),
      inputId.replace("rate", "endExp"),
      inputId,
      gainedId,
      feeId
    );
    return;
  }

  input.value = clamped;
  slider.value = clamped;

  updateRowByIds(
    inputId.replace("rate", "startExp"),
    inputId.replace("rate", "endExp"),
    inputId,
    gainedId,
    feeId
  );
}

function attachRowListeners(rowKey) {
  const startLevelId = `startLevel${rowKey}`;
  const startPercentId = `startPercent${rowKey}`;
  const startExpId = `startExp${rowKey}`;

  const endLevelId = `endLevel${rowKey}`;
  const endPercentId = `endPercent${rowKey}`;
  const endExpId = `endExp${rowKey}`;

  const rateId = `rate${rowKey}`;
  const rateSliderId = `rateSlider${rowKey}`;
  const gainedId = `gained${rowKey}`;
  const feeId = `fee${rowKey}`;

  document.getElementById(startLevelId)?.addEventListener("input", () => {
    maybeUpdateExactExpByIds(startLevelId, startPercentId, startExpId);
    updateRowByIds(startExpId, endExpId, rateId, gainedId, feeId);
  });

  document.getElementById(startPercentId)?.addEventListener("input", () => {
    maybeUpdateExactExpByIds(startLevelId, startPercentId, startExpId);
    updateRowByIds(startExpId, endExpId, rateId, gainedId, feeId);
  });

  document.getElementById(startExpId)?.addEventListener("input", () => {
    updateRowByIds(startExpId, endExpId, rateId, gainedId, feeId);
  });

  document.getElementById(endLevelId)?.addEventListener("input", () => {
    maybeUpdateExactExpByIds(endLevelId, endPercentId, endExpId);
    updateRowByIds(startExpId, endExpId, rateId, gainedId, feeId);
  });

  document.getElementById(endPercentId)?.addEventListener("input", () => {
    maybeUpdateExactExpByIds(endLevelId, endPercentId, endExpId);
    updateRowByIds(startExpId, endExpId, rateId, gainedId, feeId);
  });

  document.getElementById(endExpId)?.addEventListener("input", () => {
    updateRowByIds(startExpId, endExpId, rateId, gainedId, feeId);
  });

  document.getElementById(rateId)?.addEventListener("input", () => {
    syncRateFromInputById(rateSliderId, rateId, gainedId, feeId);
  });

  document.getElementById(rateSliderId)?.addEventListener("input", () => {
    syncRateFromSliderById(rateSliderId, rateId, gainedId, feeId);
  });
}

function buildActiveRowHtml(rowKey) {
  return `
    <tr id="row${rowKey}">
      <td>
        <div class="character-box">
          <input id="ign${rowKey}" placeholder="Character ${rowKey}">
          <div class="character-actions">
            <button onclick="setStart('${rowKey}')">Fetch Start</button>
            <button onclick="setEnd('${rowKey}')">Fetch End</button>
            <button onclick="completeRow('${rowKey}')">Completed</button>
            <button class="remove-btn" onclick="removeRow('${rowKey}')">− Remove</button>
          </div>
        </div>
      </td>

      <td>
        <div class="exp-box">
          <div class="exp-row">
            <label>Level</label>
            <input id="startLevel${rowKey}" type="number">
          </div>
          <div class="exp-row">
            <label>EXP %</label>
            <input id="startPercent${rowKey}" type="number" step="0.01">
          </div>
          <div class="exp-row">
            <label>EXP</label>
            <input id="startExp${rowKey}" type="number">
          </div>
        </div>
      </td>

      <td>
        <div class="exp-box">
          <div class="exp-row">
            <label>Level</label>
            <input id="endLevel${rowKey}" type="number">
          </div>
          <div class="exp-row">
            <label>EXP %</label>
            <input id="endPercent${rowKey}" type="number" step="0.01">
          </div>
          <div class="exp-row">
            <label>EXP</label>
            <input id="endExp${rowKey}" type="number">
          </div>
        </div>
      </td>

      <td id="gained${rowKey}">-</td>

      <td>
        <div class="rate-box">
          <input
            id="rateSlider${rowKey}"
            type="range"
            min="0.1"
            max="4"
            step="0.1"
            value="0.1"
          >
          <input
            id="rate${rowKey}"
            type="number"
            min="0.1"
            max="4"
            step="0.1"
            value="0.1"
          >
        </div>
      </td>

      <td>
        <div class="fee-box">
          <div id="fee${rowKey}">-</div>
          <button onclick="copyFee('${rowKey}')" class="copy-btn">Copy</button>
        </div>
      </td>
    </tr>
  `;
}

function addRow() {
  if (activeRowCount >= MAX_ACTIVE_ROWS) {
    alert("Maximum 10 active rows.");
    return;
  }

  const activeBody = document.getElementById("active-body");
  if (!activeBody) return;

  const rowKey = nextRowId++;
  activeBody.insertAdjacentHTML("beforeend", buildActiveRowHtml(rowKey));
  attachRowListeners(rowKey);
  activeRowCount += 1;
}

function removeRow(rowKey) {
  const row = document.getElementById(`row${rowKey}`);
  if (!row) return;

  if (activeRowCount <= 1) {
    alert("At least one active row must remain.");
    return;
  }

  row.remove();
  activeRowCount -= 1;
}

async function setStart(rowKey) {
  const ignInput = document.getElementById(`ign${rowKey}`);
  const levelInput = document.getElementById(`startLevel${rowKey}`);
  const expInput = document.getElementById(`startExp${rowKey}`);
  const percentInput = document.getElementById(`startPercent${rowKey}`);

  if (!ignInput || !levelInput || !expInput || !percentInput) {
    alert(`Missing start fields for row ${rowKey}`);
    return;
  }

  const ign = ignInput.value.trim();
  if (!ign) {
    alert("Enter IGN first");
    return;
  }

  try {
    const result = await fetchExactExp(ign);
    levelInput.value = result.level;
    percentInput.value = result.percent;
    expInput.value = result.exactExp;
    updateRow(rowKey);
  } catch (err) {
    alert(err.message);
  }
}

async function setEnd(rowKey) {
  const ignInput = document.getElementById(`ign${rowKey}`);
  const levelInput = document.getElementById(`endLevel${rowKey}`);
  const expInput = document.getElementById(`endExp${rowKey}`);
  const percentInput = document.getElementById(`endPercent${rowKey}`);

  if (!ignInput || !levelInput || !expInput || !percentInput) {
    alert(`Missing end fields for row ${rowKey}`);
    return;
  }

  const ign = ignInput.value.trim();
  if (!ign) {
    alert("Enter IGN first");
    return;
  }

  try {
    const result = await fetchExactExp(ign);
    levelInput.value = result.level;
    percentInput.value = result.percent;
    expInput.value = result.exactExp;
    updateRow(rowKey);
  } catch (err) {
    alert(err.message);
  }
}

async function fetchStartAll() {
  const rows = document.querySelectorAll("#active-body tr[id^='row']");
  for (const row of rows) {
    const rowKey = row.id.replace("row", "");
    const ign = document.getElementById(`ign${rowKey}`)?.value.trim();
    if (ign) {
      await setStart(rowKey);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }
}

async function fetchEndAll() {
  const rows = document.querySelectorAll("#active-body tr[id^='row']");
  for (const row of rows) {
    const rowKey = row.id.replace("row", "");
    const ign = document.getElementById(`ign${rowKey}`)?.value.trim();
    if (ign) {
      await setEnd(rowKey);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }
}

function copyFee(rowKey) {
  const feeElement = document.getElementById(`fee${rowKey}`);
  if (!feeElement) return;

  const feeText = feeElement.innerText;
  if (!feeText || feeText === "-") {
    alert("No fee to copy yet.");
    return;
  }

  navigator.clipboard.writeText(feeText.replace(/,/g, ""));
}

function copyCompletedFee(feeId) {
  const feeElement = document.getElementById(feeId);
  if (!feeElement) return;

  const feeText = feeElement.innerText;
  if (!feeText || feeText === "-") {
    alert("No fee to copy yet.");
    return;
  }

  navigator.clipboard.writeText(feeText.replace(/,/g, ""));
}

function completeRow(rowKey) {
  const completedBody = document.getElementById("completed-body");
  if (!completedBody) return;

  completedCounter += 1;
  const key = `c${completedCounter}`;

  const ign = document.getElementById(`ign${rowKey}`)?.value || "";
  const startLevel = document.getElementById(`startLevel${rowKey}`)?.value || "";
  const startPercent = document.getElementById(`startPercent${rowKey}`)?.value || "";
  const startExp = document.getElementById(`startExp${rowKey}`)?.value || "";
  const endLevel = document.getElementById(`endLevel${rowKey}`)?.value || "";
  const endPercent = document.getElementById(`endPercent${rowKey}`)?.value || "";
  const endExp = document.getElementById(`endExp${rowKey}`)?.value || "";
  const rate = document.getElementById(`rate${rowKey}`)?.value || "0.1";
  const feeText = document.getElementById(`fee${rowKey}`)?.innerText || "-";
  const gainedText = document.getElementById(`gained${rowKey}`)?.innerText || "-";

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>
      <div class="character-box">
        <input id="ign${key}" value="${ign}">
      </div>
    </td>

    <td>
      <div class="exp-box">
        <div class="exp-row">
          <label>Level</label>
          <input id="startLevel${key}" type="number" value="${startLevel}">
        </div>
        <div class="exp-row">
          <label>EXP %</label>
          <input id="startPercent${key}" type="number" step="0.01" value="${startPercent}">
        </div>
        <div class="exp-row">
          <label>EXP</label>
          <input id="startExp${key}" type="number" value="${startExp}">
        </div>
      </div>
    </td>

    <td>
      <div class="exp-box">
        <div class="exp-row">
          <label>Level</label>
          <input id="endLevel${key}" type="number" value="${endLevel}">
        </div>
        <div class="exp-row">
          <label>EXP %</label>
          <input id="endPercent${key}" type="number" step="0.01" value="${endPercent}">
        </div>
        <div class="exp-row">
          <label>EXP</label>
          <input id="endExp${key}" type="number" value="${endExp}">
        </div>
      </div>
    </td>

    <td id="gained${key}">${gainedText}</td>

    <td>
      <div class="rate-box">
        <input
          id="rateSlider${key}"
          type="range"
          min="0.1"
          max="4"
          step="0.1"
          value="${rate}"
        >
        <input
          id="rate${key}"
          type="number"
          min="0.1"
          max="4"
          step="0.1"
          value="${rate}"
        >
      </div>
    </td>

    <td>
      <div class="fee-box">
        <div id="fee${key}">${feeText}</div>
        <button onclick="copyCompletedFee('fee${key}')" class="copy-btn">Copy</button>
      </div>
    </td>
  `;

  completedBody.appendChild(tr);
  attachRowListeners(key);
  updateRowByIds(`startExp${key}`, `endExp${key}`, `rate${key}`, `gained${key}`, `fee${key}`);

  removeCompletedFromActive(rowKey);
}

function removeCompletedFromActive(rowKey) {
  const row = document.getElementById(`row${rowKey}`);
  if (!row) return;
  row.remove();
  activeRowCount -= 1;

  if (activeRowCount === 0) {
    addRow();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  addRow();
});
