let completedCounter = 0;
let activeRowCount = 0;
let nextRowId = 1;
const MAX_ACTIVE_ROWS = 10;
let lastUndoSnapshot = null;

function saveUndoSnapshot() {
  const activeBody = document.getElementById("active-body");
  const completedBody = document.getElementById("completed-body");

  if (!activeBody || !completedBody) return;

  lastUndoSnapshot = {
    activeHTML: activeBody.innerHTML,
    completedHTML: completedBody.innerHTML,
    activeRowCount,
    nextRowId,
    completedCounter
  };
}

function captureUndoState() {
  saveUndoSnapshot();
}

function undoLastAction() {
  if (!lastUndoSnapshot) {
    alert("Nothing to undo.");
    return;
  }

  const activeBody = document.getElementById("active-body");
  const completedBody = document.getElementById("completed-body");

  if (!activeBody || !completedBody) return;

  activeBody.innerHTML = lastUndoSnapshot.activeHTML;
  completedBody.innerHTML = lastUndoSnapshot.completedHTML;
  activeRowCount = lastUndoSnapshot.activeRowCount;
  nextRowId = lastUndoSnapshot.nextRowId;
  completedCounter = lastUndoSnapshot.completedCounter;

  reattachAllListeners();
  refreshAllRows();
  updateActiveEarnings();
  saveData();

  lastUndoSnapshot = null;
}

function saveData() {
  const activeBody = document.getElementById("active-body");
  const completedBody = document.getElementById("completed-body");

  if (!activeBody || !completedBody) return;

  localStorage.setItem("activeSessions", activeBody.innerHTML);
  localStorage.setItem("completedSessions", completedBody.innerHTML);
  localStorage.setItem("activeRowCount", String(activeRowCount));
  localStorage.setItem("nextRowId", String(nextRowId));
  localStorage.setItem("completedCounter", String(completedCounter));
}

function restoreData() {
  const activeBody = document.getElementById("active-body");
  const completedBody = document.getElementById("completed-body");

  if (!activeBody || !completedBody) return;

  const activeSaved = localStorage.getItem("activeSessions");
  const completedSaved = localStorage.getItem("completedSessions");

  if (activeSaved) {
    activeBody.innerHTML = activeSaved;
  }

  if (completedSaved) {
    completedBody.innerHTML = completedSaved;
  }

  activeRowCount = Number(localStorage.getItem("activeRowCount") || 0);
  nextRowId = Number(localStorage.getItem("nextRowId") || 1);
  completedCounter = Number(localStorage.getItem("completedCounter") || 0);
}

function getCurrentTimestamp() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function parseTimestamp(value) {
  if (!value) return null;
  const normalized = String(value).trim().replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "-";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function setTimestampNow(timeInputId) {
  const timeInput = document.getElementById(timeInputId);
  if (!timeInput) return;

  captureUndoState();
  timeInput.value = getCurrentTimestamp();

  const rowKey = timeInputId.replace(/^startTime|^endTime/, "");
  updateRow(rowKey);
}

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

  if (typeof data.level === "undefined" || typeof data.exp === "undefined") {
    throw new Error("Character data is missing level or EXP.");
  }

  const level = Number(data.level);
  const percent = parseFloat(String(data.exp).replace("%", "").trim());

  if (!Number.isFinite(level)) {
    throw new Error(`Invalid level returned: ${JSON.stringify(data.level)}`);
  }

  if (!Number.isFinite(percent)) {
    throw new Error(`Invalid EXP % returned: ${JSON.stringify(data.exp)}`);
  }

  const row = window.expTable?.[level];

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
  const row = window.expTable?.[level];
  if (!row) return "";

  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  return Math.floor(row.acc + row.next * (safePercent / 100));
}

function clampRate(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  return Math.max(0.1, Math.min(4, num));
}

