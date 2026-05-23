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
  const resetRow = document.getElementById('resetRow');

  // Add "Все" column header
  const allHeader = document.createElement('th');
  allHeader.textContent = 'Все';
  headerRow.appendChild(allHeader);

  // Add "IP" label
  const ipLabel = document.createElement('td');
  ipLabel.textContent = 'IP';
  ipRow.appendChild(ipLabel);

  // Add "Call All" button in first column of button row
  const callAllTd = document.createElement('td');
  const callAllBtn = document.createElement('button');
  callAllBtn.id = 'callAllStartOnboarding';
  callAllBtn.className = 'btn';
  callAllBtn.textContent = 'Начать онбординг на всех ПК';
  callAllBtn.onclick = ()=>{
    hosts.forEach((h,i)=> callHost(h, i, 'CallStartOnboarding'));
  };
  callAllTd.appendChild(callAllBtn);
  buttonRow.appendChild(callAllTd);

  // Add "Reset All" button in first column of reset row
  const resetAllTd = document.createElement('td');
  const resetAllBtn = document.createElement('button');
  resetAllBtn.id = 'resetAllSession';
  resetAllBtn.className = 'btn';
  resetAllBtn.textContent = 'ResetSession на всех ПК';
  resetAllBtn.onclick = ()=>{
    hosts.forEach((h,i)=> callHost(h, i, 'CallResetSession'));
  };
  resetAllTd.appendChild(resetAllBtn);
  resetRow.appendChild(resetAllTd);

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

    // CallStartOnboarding Button with status
    const tdBtn = document.createElement('td');
    const buttonCell = document.createElement('div');
    buttonCell.className = 'button-cell';

    const btn = document.createElement('button');
    btn.className='btn';
    btn.textContent='Начать онбординг';
    btn.onclick = ()=> callHost(h, i, 'CallStartOnboarding');

    const statusDiv = document.createElement('div');
    statusDiv.id = 'status_start_'+i;
    statusDiv.className = 'status-text';
    statusDiv.textContent = '';

    buttonCell.appendChild(btn);
    buttonCell.appendChild(statusDiv);
    tdBtn.appendChild(buttonCell);
    buttonRow.appendChild(tdBtn);

    // CallResetSession Button with status
    const tdReset = document.createElement('td');
    const resetCell = document.createElement('div');
    resetCell.className = 'button-cell';

    const resetBtn = document.createElement('button');
    resetBtn.className='btn';
    resetBtn.textContent='ResetSession';
    resetBtn.onclick = ()=> callHost(h, i, 'CallResetSession');

    const resetStatusDiv = document.createElement('div');
    resetStatusDiv.id = 'status_reset_'+i;
    resetStatusDiv.className = 'status-text';
    resetStatusDiv.textContent = '';

    resetCell.appendChild(resetBtn);
    resetCell.appendChild(resetStatusDiv);
    tdReset.appendChild(resetCell);
    resetRow.appendChild(tdReset);
  });
}

// -------------------------------
// CALL FUNCTION VIA PRESET
// -------------------------------
async function callHost(host, idx, functionName){
  setStatus(idx, functionName, 'pending');
  try{
	const url = `http://${host.ip}:${host.port}/remote/preset/${presetId}/function/${functionName}`;

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
    setStatus(idx, functionName, 'ok', '');
  } catch(e){
    setStatus(idx, functionName, 'err', e.message);
  }
}

function setStatus(idx, functionName, state, msg=''){
  const statusId = functionName === 'CallStartOnboarding' ? 'status_start_' + idx : 'status_reset_' + idx;
  const el = document.getElementById(statusId);
  if(!el) return;
  el.textContent = state + (msg?(' — '+msg):'');
  el.className = 'status-text ' + (state==='ok'?'ok': state==='err'?'err':'');
}

// -------------------------------
// PING
// -------------------------------
async function pingHost(host, idx){
  const dot = document.getElementById('dot'+idx);
  if(!dot) return;
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

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', ()=>{
  buildTable();
  
  setInterval(()=>{
    hosts.forEach((h,i)=> pingHost(h,i));
  }, 2000);
});
