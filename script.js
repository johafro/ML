let completedCounter = 0;
let activeRowCount = 0;
let nextRowId = 1;
const MAX_ACTIVE_ROWS = 10;
let lastUndoSnapshot = null;

/* ===================== UNDO ===================== */
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

/* ===================== STORAGE ===================== */
function saveData() {
  localStorage.setItem("activeSessions", document.getElementById("active-body").innerHTML);
  localStorage.setItem("completedSessions", document.getElementById("completed-body").innerHTML);
  localStorage.setItem("activeRowCount", activeRowCount);
  localStorage.setItem("nextRowId", nextRowId);
  localStorage.setItem("completedCounter", completedCounter);
}

function restoreData() {
  const active = localStorage.getItem("activeSessions");
  const completed = localStorage.getItem("completedSessions");

  if (active) document.getElementById("active-body").innerHTML = active;
  if (completed) document.getElementById("completed-body").innerHTML = completed;

  activeRowCount = Number(localStorage.getItem("activeRowCount") || 0);
  nextRowId = Number(localStorage.getItem("nextRowId") || 1);
  completedCounter = Number(localStorage.getItem("completedCounter") || 0);
}

/* ===================== TIME ===================== */
function getCurrentTimestamp() {
  const now = new Date();
  return now.toISOString().slice(0, 19).replace("T", " ");
}

function setTimestampNow(id) {
  captureUndoState();
  document.getElementById(id).value = getCurrentTimestamp();
  const rowKey = id.replace("startTime", "").replace("endTime", "");
  updateRow(rowKey);
}

function parseTimestamp(val) {
  if (!val) return null;
  return new Date(val.replace(" ", "T"));
}

function formatDuration(ms) {
  if (!ms || ms < 0) return "-";

  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  return `${h}h ${String(m).padStart(2, "0")}m ${String(sec).padStart(2, "0")}s`;
}

/* ===================== API ===================== */
async function fetchExactExp(name) {
  const res = await fetch(`/api/character?name=${name}`);
  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Invalid API response");
  }

  const level = Number(data.level);
  const percent = parseFloat(data.exp);

  const row = window.expTable[level];
  const exactExp = Math.floor(row.acc + row.next * (percent / 100));

  return { level, percent, exactExp };
}

/* ===================== ROW CALC ===================== */
function updateRow(rowKey) {
  const startExp = Number(document.getElementById(`startExp${rowKey}`).value || 0);
  const endExp = Number(document.getElementById(`endExp${rowKey}`).value || 0);
  const rate = Number(document.getElementById(`rate${rowKey}`).value || 0);

  const startTime = parseTimestamp(document.getElementById(`startTime${rowKey}`).value);
  const endTime = parseTimestamp(document.getElementById(`endTime${rowKey}`).value);

  let timeText = "-";
  if (startTime && endTime) {
    timeText = formatDuration(endTime - startTime);
  }

  let expText = "-";
  let gained = endExp - startExp;

  if (gained > 0) {
    expText = gained.toLocaleString();
  }

  document.getElementById(`gained${rowKey}`).innerHTML =
    `<div>Time: ${timeText}</div><div>EXP: ${expText}</div>`;

  if (gained > 0 && rate > 0) {
    document.getElementById(`fee${rowKey}`).innerText =
      Math.ceil(gained / rate).toLocaleString();
  } else {
    document.getElementById(`fee${rowKey}`).innerText = "-";
  }

  updateActiveEarnings();
  saveData();
}

/* ===================== EARNINGS ===================== */
function updateActiveEarnings() {
  let total = 0;

  document.querySelectorAll("#active-body [id^='fee']").forEach(el => {
    const val = Number(el.innerText.replace(/,/g, ""));
    if (!isNaN(val)) total += val;
  });

  document.getElementById("active-earnings").innerText = total.toLocaleString();

  const icon = document.getElementById("meso-icon");
  if (icon) {
    icon.src = total > 5000000 ? "Maple Sack.png" : "Meso Coin.png";
  }
}

