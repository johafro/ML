let activeRowCount = 0;
let nextRowId = 1;

function getNow() {
  return new Date().toISOString().slice(0,19).replace("T"," ");
}

function parseTime(t) {
  if (!t) return null;
  return new Date(t.replace(" ","T"));
}

function formatDuration(ms) {
  if (!ms || ms < 0) return "-";

  const s = Math.floor(ms/1000);
  const h = Math.floor(s/3600);
  const m = Math.floor((s%3600)/60);
  const sec = s%60;

  return `${h}h ${String(m).padStart(2,"0")}m ${String(sec).padStart(2,"0")}s`;
}

function updateRow(k) {
  const sExp = Number(document.getElementById(`startExp${k}`).value||0);
  const eExp = Number(document.getElementById(`endExp${k}`).value||0);
  const rate = Number(document.getElementById(`rate${k}`).value||0);

  const sTime = parseTime(document.getElementById(`startTime${k}`).value);
  const eTime = parseTime(document.getElementById(`endTime${k}`).value);

  let gained = eExp - sExp;

  let timeText = "-";
  let expText = "-";
  let expHrText = "-";

  if (sTime && eTime) {
    const dur = eTime - sTime;
    timeText = formatDuration(dur);

    if (dur > 0 && gained > 0) {
      const expHr = gained * (3600000 / dur);
      expHrText = `${Math.round(expHr).toLocaleString()}/hr`;
    }
  }

  if (gained > 0) {
    expText = gained.toLocaleString();
  }

  document.getElementById(`gained${k}`).innerHTML =
    `<div>Time: ${timeText}</div>
     <div>EXP: ${expText}</div>
     <div>EXP/Hr: ${expHrText}</div>`;

  if (gained > 0 && rate > 0) {
    document.getElementById(`fee${k}`).innerText =
      Math.ceil(gained / rate).toLocaleString();
  }
}

function addRow() {
  const k = nextRowId++;

  document.getElementById("active-body").insertAdjacentHTML("beforeend", `
<tr id="row${k}">
<td>
<input id="ign${k}">
<button onclick="setStart(${k})">Fetch Start</button>
<button onclick="setEnd(${k})">Fetch End</button>
</td>

<td>
<input id="startTime${k}">
<button onclick="document.getElementById('startTime${k}').value=getNow()">Now</button>
<input id="startExp${k}">
</td>

<td>
<input id="endTime${k}">
<button onclick="document.getElementById('endTime${k}').value=getNow()">Now</button>
<input id="endExp${k}">
</td>

<td id="gained${k}">
<div>Time: -</div>
<div>EXP: -</div>
<div>EXP/Hr: -</div>
</td>

<td><input id="rate${k}" value="1"></td>

<td><div id="fee${k}">-</div></td>
</tr>
`);

  activeRowCount++;
}

async function setStart(k) {
  document.getElementById(`startTime${k}`).value = getNow();
}

async function setEnd(k) {
  document.getElementById(`endTime${k}`).value = getNow();
  updateRow(k);
}

document.addEventListener("DOMContentLoaded", () => {
  addRow();
});