function getAutoRateFromLevel(level) {
  const lvl = Number(level);

  if (lvl >= 10 && lvl <= 19) return 0.009;
  if (lvl >= 20 && lvl <= 29) return 0.035;
  if (lvl >= 30 && lvl <= 35) return 0.05;
  if (lvl >= 36 && lvl <= 39) return 0.06;
  if (lvl >= 40 && lvl <= 42) return 0.07;
  if (lvl >= 43 && lvl <= 49) return 0.1;
  if (lvl >= 50 && lvl <= 52) return 0.15;
  if (lvl >= 53 && lvl <= 54) return 0.16;
  if (lvl >= 55 && lvl <= 57) return 0.17;
  if (lvl >= 58 && lvl <= 64) return 0.18;
  if (lvl >= 65 && lvl <= 70) return 0.42;
  if (lvl >= 71 && lvl <= 74) return 0.5;
  if (lvl >= 75 && lvl <= 81) return 1.1;
  if (lvl >= 82 && lvl <= 89) return 2;
  if (lvl >= 90 && lvl <= 99) return 2.2;
  if (lvl >= 100 && lvl <= 104) return 2.5;
  if (lvl >= 105) return 3.3;

  return null;
}

function applyAutoRate(rowKey) {
  const levelInput = document.getElementById(`startLevel${rowKey}`);
  const rateInput = document.getElementById(`rate${rowKey}`);
  const rateSlider = document.getElementById(`rateSlider${rowKey}`);

  if (!levelInput || !rateInput || !rateSlider) return;

  const autoRate = getAutoRateFromLevel(levelInput.value);
  if (autoRate === null) return;

  rateInput.value = autoRate;
  rateSlider.value = autoRate;
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

function updateActiveEarnings() {
  const activeBody = document.getElementById("active-body");
  const earningsEl = document.getElementById("active-earnings");

  if (!activeBody || !earningsEl) return;

  let total = 0;

  const feeDivs = activeBody.querySelectorAll("[id^='fee']");
  feeDivs.forEach((el) => {
    const raw = (el.innerText || "").replace(/,/g, "").trim();
    const value = Number(raw);
    if (!Number.isNaN(value) && raw !== "" && raw !== "-") {
      total += value;
    }
  });

  earningsEl.textContent = total.toLocaleString();
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
    feeId,
    inputId.replace("rate", "startTime"),
    inputId.replace("rate", "endTime")
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
      feeId,
      inputId.replace("rate", "startTime"),
      inputId.replace("rate", "endTime")
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
    feeId,
    inputId.replace("rate", "startTime"),
    inputId.replace("rate", "endTime")
  );
}

function updateRowByIds(startExpId, endExpId, rateId, gainedId, feeId, startTimeId, endTimeId) {
  const startExpInput = document.getElementById(startExpId);
  const endExpInput = document.getElementById(endExpId);
  const rateInput = document.getElementById(rateId);
  const gainedCell = document.getElementById(gainedId);
  const feeCell = document.getElementById(feeId);
  const startTimeInput = document.getElementById(startTimeId);
  const endTimeInput = document.getElementById(endTimeId);

  if (!startExpInput || !endExpInput || !rateInput || !gainedCell || !feeCell) {
    return;
  }

  const startExp = Number(startExpInput.value || 0);
  const endExp = Number(endExpInput.value || 0);
  const rate = Number(rateInput.value || 0);

  const startDate = startTimeInput ? parseTimestamp(startTimeInput.value) : null;
  const endDate = endTimeInput ? parseTimestamp(endTimeInput.value) : null;

  let timeElapsedText = "-";
  if (startDate && endDate) {
    timeElapsedText = formatDuration(endDate.getTime() - startDate.getTime());
  }

  let expGainedText = "-";
  let expPerHourText = "-";
  let gained = null;

  if (startExp > 0 && endExp > 0) {
    gained = endExp - startExp;

    if (gained >= 0) {
      expGainedText = gained.toLocaleString();

      if (startDate && endDate) {
        const durationMs = endDate.getTime() - startDate.getTime();

        if (durationMs > 0) {
          const expPerHour = gained * (3600000 / durationMs);
          expPerHourText = `${Math.round(expPerHour).toLocaleString()}/hr`;
        }
      }
    } else {
      expGainedText = "-";
      expPerHourText = "-";
    }
  }

  gainedCell.innerHTML = `
    <div>Time: ${timeElapsedText}</div>
    <div>EXP: ${expGainedText}</div>
    <div>EXP/Hr: ${expPerHourText}</div>
  `;

  if (gained !== null && gained >= 0 && rate > 0) {
    const fee = gained / rate;
    feeCell.textContent = Math.ceil(fee).toLocaleString();
  } else {
    feeCell.textContent = "-";
  }

  updateActiveEarnings();
  saveData();
}