/* ===================== ADD / REMOVE ===================== */
function addRow() {
  if (activeRowCount >= MAX_ACTIVE_ROWS) return alert("Max 10 rows");

  captureUndoState();

  const key = nextRowId++;

  document.getElementById("active-body").insertAdjacentHTML("beforeend", `
<tr id="row${key}">
<td>
<input id="ign${key}" placeholder="Character ${key}">
<button onclick="setStart('${key}')">Fetch Start</button>
<button onclick="setEnd('${key}')">Fetch End</button>
<button onclick="completeRow('${key}')">Leech Completed</button>
<button onclick="removeRow('${key}')">Remove</button>
</td>

<td>
<input id="startTime${key}">
<button onclick="setTimestampNow('startTime${key}')">Now</button>
<input id="startLevel${key}">
<input id="startPercent${key}">
<input id="startExp${key}">
</td>

<td>
<input id="endTime${key}">
<button onclick="setTimestampNow('endTime${key}')">Now</button>
<input id="endLevel${key}">
<input id="endPercent${key}">
<input id="endExp${key}">
</td>

<td id="gained${key}">-</td>

<td>
<input id="rate${key}" value="1">
</td>

<td>
<div id="fee${key}">-</div>
<button onclick="copyFee('${key}')">Copy</button>
</td>
</tr>
`);

  activeRowCount++;
}

/* ===================== FETCH ===================== */
async function setStart(key) {
  captureUndoState();
  const ign = document.getElementById(`ign${key}`).value;
  const res = await fetchExactExp(ign);

  document.getElementById(`startTime${key}`).value = getCurrentTimestamp();
  document.getElementById(`startLevel${key}`).value = res.level;
  document.getElementById(`startPercent${key}`).value = res.percent;
  document.getElementById(`startExp${key}`).value = res.exactExp;

  updateRow(key);
}

async function setEnd(key) {
  captureUndoState();
  const ign = document.getElementById(`ign${key}`).value;
  const res = await fetchExactExp(ign);

  document.getElementById(`endTime${key}`).value = getCurrentTimestamp();
  document.getElementById(`endLevel${key}`).value = res.level;
  document.getElementById(`endPercent${key}`).value = res.percent;
  document.getElementById(`endExp${key}`).value = res.exactExp;

  updateRow(key);
}

/* ===================== FETCH ALL ===================== */
function hasAnyStartData() {
  return [...document.querySelectorAll("[id^='startExp']")]
    .some(el => el.value);
}

async function fetchStartAll() {
  if (hasAnyStartData()) {
    if (!confirm("Confirm Fetch All Start? This will overwrite all current Start Data")) return;
  }

  captureUndoState();

  for (const row of document.querySelectorAll("#active-body tr")) {
    const key = row.id.replace("row", "");
    if (document.getElementById(`ign${key}`).value) {
      await setStart(key);
    }
  }
}

async function fetchEndAll() {
  captureUndoState();

  for (const row of document.querySelectorAll("#active-body tr")) {
    const key = row.id.replace("row", "");
    if (document.getElementById(`ign${key}`).value) {
      await setEnd(key);
    }
  }
}

/* ===================== COMPLETE ===================== */
function completeRow(key) {
  captureUndoState();

  completedCounter++;
  const cKey = "c" + completedCounter;

  const row = document.getElementById(`row${key}`);

  document.getElementById("completed-body").insertAdjacentHTML("beforeend", `
<tr>
<td>${document.getElementById(`ign${key}`).value}</td>
<td>...</td>
<td>...</td>
<td id="gained${cKey}">${document.getElementById(`gained${key}`).innerHTML}</td>
<td>${document.getElementById(`rate${key}`).value}</td>
<td>${document.getElementById(`fee${key}`).innerText}</td>
<td>
<div id="statusText${cKey}" class="status-pending">Pending Payment</div>
<button id="paymentBtn${cKey}" onclick="markPaymentReceived('${cKey}')">Payment Received</button>
</td>
</tr>
`);

  row.remove();
}

/* ===================== PAYMENT ===================== */
function markPaymentReceived(key) {
  const status = document.getElementById(`statusText${key}`);
  const btn = document.getElementById(`paymentBtn${key}`);

  if (status.textContent === "Payment Received") return;

  captureUndoState();

  status.textContent = "Payment Received";
  status.classList.remove("status-pending");
  status.classList.add("status-paid");

  btn.disabled = true;
  btn.textContent = "Paid";

  saveData();
}

/* ===================== INIT ===================== */
document.addEventListener("DOMContentLoaded", () => {
  restoreData();

  if (activeRowCount === 0) {
    addRow();
  }

  updateActiveEarnings();
});
