async function fetchCharacters(){

const requests=[];

for(let i=1;i<=10;i++){

const name=document.getElementById("ign"+i).value.trim();
const resultCell=document.getElementById("result"+i);

if(!name){
resultCell.innerHTML="";
continue;
}

resultCell.innerHTML="Loading...";

requests.push(loadCharacter(name,resultCell));

}

await Promise.all(requests);

}

async function loadCharacter(name,resultCell){

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

resultCell.innerHTML=`
Level ${level}<br>
EXP: ${data.exp}<br>
Exact EXP: ${exactExp.toLocaleString()}<br>
Remaining: ${remaining.toLocaleString()}
`;

}catch(err){

resultCell.innerHTML=`<span class="error">${err.message}</span>`;

}

}
