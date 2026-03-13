<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Maple Leech Fee Tracker</title>

<link rel="stylesheet" href="style.css">

</head>

<body>

<h1>Maple Leech Fee Tracker</h1>

<table class="exp-table">

<thead>
<tr>
<th>Character</th>
<th>Start EXP</th>
<th>End EXP</th>
<th>EXP Gained</th>
<th>Rate (EXP / meso)</th>
<th>Fee (mesos)</th>
<th>Actions</th>
</tr>
</thead>

<tbody>

<tr>

<td>
<input id="ign1" placeholder="Character 1">
</td>

<td>

<div class="exp-box">

<div>
Level:
<input id="startLevel1" type="number">
</div>

<div>
EXP:
<input id="startExp1" type="number">
</div>

<div>
EXP %:
<input id="startPercent1" type="number" step="0.01">
</div>

</div>

</td>

<td>

<div class="exp-box">

<div>
Level:
<input id="endLevel1" type="number">
</div>

<div>
EXP:
<input id="endExp1" type="number">
</div>

<div>
EXP %:
<input id="endPercent1" type="number" step="0.01">
</div>

</div>

</td>

<td id="gained1">-</td>

<td>
<input id="rate1" type="number" step="any">
</td>

<td id="fee1">-</td>

<td>
<button onclick="setStart(1)">Fetch Start</button>
<button onclick="setEnd(1)">Fetch End</button>
</td>

</tr>


<tr>

<td>
<input id="ign2" placeholder="Character 2">
</td>

<td>

<div class="exp-box">

<div>
Level:
<input id="startLevel2" type="number">
</div>

<div>
EXP:
<input id="startExp2" type="number">
</div>

<div>
EXP %:
<input id="startPercent2" type="number" step="0.01">
</div>

</div>

</td>

<td>

<div class="exp-box">

<div>
Level:
<input id="endLevel2" type="number">
</div>

<div>
EXP:
<input id="endExp2" type="number">
</div>

<div>
EXP %:
<input id="endPercent2" type="number" step="0.01">
</div>

</div>

</td>

<td id="gained2">-</td>

<td>
<input id="rate2" type="number" step="any">
</td>

<td id="fee2">-</td>

<td>
<button onclick="setStart(2)">Fetch Start</button>
<button onclick="setEnd(2)">Fetch End</button>
</td>

</tr>

</tbody>

</table>

<script src="exptable.js"></script>
<script src="script.js"></script>

</body>
</html>
