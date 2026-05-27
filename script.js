// -------------------------------
// CONFIG
// -------------------------------
const presetId = "RCP_AdminControl"; 

let hosts = [
  {name:'PC1', ip:'192.168.50.101', port:30010},
  {name:'PC2', ip:'192.168.50.102', port:30010},
  {name:'PC3', ip:'192.168.50.103', port:30010},
  {name:'PC4', ip:'192.168.50.104', port:30010},
  {name:'PC5', ip:'192.168.50.105', port:30010},
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

function saveHosts(){
  localStorage.setItem("ue5_hosts", JSON.stringify(hosts));
}

// -------------------------------
// BUILD CARDS (MOBILE FIRST)
// -------------------------------
function buildDashboard(){
  const container = document.getElementById('pcContainer');
  if(!container) return;
  container.innerHTML = ''; // Очистка перед сборкой

  hosts.forEach((h, i)=>{
    // Создаем общую карточку для одного хоста
    const card = document.createElement('div');
    card.className = 'pc-card';

    // Шапка карточки: Имя и статус-точка
    const header = document.createElement('div');
    header.className = 'card-header';
    header.innerHTML = `<span class="pc-name">${h.name}</span><span id="dot${i}" class="dot unknown"></span>`;
    card.appendChild(header);

    // Поле ввода IP-адреса
    const ipGroup = document.createElement('div');
    ipGroup.className = 'ip-group';
    ipGroup.innerHTML = `<label>IP:</label>`;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = h.ip;
    input.onchange = ()=>{
      hosts[i].ip = input.value;
      saveHosts();
    };
    ipGroup.appendChild(input);
    card.appendChild(ipGroup);

    // Зона действий (Кнопки и статусы ответа)
    const actions = document.createElement('div');
    actions.className = 'card-actions';

    // Блок кнопки Онбординга
    const startRow = document.createElement('div');
    startRow.className = 'action-row';
    const btnStart = document.createElement('button');
    btnStart.className = 'btn btn-start';
    btnStart.textContent = 'Начать онбординг';
    btnStart.onclick = () => callHost(h, i, 'CallStartOnboarding');
    const statusStart = document.createElement('div');
    statusStart.id = 'status_start_' + i;
    statusStart.className = 'status-text';
    startRow.appendChild(btnStart);
    startRow.appendChild(statusStart);
    actions.appendChild(startRow);

    // Блок кнопки ResetSession
    const resetRow = document.createElement('div');
    resetRow.className = 'action-row';
    const btnReset = document.createElement('button');
    btnReset.className = 'btn btn-reset';
    btnReset.textContent = 'ResetSession';
    btnReset.onclick = () => callHost(h, i, 'CallResetSession');
    const statusReset = document.createElement('div');
    statusReset.id = 'status_reset_' + i;
    statusReset.className = 'status-text';
    resetRow.appendChild(btnReset);
    resetRow.appendChild(statusReset);
    actions.appendChild(resetRow);

    card.appendChild(actions);
    container.appendChild(card);
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

    await res.json();
    setStatus(idx, functionName, 'ok', '');
  } catch(e){
    setStatus(idx, functionName, 'err', e.message);
  }
}

function setStatus(idx, functionName, state, msg=''){
  const statusId = functionName === 'CallStartOnboarding' ? 'status_start_' + idx : 'status_reset_' + idx;
  const el = document.getElementById(statusId);
  if(!el) return;
  
  if (state === 'pending') {
    el.textContent = '⌛ Отправка запроса...';
    el.className = 'status-text pending';
  } else if (state === 'ok') {
    el.textContent = '✅ Выполнено успешно';
    el.className = 'status-text ok';
  } else if (state === 'err') {
    el.textContent = '❌ Ошибка: ' + msg;
    el.className = 'status-text err';
  }
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
  buildDashboard();
  
  // Инициализация глобальных кнопок
  document.getElementById('callAllStartOnboarding').onclick = ()=>{
    hosts.forEach((h,i)=> callHost(h, i, 'CallStartOnboarding'));
  };
  
  document.getElementById('resetAllSession').onclick = ()=>{
    hosts.forEach((h,i)=> callHost(h, i, 'CallResetSession'));
  };
  
  // Запуск фонового пинга
  setInterval(()=>{
    hosts.forEach((h,i)=> pingHost(h,i));
  }, 2000);
});