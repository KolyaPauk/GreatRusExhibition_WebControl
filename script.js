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
const osCommandTimeout = 5000;

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

    // ===== UE5 SECTION =====
    const ue5Section = document.createElement('div');
    ue5Section.className = 'action-section';
    
    const ue5Title = document.createElement('div');
    ue5Title.className = 'action-section-title';
    ue5Title.textContent = 'UE5 Команды';
    ue5Section.appendChild(ue5Title);

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
    ue5Section.appendChild(startRow);

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
    ue5Section.appendChild(resetRow);

    actions.appendChild(ue5Section);

    // ===== OS SECTION =====
    const osSection = document.createElement('div');
    osSection.className = 'action-section';
    
    const osTitle = document.createElement('div');
    osTitle.className = 'action-section-title';
    osTitle.textContent = 'ОС Команды';
    osSection.appendChild(osTitle);

    // Shutdown button
    const shutdownRow = document.createElement('div');
    shutdownRow.className = 'action-row';
    const btnShutdown = document.createElement('button');
    btnShutdown.className = 'btn btn-shutdown';
    btnShutdown.textContent = '⏹️ Выключить';
    btnShutdown.onclick = () => callOSCommand(h, i, 'shutdown');
    const statusShutdown = document.createElement('div');
    statusShutdown.id = 'status_shutdown_' + i;
    statusShutdown.className = 'status-text';
    shutdownRow.appendChild(btnShutdown);
    shutdownRow.appendChild(statusShutdown);
    osSection.appendChild(shutdownRow);

    // Restart button
    const restartRow = document.createElement('div');
    restartRow.className = 'action-row';
    const btnRestart = document.createElement('button');
    btnRestart.className = 'btn btn-restart';
    btnRestart.textContent = '🔄 Перезагрузить';
    btnRestart.onclick = () => callOSCommand(h, i, 'restart');
    const statusRestart = document.createElement('div');
    statusRestart.id = 'status_restart_' + i;
    statusRestart.className = 'status-text';
    restartRow.appendChild(btnRestart);
    restartRow.appendChild(statusRestart);
    osSection.appendChild(restartRow);

    // Run App button
    const runappRow = document.createElement('div');
    runappRow.className = 'action-row';
    const btnRunapp = document.createElement('button');
    btnRunapp.className = 'btn btn-runapp';
    btnRunapp.textContent = '▶️ Запустить app';
    btnRunapp.onclick = () => callOSCommand(h, i, 'runapp');
    const statusRunapp = document.createElement('div');
    statusRunapp.id = 'status_runapp_' + i;
    statusRunapp.className = 'status-text';
    runappRow.appendChild(btnRunapp);
    runappRow.appendChild(statusRunapp);
    osSection.appendChild(runappRow);

    actions.appendChild(osSection);
    card.appendChild(actions);
    container.appendChild(card);
  });
}

// -------------------------------
// CALL FUNCTION VIA PRESET (UE5)
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

// -------------------------------
// CALL OS COMMANDS
// -------------------------------
async function callOSCommand(host, idx, command){
  setOSStatus(idx, command, 'pending');
  try{
    const url = `http://${host.ip}:8081/${command}`;

    const controller = new AbortController();
    const id = setTimeout(()=>controller.abort(), osCommandTimeout);

    const res = await fetch(url, {
      method:'GET',
      signal: controller.signal
    });

    clearTimeout(id);
    if(!res.ok) throw new Error(res.status+' '+res.statusText);

    setOSStatus(idx, command, 'ok', '');
  } catch(e){
    setOSStatus(idx, command, 'err', e.message);
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

function setOSStatus(idx, command, state, msg=''){
  const statusId = 'status_' + command + '_' + idx;
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
  
  // ===== UE5 Global Commands =====
  document.getElementById('callAllStartOnboarding').onclick = ()=>{
    hosts.forEach((h,i)=> callHost(h, i, 'CallStartOnboarding'));
  };
  
  document.getElementById('resetAllSession').onclick = ()=>{
    hosts.forEach((h,i)=> callHost(h, i, 'CallResetSession'));
  };

  // ===== OS Global Commands =====
  document.getElementById('shutdownAll').onclick = ()=>{
    hosts.forEach((h,i)=> callOSCommand(h, i, 'shutdown'));
  };

  document.getElementById('restartAll').onclick = ()=>{
    hosts.forEach((h,i)=> callOSCommand(h, i, 'restart'));
  };

  document.getElementById('runappAll').onclick = ()=>{
    hosts.forEach((h,i)=> callOSCommand(h, i, 'runapp'));
  };
  
  // Запуск фонового пинга
  setInterval(()=>{
    hosts.forEach((h,i)=> pingHost(h,i));
  }, 2000);
});
