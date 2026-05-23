// -------------------------------
// CONFIG
// -------------------------------
//const presetId = "90587C8C43DAC929C0E25FA2285716D1"; // <-- ВСТАВЬ СВОЙ ID
const presetId = "RCP_AdminControl"; 

let hosts = [
  {name:'PC1', ip:'192.168.1.10', port:30010},
  {name:'PC2', ip:'192.168.1.11', port:30010},
  {name:'PC3', ip:'192.168.1.12', port:30010},
  {name:'PC4', ip:'192.168.1.13', port:30010},
  {name:'PC5', ip:'192.168.1.14', port:30010},
];

// Load saved IPs
const saved = localStorage.getItem("ue5_hosts");
if(saved){
  try{
    const parsed = JSON.parse(saved);
    if(Array.isArray(parsed)) hosts = parsed;
  }catch{}
}

const defaultTimeout = 8000;

// -------------------------------
// BUILD TABLE
// -------------------------------
function saveHosts(){
  localStorage.setItem("ue5_hosts", JSON.stringify(hosts));
}

function buildTable(){
  const headerRow = document.getElementById('headerRow');
  const ipRow = document.getElementById('ipRow');
  const buttonRow = document.getElementById('buttonRow');
  const statusRow = document.getElementById('statusRow');

  hosts.forEach((h, i)=>{
    // Header with ping dot
    const th = document.createElement('th');
    th.innerHTML = `${h.name} <span id="dot${i}" class="dot unknown"></span>`;
    headerRow.appendChild(th);

    // IP input
    const tdIp = document.createElement('td');
    const input = document.createElement('input');
    input.value = h.ip;
    input.onchange = ()=>{
      hosts[i].ip = input.value;
      saveHosts();
    };
    tdIp.appendChild(input);
    ipRow.appendChild(tdIp);

    // Button
    const tdBtn = document.createElement('td');
    const btn = document.createElement('button');
    btn.className='btn';
    btn.textContent='Начать онбординг';
    btn.onclick = ()=> callHost(h, i);
    tdBtn.appendChild(btn);
    buttonRow.appendChild(tdBtn);

    // Status
    const tdStatus = document.createElement('td');
    tdStatus.id = 'status'+i;
    tdStatus.textContent='';
    statusRow.appendChild(tdStatus);
  });
}

// -------------------------------
// CALL FUNCTION VIA PRESET
// -------------------------------
async function callHost(host, idx){
  setStatus(idx,'pending');
  try{
	const url = `http://${host.ip}:${host.port}/remote/preset/${presetId}/function/StartOnboarding`;

    const body = {
		Parameters: {},
		GenerateTransaction: true
	};

    const controller = new AbortController();
    const id = setTimeout(()=>controller.abort(), defaultTimeout);

    const res = await fetch(url, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(id);
    if(!res.ok) throw new Error(res.status+' '+res.statusText);

    const data = await res.json();
    setStatus(idx,'ok', '');
  } catch(e){
    setStatus(idx,'err', e.message);
  }
}

function setStatus(idx, state, msg=''){
  const el = document.getElementById('status'+idx);
  el.textContent = state + (msg?(' — '+msg):'');
  el.className = state==='ok'?'ok': state==='err'?'err':'';
}

// -------------------------------
// PING
// -------------------------------
async function pingHost(host, idx){
  const dot = document.getElementById('dot'+idx);
  try{
    const url = `http://${host.ip}:${host.port}/remote/info`;

    const controller = new AbortController();
    const id = setTimeout(()=>controller.abort(), 900);

    const res = await fetch(url, { method:'GET', signal: controller.signal });
    clearTimeout(id);

    if(!res.ok) throw new Error();

    dot.classList.remove("offline");
    dot.classList.add("online");
  } catch(e){
    dot.classList.remove("online");
    dot.classList.add("offline");
  }
}

setInterval(()=>{
  hosts.forEach((h,i)=> pingHost(h,i));
}, 2000);

// -------------------------------
document.getElementById('callAllStartOnboarding').onclick = ()=>{
  hosts.forEach((h,i)=> callHost(h,i));
};

buildTable();