function updateRow(rowKey) {
  updateRowByIds(
    `startExp${rowKey}`,
    `endExp${rowKey}`,
    `rate${rowKey}`,
    `gained${rowKey}`,
    `fee${rowKey}`,
    `startTime${rowKey}`,
    `endTime${rowKey}`
  );
}

function refreshAllRows() {
  const activeRows = document.querySelectorAll("#active-body tr[id^='row']");
  activeRows.forEach((row) => {
    const key = row.id.replace("row", "");
    updateRow(key);
  });

  const completedRows = document.querySelectorAll("#completed-body tr");
  completedRows.forEach((row) => {
    const ignInput = row.querySelector("input[id^='ign']");
    if (!ignInput) return;
    const key = ignInput.id.replace("ign", "");
    updateRowByIds(
      `startExp${key}`,
      `endExp${key}`,
      `rate${key}`,
      `gained${key}`,
      `fee${key}`,
      `startTime${key}`,
      `endTime${key}`
    );
  });
}

function attachRowListeners(rowKey) {
  const ignId = `ign${rowKey}`;

  const startTimeId = `startTime${rowKey}`;
  const startLevelId = `startLevel${rowKey}`;
  const startPercentId = `startPercent${rowKey}`;
  const startExpId = `startExp${rowKey}`;

  const endTimeId = `endTime${rowKey}`;
  const endLevelId = `endLevel${rowKey}`;
  const endPercentId = `endPercent${rowKey}`;
  const endExpId = `endExp${rowKey}`;

  const rateId = `rate${rowKey}`;
  const rateSliderId = `rateSlider${rowKey}`;
  const gainedId = `gained${rowKey}`;
  const feeId = `fee${rowKey}`;

  document.getElementById(ignId)?.addEventListener("input", () => {
    saveData();
  });

  document.getElementById(startTimeId)?.addEventListener("input", () => {
    updateRowByIds(startExpId, endExpId, rateId, gainedId, feeId, startTimeId, endTimeId);
  });

  document.getElementById(startLevelId)?.addEventListener("input", () => {
    maybeUpdateExactExpByIds(startLevelId, startPercentId, startExpId);
    applyAutoRate(rowKey);
    updateRowByIds(startExpId, endExpId, rateId, gainedId, feeId, startTimeId, endTimeId);
  });

  document.getElementById(startPercentId)?.addEventListener("input", () => {
    maybeUpdateExactExpByIds(startLevelId, startPercentId, startExpId);
    updateRowByIds(startExpId, endExpId, rateId, gainedId, feeId, startTimeId, endTimeId);
  });

  document.getElementById(startExpId)?.addEventListener("input", () => {
    updateRowByIds(startExpId, endExpId, rateId, gainedId, feeId, startTimeId, endTimeId);
  });

  document.getElementById(endTimeId)?.addEventListener("input", () => {
    updateRowByIds(startExpId, endExpId, rateId, gainedId, feeId, startTimeId, endTimeId);
  });

  document.getElementById(endLevelId)?.addEventListener("input", () => {
    maybeUpdateExactExpByIds(endLevelId, endPercentId, endExpId);
    updateRowByIds(startExpId, endExpId, rateId, gainedId, feeId, startTimeId, endTimeId);
  });

  document.getElementById(endPercentId)?.addEventListener("input", () => {
    maybeUpdateExactExpByIds(endLevelId, endPercentId, endExpId);
    updateRowByIds(startExpId, endExpId, rateId, gainedId, feeId, startTimeId, endTimeId);
  });

  document.getElementById(endExpId)?.addEventListener("input", () => {
    updateRowByIds(startExpId, endExpId, rateId, gainedId, feeId, startTimeId, endTimeId);
  });

  document.getElementById(rateId)?.addEventListener("input", () => {
    syncRateFromInputById(rateSliderId, rateId, gainedId, feeId);
  });

  document.getElementById(rateSliderId)?.addEventListener("input", () => {
    syncRateFromSliderById(rateSliderId, rateId, gainedId, feeId);
  });
}

