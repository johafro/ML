async function fetchCharacters() {

const resultBox=document.getElementById("result");
resultBox.innerHTML="Loading...";

let html="";

for(let i=1;i<=10;i++){

const name=document.getElementById("ign"+i).value.trim();

if(!name) continue;

try{

const response=await fetch(`/api/character?name=${encodeURIComponent(name)}`);
const data=await response.json();

if(!response.ok){
throw new Error(data.error||"Character not found");
}

const level=Number(data.level);
const percent=parseFloat(String(data.exp).replace("%",""));

const row=expTable[level];

const exactExp=Math.floor(row.acc + row.next*(percent/100));
const remaining=Math.ceil(row.next*(1-percent/100));

html+=`
<div class="card">
<div><b>${data.name}</b></div>
<div>Level: ${level}</div>
<div>EXP: ${data.exp}</div>
<div>Exact EXP: ${exactExp.toLocaleString()}</div>
<div>EXP Remaining: ${remaining.toLocaleString()}</div>
</div>
`;

}catch(err){

html+=`
<div class="card">
<div><b>${name}</b></div>
<div class="error">Error: ${err.message}</div>
</div>
`;

}

}

resultBox.innerHTML=html || "No characters entered.";

}
