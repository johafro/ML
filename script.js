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
  let expPerHourText = "-";
  let gained = endExp - startExp;

  if (gained > 0) {
    expText = gained.toLocaleString();

    if (startTime && endTime) {
      const durationMs = endTime - startTime;

      if (durationMs > 0) {
        const expPerHour = gained * (3600000 / durationMs);
        expPerHourText = `${Math.round(expPerHour).toLocaleString()}/hr`;
      }
    }
  }

  document.getElementById(`gained${rowKey}`).innerHTML =
    `<div>Time: ${timeText}</div>
     <div>EXP: ${expText}</div>
     <div>EXP/Hr: ${expPerHourText}</div>`;

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

/* ===================== ADD ROW ===================== */
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

<td id="gained${key}">
<div>Time: -</div>
<div>EXP: -</div>
<div>EXP/Hr: -</div>
</td>

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

/* ===================== COPY ===================== */
function copyFee(key) {
  const fee = document.getElementById(`fee${key}`).innerText;
  if (fee && fee !== "-") {
    navigator.clipboard.writeText(fee.replace(/,/g, ""));
  }
}

/* ===================== INIT ===================== */
document.addEventListener("DOMContentLoaded", () => {
  restoreData();

  if (activeRowCount === 0) {
    addRow();
  }

  updateActiveEarnings();
});