function reattachAllListeners() {
  const activeRows = document.querySelectorAll("#active-body tr[id^='row']");
  activeRows.forEach((row) => {
    const key = row.id.replace("row", "");
    attachRowListeners(key);
  });

  const completedRows = document.querySelectorAll("#completed-body tr");
  completedRows.forEach((row) => {
    const ignInput = row.querySelector("input[id^='ign']");
    if (ignInput) {
      const key = ignInput.id.replace("ign", "");
      attachRowListeners(key);
    }

    const feeBtn = row.querySelector("button[onclick*='copyCompletedFee']");
    const feeDiv = row.querySelector("div[id^='fee']");
    if (feeBtn && feeDiv) {
      feeBtn.onclick = () => copyCompletedFee(feeDiv.id);
    }

    const paymentBtn = row.querySelector("button[id^='paymentBtn']");
    if (paymentBtn) {
      const completedKey = paymentBtn.id.replace("paymentBtn", "");
      paymentBtn.onclick = () => markPaymentReceived(completedKey);
    }

    const notPaidBtn = row.querySelector("button[id^='notPaidBtn']");
    if (notPaidBtn) {
      const completedKey = notPaidBtn.id.replace("notPaidBtn", "");
      notPaidBtn.onclick = () => markPaymentPending(completedKey);
    }
  });
}

function buildTimeRowHtml(labelText, inputId) {
  return `
    <div class="exp-row">
      <label>${labelText}</label>
      <div class="time-input-wrap">
        <input id="${inputId}" type="text" placeholder="YYYY-MM-DD HH:MM:SS">
        <button type="button" class="now-btn" onclick="setTimestampNow('${inputId}')">Now</button>
      </div>
    </div>
  `;
}

function buildTimeRowHtmlWithValue(labelText, inputId, value) {
  return `
    <div class="exp-row">
      <label>${labelText}</label>
      <div class="time-input-wrap">
        <input id="${inputId}" type="text" value="${value}">
        <button type="button" class="now-btn" onclick="setTimestampNow('${inputId}')">Now</button>
      </div>
    </div>
  `;
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
            <button onclick="completeRow('${rowKey}')">Leech Completed</button>
            <button class="remove-btn" onclick="removeRow('${rowKey}')">− Remove</button>
          </div>
        </div>
      </td>

      <td>
        <div class="exp-box">
          ${buildTimeRowHtml("Time", `startTime${rowKey}`)}
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
          ${buildTimeRowHtml("Time", `endTime${rowKey}`)}
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

      <td id="gained${rowKey}">
        <div>Time: -</div>
        <div>EXP: -</div>
        <div>EXP/Hr: -</div>
      </td>

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

  captureUndoState();

  const activeBody = document.getElementById("active-body");
  if (!activeBody) return;

  const rowKey = nextRowId++;
  activeBody.insertAdjacentHTML("beforeend", buildActiveRowHtml(rowKey));
  attachRowListeners(rowKey);
  activeRowCount += 1;
  updateActiveEarnings();
  saveData();
}

function removeRow(rowKey) {
  const row = document.getElementById(`row${rowKey}`);
  if (!row) return;

  if (activeRowCount <= 1) {
    alert("At least one active row must remain.");
    return;
  }

  captureUndoState();

  row.remove();
  activeRowCount -= 1;
  updateActiveEarnings();
  saveData();
}

