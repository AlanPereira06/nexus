const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const store={get:(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
let tasks=store.get('nexus_tasks',[
{id:1,name:'Definir la prioridad principal del día',done:false,priority:'alta'},
{id:2,name:'25 minutos de trabajo sin distracciones',done:false,priority:'normal'},
{id:3,name:'Cerrar una tarea pendiente',done:true,priority:'normal'}
]);
let notes=store.get('nexus_notes',[]);
let sessions=store.get('nexus_sessions',0);
const quotes=[
['La disciplina es elegir entre lo que quieres ahora y lo que quieres más.','Abraham Lincoln'],
['No necesitas más tiempo. Necesitas decidir qué merece tu tiempo.','NEXUS'],
['La acción convierte una idea en algo que existe.','NEXUS'],
['Lo simple, cuando está bien hecho, es poderoso.','NEXUS'],
['Tu atención es un recurso. Gástala con intención.','NEXUS'],
['Empieza antes de sentirte listo.','NEXUS']
];
let quoteIndex=Math.floor(Math.random()*quotes.length);

function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
function saveTasks(){store.set('nexus_tasks',tasks);renderTasks()}
function renderTasks(){
 const html=tasks.length?tasks.map(t=>`<div class="task ${t.done?'done':''}">
 <input type="checkbox" data-check="${t.id}" ${t.done?'checked':''}>
 <div><div class="task-name">${escapeHtml(t.name)}</div><span class="priority ${t.priority}">${t.priority}</span></div>
 <button class="delete" data-delete="${t.id}" title="Eliminar">×</button></div>`).join(''):'<p class="muted">Todo despejado. Añade tu próxima tarea.</p>';
 $('#taskList').innerHTML=html;
 $('#homeTaskList').innerHTML=tasks.slice(0,4).map(t=>`<div class="task ${t.done?'done':''}"><input type="checkbox" data-check="${t.id}" ${t.done?'checked':''}><div class="task-name">${escapeHtml(t.name)}</div></div>`).join('')||'<p class="muted">Sin tareas todavía.</p>';
 const done=tasks.filter(t=>t.done).length,total=tasks.length,pct=total?Math.round(done/total*100):0;
 $('#completionPercent').textContent=pct+'%';$('#taskProgress').style.width=pct+'%';$('#doneCount').textContent=`${done} / ${total}`;$('#taskSummary').textContent=`${done} de ${total} completadas`;
 $$('[data-check]').forEach(x=>x.onchange=()=>{const t=tasks.find(t=>t.id==x.dataset.check);if(t)t.done=x.checked;saveTasks()});
 $$('[data-delete]').forEach(x=>x.onclick=()=>{tasks=tasks.filter(t=>t.id!=x.dataset.delete);saveTasks();toast('Tarea eliminada')});
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function addTask(name,priority='normal'){name=name.trim();if(!name)return;tasks.unshift({id:Date.now(),name,done:false,priority});saveTasks();toast('Tarea añadida')}
$('#taskForm').onsubmit=e=>{e.preventDefault();addTask($('#taskInput').value,$('#taskPriority').value);$('#taskInput').value=''};
$('#quickTaskForm').onsubmit=e=>{e.preventDefault();addTask($('#quickTaskInput').value);$('#quickTaskInput').value='';$('#quickTaskForm').classList.add('hidden')};
$('#openTaskInput').onclick=()=>{$('#quickTaskForm').classList.toggle('hidden');$('#quickTaskInput').focus()};

function go(view){$$('.view').forEach(v=>v.classList.toggle('active',v.id===view));$$('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view===view));window.scrollTo({top:0,behavior:'smooth'})}
$$('.nav-item').forEach(n=>n.onclick=()=>go(n.dataset.view));$$('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));

function updateClock(){const d=new Date();$('#clock').textContent=d.toLocaleTimeString('es-UY',{hour:'2-digit',minute:'2-digit'});$('#dateLabel').textContent=d.toLocaleDateString('es-UY',{weekday:'long',day:'numeric',month:'long'}).toUpperCase();const h=d.getHours();$('#greeting').textContent=(h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches')+', Alan.'}
updateClock();setInterval(updateClock,1000);

function showQuote(){const [q,a]=quotes[quoteIndex];$('#quoteText').textContent='“'+q+'”';$('#bigQuote').textContent='“'+q+'”';$('#quoteAuthor').textContent='— '+a}
function nextQuote(){quoteIndex=(quoteIndex+1)%quotes.length;showQuote()}$('#newQuote').onclick=nextQuote;$('#shuffleQuote').onclick=nextQuote;showQuote();

const scratch=$('#scratchpad');scratch.value=store.get('nexus_scratch','');let saveTimer;scratch.oninput=()=>{clearTimeout(saveTimer);$('#saveIndicator').textContent='Guardando...';saveTimer=setTimeout(()=>{store.set('nexus_scratch',scratch.value);$('#saveIndicator').textContent='Guardado automáticamente'},350)};

function renderNotes(){const grid=$('#notesGrid');grid.innerHTML=notes.length?notes.map(n=>`<article class="panel note"><textarea data-note="${n.id}" placeholder="Escribe aquí...">${escapeHtml(n.text)}</textarea><div class="note-footer"><span>${new Date(n.id).toLocaleDateString('es-UY')}</span><button class="delete" data-note-delete="${n.id}">Eliminar</button></div></article>`).join(''):'<article class="panel"><h3>Todavía no hay notas</h3><p class="muted">Crea una para capturar ideas, recordatorios o pensamientos rápidos.</p></article>';
 $$('[data-note]').forEach(el=>el.oninput=()=>{const n=notes.find(n=>n.id==el.dataset.note);n.text=el.value;store.set('nexus_notes',notes)});
 $$('[data-note-delete]').forEach(el=>el.onclick=()=>{notes=notes.filter(n=>n.id!=el.dataset.noteDelete);store.set('nexus_notes',notes);renderNotes()})}
$('#newNote').onclick=()=>{notes.unshift({id:Date.now(),text:''});store.set('nexus_notes',notes);renderNotes();setTimeout(()=>$('#notesGrid textarea')?.focus(),0)};renderNotes();

let total=25*60,remaining=total,running=false,interval;
function formatTime(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function renderTimer(){const f=formatTime(remaining);$('#timer').textContent=f;$('#focusPreview').textContent=f;const pct=(remaining/total)*100;$('#timerRing').style.background=`conic-gradient(var(--accent) ${pct}%,rgba(255,255,255,.07) 0)`;$('#focusProgress').style.width=(100-pct)+'%';$('#timerStart').textContent=running?'Pausar':'Empezar';$('#quickFocus').textContent=running?'Pausar':'Empezar'}
function toggleTimer(){running=!running;if(running){interval=setInterval(()=>{remaining--;if(remaining<=0){clearInterval(interval);running=false;remaining=0;sessions++;store.set('nexus_sessions',sessions);$('#sessionsCount').textContent=sessions;toast('Sesión completada ✦')}renderTimer()},1000)}else clearInterval(interval);renderTimer()}
$('#timerStart').onclick=toggleTimer;$('#quickFocus').onclick=()=>{toggleTimer();go('focus')};$('#timerReset').onclick=()=>{clearInterval(interval);running=false;remaining=total;renderTimer()};
$$('.preset').forEach(b=>b.onclick=()=>{clearInterval(interval);running=false;total=+b.dataset.minutes*60;remaining=total;$$('.preset').forEach(x=>x.classList.toggle('active',x===b));renderTimer()});
$('#sessionsCount').textContent=sessions;renderTimer();

const light=store.get('nexus_light',false);document.body.classList.toggle('light',light);$('#themeToggle').onclick=()=>{document.body.classList.toggle('light');store.set('nexus_light',document.body.classList.contains('light'))};
renderTasks();