async function setStart(rowKey, options = {}) {
  const { skipUndo = false } = options;

  const ignInput = document.getElementById(`ign${rowKey}`);
  const timeInput = document.getElementById(`startTime${rowKey}`);
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

  if (!skipUndo) {
    captureUndoState();
  }

  try {
    const result = await fetchExactExp(ign);
    if (timeInput) timeInput.value = getCurrentTimestamp();
    levelInput.value = result.level;
    percentInput.value = result.percent;
    expInput.value = result.exactExp;

    applyAutoRate(rowKey);
    updateRow(rowKey);
  } catch (err) {
    alert(err.message);
  }
}

async function setEnd(rowKey, options = {}) {
  const { skipUndo = false } = options;

  const ignInput = document.getElementById(`ign${rowKey}`);
  const timeInput = document.getElementById(`endTime${rowKey}`);
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

  if (!skipUndo) {
    captureUndoState();
  }

  try {
    const result = await fetchExactExp(ign);
    if (timeInput) timeInput.value = getCurrentTimestamp();
    levelInput.value = result.level;
    percentInput.value = result.percent;
    expInput.value = result.exactExp;

    updateRow(rowKey);
  } catch (err) {
    alert(err.message);
  }
}

async function fetchStartAll() {
  captureUndoState();

  const rows = document.querySelectorAll("#active-body tr[id^='row']");
  for (const row of rows) {
    const rowKey = row.id.replace("row", "");
    const ign = document.getElementById(`ign${rowKey}`)?.value.trim();
    if (ign) {
      await setStart(rowKey, { skipUndo: true });
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }
}

async function fetchEndAll() {
  captureUndoState();

  const rows = document.querySelectorAll("#active-body tr[id^='row']");
  for (const row of rows) {
    const rowKey = row.id.replace("row", "");
    const ign = document.getElementById(`ign${rowKey}`)?.value.trim();
    if (ign) {
      await setEnd(rowKey, { skipUndo: true });
      await new Promise((resolve) => setTimeout(resolve, 800));
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

function markPaymentReceived(completedKey) {
  const statusText = document.getElementById(`statusText${completedKey}`);
  const paymentBtn = document.getElementById(`paymentBtn${completedKey}`);
  const notPaidBtn = document.getElementById(`notPaidBtn${completedKey}`);

  if (!statusText) return;
  if (statusText.textContent === "Payment Received") return;

  captureUndoState();

  statusText.textContent = "Payment Received";
  statusText.classList.remove("status-pending");
  statusText.classList.add("status-paid");

  if (paymentBtn) {
    paymentBtn.disabled = true;
    paymentBtn.textContent = "Paid";
  }

  if (notPaidBtn) {
    notPaidBtn.disabled = false;
  }

  saveData();
}

function markPaymentPending(completedKey) {
  const statusText = document.getElementById(`statusText${completedKey}`);
  const paymentBtn = document.getElementById(`paymentBtn${completedKey}`);
  const notPaidBtn = document.getElementById(`notPaidBtn${completedKey}`);

  if (!statusText) return;
  if (statusText.textContent === "Pending Payment") return;

  captureUndoState();

  statusText.textContent = "Pending Payment";
  statusText.classList.remove("status-paid");
  statusText.classList.add("status-pending");

  if (paymentBtn) {
    paymentBtn.disabled = false;
    paymentBtn.textContent = "Payment Received";
  }

  if (notPaidBtn) {
    notPaidBtn.disabled = true;
  }

  saveData();
}

function completeRow(rowKey) {
  const completedBody = document.getElementById("completed-body");
  if (!completedBody) return;

  captureUndoState();

  completedCounter += 1;
  const key = `c${completedCounter}`;

  const ign = document.getElementById(`ign${rowKey}`)?.value || "";
  const startTime = document.getElementById(`startTime${rowKey}`)?.value || "";
  const startLevel = document.getElementById(`startLevel${rowKey}`)?.value || "";
  const startPercent = document.getElementById(`startPercent${rowKey}`)?.value || "";
  const startExp = document.getElementById(`startExp${rowKey}`)?.value || "";
  const endTime = document.getElementById(`endTime${rowKey}`)?.value || "";
  const endLevel = document.getElementById(`endLevel${rowKey}`)?.value || "";
  const endPercent = document.getElementById(`endPercent${rowKey}`)?.value || "";
  const endExp = document.getElementById(`endExp${rowKey}`)?.value || "";
  const rate = document.getElementById(`rate${rowKey}`)?.value || "0.1";
  const feeText = document.getElementById(`fee${rowKey}`)?.innerText || "-";

  const gainedHtml = document.getElementById(`gained${rowKey}`)?.innerHTML || `
    <div>Time: -</div>
    <div>EXP: -</div>
    <div>EXP/Hr: -</div>
  `;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>
      <div class="character-box">
        <input id="ign${key}" value="${ign}">
      </div>
    </td>

    <td>
      <div class="exp-box">
        ${buildTimeRowHtmlWithValue("Time", `startTime${key}`, startTime)}
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
        ${buildTimeRowHtmlWithValue("Time", `endTime${key}`, endTime)}
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

    <td id="gained${key}">${gainedHtml}</td>

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

    <td>
      <div class="fee-box">
        <div id="statusText${key}" class="status-pending">Pending Payment</div>
        <button
          id="paymentBtn${key}"
          onclick="markPaymentReceived('${key}')"
          class="copy-btn"
        >
          Payment Received
        </button>
        <button
          id="notPaidBtn${key}"
          onclick="markPaymentPending('${key}')"
          class="copy-btn"
          disabled
        >
          Not Paid
        </button>
      </div>
    </td>
  `;

  completedBody.appendChild(tr);
  attachRowListeners(key);
  updateRowByIds(
    `startExp${key}`,
    `endExp${key}`,
    `rate${key}`,
    `gained${key}`,
    `fee${key}`,
    `startTime${key}`,
    `endTime${key}`
  );

  removeCompletedFromActive(rowKey);
  saveData();
}

function removeCompletedFromActive(rowKey) {
  const row = document.getElementById(`row${rowKey}`);
  if (!row) return;

  row.remove();
  activeRowCount -= 1;

  if (activeRowCount === 0) {
    const activeBody = document.getElementById("active-body");
    if (!activeBody) return;

    const newRowKey = nextRowId++;
    activeBody.insertAdjacentHTML("beforeend", buildActiveRowHtml(newRowKey));
    attachRowListeners(newRowKey);
    activeRowCount += 1;
  }

  updateActiveEarnings();
  saveData();
}

function clearAllSessions() {
  localStorage.removeItem("activeSessions");
  localStorage.removeItem("completedSessions");
  localStorage.removeItem("activeRowCount");
  localStorage.removeItem("nextRowId");
  localStorage.removeItem("completedCounter");
  location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
  restoreData();

  const activeHeader = document.querySelectorAll(".exp-table thead tr")[0];
  const completedHeader = document.querySelectorAll(".exp-table thead tr")[1];

  if (activeHeader?.children[3]) {
    activeHeader.children[3].textContent = "Time Elapsed / EXP Gained";
  }

  if (completedHeader?.children[3]) {
    completedHeader.children[3].textContent = "Time Elapsed / EXP Gained";
  }

  const hasActiveRows = document.querySelectorAll("#active-body tr[id^='row']").length > 0;

  if (!hasActiveRows) {
    const activeBody = document.getElementById("active-body");
    if (activeBody) {
      const rowKey = nextRowId++;
      activeBody.insertAdjacentHTML("beforeend", buildActiveRowHtml(rowKey));
      attachRowListeners(rowKey);
      activeRowCount = 1;
      saveData();
    }
  } else {
    reattachAllListeners();
    refreshAllRows();
    updateActiveEarnings();
  }
});
