// softskill: skills radar, roleplay, pitch coach, journal, practice rooms, certificates, lesson Q&A.
// Loaded before the main script; it relies on helpers (sb, me, prof, q, esc, when, api, toast, H, A ...) defined there.
const SK=[["communication","Communication","Communication"],["eq","Emotional Intelligence","Emotional IQ"],["leadership","Leadership","Leadership"],["negotiation","Negotiation","Negotiation"],["presence","Executive Presence","Presence"]];
const SKL=Object.fromEntries(SK.map(([k,l])=>[k,l]));
const AUTH=["skills","roleplay","play","coach","journal","practice","certs","cert"];
const SIDE=[["app","My learning"],["live","Live classes"],["skills","Skills radar"],["roleplay","Roleplay"],["coach","Pitch coach"],["journal","Journal"],["practice","Practice rooms"],["certs","Certificates"]];
const side=on=>SIDE.map(([r,l])=>`<a href="#/${r}" class="${r===on?"on":""}">${l}</a>`).join("");
const hid=()=>decodeURIComponent(location.hash.split("/")[2]||"");
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const shell=(on,inner)=>`<div class="dash"><aside class="side">${side(on)}</aside><div class="body">${inner}</div></div>`;
const hero=(e,t,p)=>`<div class="banner"><div><span class="eyebrow">${e}</span><h1>${t}</h1><p>${p}</p></div></div>`;
const names=async ids=>{ids=[...new Set(ids.filter(Boolean))];return Object.fromEntries((ids.length?await q(sb.from("public_profiles").select("*").in("id",ids)):[]).map(p=>[p.id,p.full_name]))};
const first=n=>esc((n||"Student").split(" ")[0]);

function streakOf(days){const set=new Set(days);let d=new Date(Date.now()-new Date().getTimezoneOffset()*6e4),n=0;
  if(!set.has(d.toISOString().slice(0,10)))d=new Date(d-864e5);
  while(set.has(d.toISOString().slice(0,10))){n++;d=new Date(d-864e5)}return n}

/* ---------- dashboard extras ---------- */
async function dashExtra(cs,pays){
  const [mods,pr,je,lv]=await Promise.all([
    q(sb.from("lessons").select("id,course_id").eq("kind","module")),
    q(sb.from("lesson_progress").select("lesson_id,done_at").eq("user_id",me.id).order("done_at",{ascending:false})),
    q(sb.from("journal_entries").select("day").eq("user_id",me.id)),
    q(sb.from("live_classes").select("*").gte("starts_at",new Date(Date.now()-72e5).toISOString()).order("starts_at").limit(3))]);
  const open=new Set(cs.filter(c=>approvedFor(c,pays)).map(c=>c.id)),mm=mods.filter(m=>open.has(m.course_id)),done=new Set(pr.map(x=>x.lesson_id));
  const pct=mm.length?Math.round(mm.filter(m=>done.has(m.id)).length/mm.length*100):0;
  const last=pr[0]&&mods.find(m=>m.id===pr[0].lesson_id),rid=last?last.course_id:[...open][0],st=streakOf(je.map(x=>x.day));
  const stats=`<div><b>${pct}%</b><span>Completed</span></div><div><b>${st}</b><span>Day streak</span></div><div><b>${open.size}</b><span>Courses open</span></div><div><b>${pays.filter(p=>p.status==="pending").length}</b><span>Pending</span></div>`;
  const panel=`<div class="grid" style="margin-bottom:30px"><div class="ok" style="margin:0"><h3 style="font-size:20px;margin-bottom:6px">Upcoming live sessions</h3>${lv.length?lv.map(l=>`<div style="padding:8px 0;border-bottom:1px solid var(--l)"><b>${esc(l.title)}</b><div class="hint">${when(l.starts_at)}</div></div>`).join(""):'<p class="hint">No live sessions scheduled yet.</p>'}<a class="btn s o" style="margin-top:12px" href="#/live">All live classes</a></div>
  <div class="ok" style="margin:0"><h3 style="font-size:20px;margin-bottom:6px">Keep going</h3><p class="hint">${st?"You are on a "+st+"-day streak. ":""}Pick up where you left off, then do today's challenge.</p><div style="display:flex;gap:8px;flex-wrap:wrap">${rid?`<a class="btn" href="#/course/${rid}">${last?"Resume learning":"Start learning"}</a>`:""}<a class="btn o" href="#/journal">Today's challenge</a></div></div></div>`;
  return {stats,panel}}

/* ---------- skills radar ---------- */
function radar(v){const cx=150,cy=150,R=108,n=5,pt=(i,r)=>{const a=-Math.PI/2+i*2*Math.PI/n;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]};
  const ring=f=>SK.map((_,i)=>pt(i,R*f).join(",")).join(" "),poly=SK.map(([k],i)=>pt(i,R*Math.max(.03,v[k]/100)).join(",")).join(" ");
  return `<svg viewBox="0 0 300 300" style="width:100%;max-width:380px" role="img" aria-label="Skills radar chart">${[.25,.5,.75,1].map(f=>`<polygon points="${ring(f)}" fill="none" stroke="rgba(0,0,0,.12)"/>`).join("")}${SK.map((_,i)=>{const[x,y]=pt(i,R);return `<line x1="150" y1="150" x2="${x}" y2="${y}" stroke="rgba(0,0,0,.12)"/>`}).join("")}<polygon points="${poly}" fill="rgba(10,10,10,.16)" stroke="#0A0A0A" stroke-width="2"/>${SK.map(([k],i)=>{const[x,y]=pt(i,v[k]/100*R);return `<circle cx="${x}" cy="${y}" r="4" fill="#0A0A0A"/>`}).join("")}${SK.map(([,,s],i)=>{const[x,y]=pt(i,R+20);return `<text x="${x}" y="${y+4}" text-anchor="middle" font-size="11" font-weight="600" fill="#3f3f46">${s}</text>`}).join("")}</svg>`}
async function skills(){
  const [ev,pa]=await Promise.all([q(sb.from("skill_events").select("skill,points").eq("user_id",me.id)),q(sb.from("pitch_attempts").select("clarity,confidence").eq("user_id",me.id))]);
  const v=Object.fromEntries(SK.map(([k])=>[k,0]));ev.forEach(e=>v[e.skill]+=e.points);
  v.communication+=Math.max(0,...pa.map(x=>x.clarity))/2;v.presence+=Math.max(0,...pa.map(x=>x.confidence))/2;
  SK.forEach(([k])=>v[k]=Math.min(100,Math.round(v[k])));
  return shell("skills",hero("Skills","Your soft skills radar","Built from your roleplay scenarios and your best pitch coach scores.")+
  `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr));align-items:start"><div class="ok" style="margin:0;text-align:center">${radar(v)}</div>
  <div class="ok" style="margin:0">${SK.map(([k,l])=>`<div class="row" style="margin-top:10px"><b>${l}</b><span class="hint">${v[k]} / 100</span></div><div class="bar" style="max-width:none;margin:6px 0 0"><i style="width:${v[k]}%"></i></div>`).join("")}
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:20px"><a class="btn s" href="#/roleplay">Practise a scenario</a><a class="btn s o" href="#/coach">Pitch coach</a></div></div></div>`)}

/* ---------- roleplay ---------- */
let RP=null;
async function roleplay(){
  const ss=await q(sb.from("scenarios").select("id,title,description,skill").order("created_at"));
  return shell("roleplay",hero("Roleplay","Workplace simulator","Choose how you respond. Each choice changes the conversation and your skill scores.")+
  (ss.length?`<div class="grid">${ss.map((s,i)=>`<div class="card"><div class="cover c${i%3}"><span>${String(i+1).padStart(2,"0")}</span></div><span class="tag" style="align-self:flex-start">${SKL[s.skill]||""}</span><h3>${esc(s.title)}</h3><p>${esc(s.description)}</p><div><a class="btn s" href="#/play/${s.id}">Start</a></div></div>`).join("")}</div>`:'<div class="empty">No scenarios yet.</div>'))}
function rpHtml(){const n=RP.s.data.nodes[RP.cur];
  if(n.end)return `<div class="ok"><h3 style="font-size:22px">Scenario complete</h3><p>${esc(n.text)}</p><div id="rpres" class="hint">Scoring…</div></div>`;
  return `<div class="ok"><p class="hint" style="margin:0 0 6px">Step ${RP.path.length+1}</p><h3 style="font-size:20px;line-height:1.4">${esc(n.text)}</h3>${n.choices.map((c,i)=>`<button class="btn o" style="display:block;width:100%;text-align:left;margin-top:10px;border-radius:16px;justify-content:flex-start" data-act="rpc" data-i="${i}">${esc(c.text)}</button>`).join("")}</div>`}
async function play(){
  const{data:s}=await sb.from("scenarios").select("*").eq("id",hid()).maybeSingle();
  if(!s)return shell("roleplay",'<div class="empty">Scenario not found.</div>');
  RP={s,cur:s.data.start,path:[]};
  return shell("roleplay",hero("Roleplay",esc(s.title),esc(s.description))+`<div id="rp">${rpHtml()}</div>`)}

/* ---------- pitch coach ---------- */
let REC=null;
const pitchCard=a=>`<div class="ok"><div class="row"><b>${when(a.created_at)}</b><span class="hint">${a.words} words${a.wpm?" · "+a.wpm+" wpm":""} · ${a.fillers} filler words</span></div><div class="stats" style="margin:12px 0"><div><b>${a.clarity}</b>Clarity</div><div><b>${a.confidence}</b>Confidence</div><div><b>${a.tone}</b>Tone</div></div><ul style="margin:0 0 8px;padding-left:20px">${(a.tips||[]).map(t=>`<li>${esc(t)}</li>`).join("")}</ul>${a.improved?`<p class="hint"><b>A stronger version:</b> ${esc(a.improved)}</p>`:""}</div>`;
async function coach(){
  const pa=await q(sb.from("pitch_attempts").select("*").eq("user_id",me.id).order("created_at",{ascending:false}).limit(5));
  REC=null;
  return shell("coach",hero("Pitch coach","Practise your 60-second pitch","Record your voice or type your answer. You get scores for clarity, confidence and tone, a filler word count and tips.")+
  `<div class="ok"><form data-form="pitch"><label style="margin-top:0">Your pitch or interview answer</label><textarea name="text" rows="5" placeholder="Type here, or record your voice below"></textarea><div class="row" style="justify-content:flex-start;gap:12px;margin-top:12px"><button type="button" class="btn o s" data-act="rec">Record voice</button><span class="hint" id="rectime"></span></div><div class="err"></div><button class="btn" style="margin-top:12px">Get feedback</button></form></div><div id="pres"></div>
  <h2 style="margin:30px 0 8px">Recent attempts</h2>${pa.length?pa.map(pitchCard).join(""):'<div class="empty">No attempts yet.</div>'}`)}

/* ---------- journal ---------- */
const CHAL=["Greet three people today by name and with a smile.","Give one person genuine, specific appreciation.","Listen to someone for five minutes without interrupting.","Ask a question you were afraid to ask.","Say no politely to something that does not serve you.","Summarise a conversation back to the person to check you understood.","Admit a mistake out loud and say what you will do next.","Ask a classmate or colleague for honest feedback on one thing.","Introduce yourself to someone new.","Disagree respectfully with an idea and explain why.","Help someone without being asked.","Speak first in a meeting or class discussion.","Notice your body language for an hour and fix one habit.","Write down a fear about speaking up and one small step against it.","Thank someone who rarely gets thanked.","Pause for three seconds before answering a hard question.","Give feedback to someone using a kind opening and one clear suggestion.","Share a small win with someone.","Ask someone about their goals and listen closely.","Practise your 60-second pitch out loud.","Reflect on what you have changed in 21 days and plan the next step."];
async function journal(){
  const es=await q(sb.from("journal_entries").select("*").eq("user_id",me.id).order("day",{ascending:false}));
  const days=es.map(e=>e.day),st=streakOf(days),done=days.includes(today()),ch=done?es[0].challenge:CHAL[Math.min(es.length,20)];
  return shell("journal",hero("Journal","21-day soft skill streak","One small challenge a day. Write what happened and what you learned.")+
  `<div class="ok" style="margin-top:0"><div class="row"><b>Day ${Math.min(es.length+(done?0:1),21)} of 21</b><span class="tag k">${st} day streak</span></div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin:14px 0">${Array.from({length:21},(_,i)=>`<span style="width:22px;height:22px;border-radius:50%;background:${i<es.length?"#0A0A0A":"#e4e4e7"}"></span>`).join("")}</div>
  ${done?`<p><b>Today's challenge:</b> ${esc(ch)}</p><p class="hint">Done for today. Come back tomorrow to keep your streak.</p>`:`<form data-form="jentry"><p><b>Today's challenge:</b> ${esc(ch)}</p><input type="hidden" name="challenge" value="${esc(ch)}"><label>Your reflection</label><textarea name="note" rows="4" required placeholder="What did you do, and how did it feel?"></textarea><div class="err"></div><button class="btn" style="margin-top:12px">Save reflection</button></form>`}</div>`+
  (es.length?`<h2 style="margin:28px 0 8px">Past reflections</h2>${es.map(e=>`<div class="item"><div class="t"><b>${esc(e.challenge)}</b><span class="hint">${e.day}</span><div style="margin-top:4px">${esc(e.note)}</div></div></div>`).join("")}`:""))}

/* ---------- practice rooms ---------- */
async function practice(){
  const sl=await q(sb.from("practice_slots").select("*").gte("starts_at",new Date(Date.now()-36e5).toISOString()).order("starts_at"));
  const nm=await names(sl.flatMap(x=>[x.host_id,x.guest_id]));
  const row=x=>{const mine=x.host_id===me.id,inn=mine||x.guest_id===me.id;
    return `<div class="item"><div class="t"><b>${esc(x.kind)}: ${esc(x.topic)}</b><span class="hint">${when(x.starts_at)} · host ${first(nm[x.host_id])}${x.guest_id?" · partner "+first(nm[x.guest_id]):" · open seat"}</span></div>${inn?`<a class="btn s" target="_blank" rel="noopener" href="https://meet.jit.si/softskill-${x.room}">Open room</a>`:x.guest_id?'<span class="tag d">Full</span>':`<button class="btn s" data-act="pjoin" data-id="${x.id}">Join</button>`}${mine?`<button class="btn s o" data-act="del" data-t="practice_slots" data-id="${x.id}">Cancel</button>`:""}</div>`};
  return shell("practice",hero("Practice rooms","Peer mock interviews","Book a 15-minute slot or join a classmate. Each slot gets its own free video room.")+
  `<div class="ok" style="margin-top:0"><h3 style="font-size:20px">Offer a practice slot</h3><form data-form="pslot"><div class="two"><div><label>Type</label><select name="kind"><option>Mock interview</option><option>Public speaking</option></select></div><div><label>Date and time</label><input name="starts_at" type="datetime-local" required></div></div><label>Topic</label><input name="topic" required maxlength="80" placeholder="e.g. Tell me about yourself"><div class="err"></div><button class="btn s" style="margin-top:12px">Create slot</button></form></div>
  <h2 style="margin:28px 0 4px">Upcoming slots</h2>${sl.length?sl.map(row).join(""):'<div class="empty" style="margin-top:12px">No slots yet. Create the first one.</div>'}`)}

/* ---------- certificates ---------- */
const loadQR=()=>new Promise(r=>{if(window.qrcode)return r();const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js";s.onload=r;s.onerror=r;document.head.appendChild(s)});
async function certs(){
  const [cs,mods,pr,ce,pays]=await Promise.all([q(sb.from("courses").select("*").order("position")),q(sb.from("lessons").select("id,course_id").eq("kind","module")),q(sb.from("lesson_progress").select("lesson_id").eq("user_id",me.id)),q(sb.from("certificates").select("*").eq("user_id",me.id)),myPays()]);
  const done=new Set(pr.map(x=>x.lesson_id)),rows=cs.filter(c=>!c.is_bundle&&approvedFor(c,pays)).map(c=>{
    const m=mods.filter(x=>x.course_id===c.id),pct=m.length?Math.round(m.filter(x=>done.has(x.id)).length/m.length*100):0,ct=ce.find(x=>x.course_id===c.id);
    return `<div class="item"><div class="t"><b>${esc(c.title)}</b><div class="bar" style="margin:8px 0 0"><i style="width:${pct}%"></i></div><span class="hint">${m.length?pct+"% of modules complete":"No modules yet"}</span></div>${ct?`<a class="btn s" href="#/cert/${ct.code}">View certificate</a>`:pct===100?`<button class="btn s" data-act="claim" data-id="${c.id}">Get certificate</button>`:'<span class="tag d">Locked</span>'}</div>`}).join("");
  return shell("certs",hero("Certificates","Your certificates","Finish every module in a course to earn a certificate with a QR code anyone can verify.")+(rows||'<div class="empty">Unlock a course to start earning certificates.</div>'))}
async function cert(){
  const code=hid(),{data:c}=await sb.from("certificates").select("*,courses(title)").eq("code",code).eq("user_id",me.id).maybeSingle();
  if(!c)return '<div class="auth" style="margin-top:60px"><h1>Not found</h1><p>This certificate does not exist on your account.</p></div>';
  await loadQR();let qr="";const url=location.origin+"/#/verify/"+code;
  try{const g=qrcode(0,"M");g.addData(url);g.make();qr=g.createSvgTag({cellSize:3,margin:0})}catch(e){}
  return `<div class="certwrap"><div class="cert"><span class="eyebrow" style="background:#0A0A0A;color:#fff">softskill</span><p class="hint" style="margin:18px 0 0">Certificate of completion</p><h1>${esc(prof?.full_name||me.email.split("@")[0])}</h1><p class="hint">has successfully completed</p><h2>${esc(c.courses?.title)}</h2>
  <div class="certfoot"><div><b>${new Date(c.issued_at).toLocaleDateString("en-PK",{dateStyle:"long"})}</b><span>Date issued</span></div><div style="width:84px">${qr}</div><div><b>${code}</b><span>Verification ID</span></div></div><p class="hint" style="margin:18px 0 0;font-size:12px">Verify at ${esc(url)}</p></div>
  <div class="noprint"><button class="btn" data-act="print">Print or save as PDF</button> <a class="btn o" href="#/certs">Back</a></div></div>`}
async function verify(){
  const code=hid();let r={valid:false};try{r=await(await fetch("/api/verify-cert?code="+encodeURIComponent(code))).json()}catch(e){}
  return `<div class="auth" style="margin-top:60px">${r.valid?`<h1>Certificate verified</h1><p><b>${esc(r.name)}</b> completed <b>${esc(r.course)}</b> on ${new Date(r.issued_at).toLocaleDateString("en-PK",{dateStyle:"long"})}.</p><p class="hint">ID ${esc(code)}</p>`:'<h1>Not found</h1><p>We could not find a certificate with this ID.</p>'}</div>`}

/* ---------- lesson Q&A ---------- */
async function showThread(id){
  const cs=await q(sb.from("lesson_comments").select("*").eq("lesson_id",id).order("created_at")),nm=await names(cs.map(c=>c.user_id));
  $("#dbody").innerHTML=`<h2>Questions and answers</h2><div style="max-height:46vh;overflow:auto;margin:12px 0">${cs.length?cs.map(c=>`<div class="item" style="box-shadow:none"><div class="t"><b>${esc(nm[c.user_id]||"Student")}</b><span class="hint">${when(c.created_at)}</span><div>${esc(c.body)}</div></div>${c.user_id===me.id||prof?.is_admin?`<button class="btn s o" data-act="delc" data-id="${c.id}" data-l="${id}">Delete</button>`:""}</div>`).join(""):'<div class="empty">No questions yet. Ask the first one.</div>'}</div>
  <form data-form="comment" data-id="${id}"><textarea name="body" rows="2" maxlength="1000" required placeholder="Ask a question or share what you learned"></textarea><div class="err"></div><div class="row" style="margin-top:10px"><button type="button" class="btn o" data-act="close">Close</button><button class="btn">Post</button></div></form>`;
  if(!dlg.open)dlg.showModal()}

/* ---------- admin: roleplay scenarios ---------- */
async function adminRP(){
  const ss=await q(sb.from("scenarios").select("id,title,skill").order("created_at",{ascending:false}));
  return `<p class="sub" style="margin-top:18px">Describe a situation and AI writes a branching roleplay for students. Preview it, and delete it if it is not good enough.</p>
  <div class="ok"><form data-form="airp"><label style="margin-top:0">Situation</label><textarea name="topic" rows="3" required placeholder="e.g. A teammate keeps missing deadlines and you are the team lead"></textarea><label>Main skill</label><select name="skill">${SK.map(([k,l])=>`<option value="${k}">${l}</option>`).join("")}</select><div class="err"></div><button class="btn s" style="margin-top:12px">Generate scenario</button></form></div>
  <h3 style="font-size:22px;margin:30px 0 8px">Scenarios</h3>${ss.length?`<div class="scroll"><table><tr><th>Title</th><th>Skill</th><th></th></tr>${ss.map(s=>`<tr><td>${esc(s.title)}</td><td>${SKL[s.skill]||""}</td><td><a class="btn s o" href="#/play/${s.id}">Preview</a> <button class="btn s o" data-act="del" data-t="scenarios" data-id="${s.id}">Delete</button></td></tr>`).join("")}</table></div>`:'<div class="empty">No scenarios.</div>'}`}

/* ---------- handlers ---------- */
const HX={
  async pitch(f,d){let body={text:d.get("text")};
    if(REC&&REC.blob){if(REC.blob.size>2.5e6)return err(f,"Recording too long. Keep it under 90 seconds.");
      const b64=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result.split(",")[1]);fr.readAsDataURL(REC.blob)});
      body={audio:b64,mime:REC.blob.type,seconds:REC.secs}}
    else if(d.get("text").trim().length<20)return err(f,"Type a couple of sentences, or record your voice.");
    const r=await api("pitch-coach",body);REC=null;
    $("#pres").innerHTML=`<h2 style="margin:26px 0 8px">Your feedback</h2><div class="ok" style="margin-top:0"><p class="hint" style="margin:0">What we heard</p><p style="margin:4px 0 0">${esc(r.transcript)}</p></div>`+pitchCard({...r,created_at:new Date().toISOString()});
    f.querySelector("button:not([type=button])").disabled=false},
  async jentry(f,d){const{error}=await sb.from("journal_entries").insert({user_id:me.id,day:today(),challenge:d.get("challenge"),note:d.get("note")});
    if(error)return err(f,error.code==="23505"?"You already saved today's reflection.":error.message);toast("Saved. Keep the streak going!");go()},
  async pslot(f,d){const room=[...crypto.getRandomValues(new Uint8Array(8))].map(b=>b.toString(16).padStart(2,"0")).join("");
    const{error}=await sb.from("practice_slots").insert({host_id:me.id,kind:d.get("kind"),topic:d.get("topic"),starts_at:new Date(d.get("starts_at")).toISOString(),room});
    if(error)return err(f,error.message);toast("Slot created");go()},
  async comment(f,d){const{error}=await sb.from("lesson_comments").insert({lesson_id:f.dataset.id,user_id:me.id,body:d.get("body")});
    if(error)return err(f,error.message);await showThread(f.dataset.id)},
  async airp(f,d){const r=await api("ai-scenario",{topic:d.get("topic"),skill:d.get("skill")},AC());
    const{error}=await sb.from("scenarios").insert({title:r.title,description:r.description,skill:r.skill,data:{start:r.start,nodes:r.nodes}});
    if(error)return err(f,error.message);toast("Scenario added");go()}
};
const AX={
  async rpc(el){const n=RP.s.data.nodes[RP.cur],i=+el.dataset.i;RP.path.push([RP.cur,i]);RP.cur=n.choices[i].next;$("#rp").innerHTML=rpHtml();
    if(RP.s.data.nodes[RP.cur].end){try{const r=await api("roleplay-submit",{scenario_id:RP.s.id,path:RP.path});
      $("#rpres").innerHTML=(SK.filter(([k])=>r.scores[k]).map(([k,l])=>`<div class="row" style="padding:6px 0"><b>${l}</b><span>+${r.scores[k]}</span></div>`).join("")||"No points this time.")+`<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn s" data-act="again">Play again</button><a class="btn s o" href="#/skills">See radar</a><a class="btn s o" href="#/roleplay">More scenarios</a></div>`}
      catch(e){$("#rpres").textContent=e.message}}},
  again:()=>go(),
  async rec(el){if(REC&&REC.state==="recording"){REC.stop();return}
    try{const st=await navigator.mediaDevices.getUserMedia({audio:true}),ch=[],t0=Date.now();REC=new MediaRecorder(st);
      REC.ondataavailable=e=>ch.push(e.data);
      REC.onstop=()=>{st.getTracks().forEach(t=>t.stop());clearInterval(REC.tm);REC.blob=new Blob(ch,{type:REC.mimeType});REC.secs=Math.round((Date.now()-t0)/1000);el.textContent="Re-record";$("#rectime").textContent="Recorded "+REC.secs+"s. Press Get feedback."};
      REC.start();el.textContent="Stop";REC.tm=setInterval(()=>{const s=Math.round((Date.now()-t0)/1000);$("#rectime").textContent=s+"s";if(s>=90)REC.stop()},500)}
    catch(e){toast("Microphone access was blocked.")}},
  async pjoin(el){const{data,error}=await sb.from("practice_slots").update({guest_id:me.id}).eq("id",el.dataset.id).is("guest_id",null).select("id");
    if(error)return toast(error.message);toast(data.length?"You joined this slot":"Sorry, that seat was just taken");go()},
  async claim(el){el.disabled=true;try{const r=await api("issue-cert",{course_id:el.dataset.id});location.hash="#/cert/"+r.code}catch(e){el.disabled=false;toast(e.message)}},
  print:()=>window.print(),
  thread:el=>showThread(el.dataset.id),
  async delc(el){const{error}=await sb.from("lesson_comments").delete().eq("id",el.dataset.id);if(error)return toast(error.message);showThread(el.dataset.l)}
};
const EXTRA={skills,roleplay,play,coach,journal,practice,certs,cert,verify};
function install(){Object.assign(H,HX);Object.assign(A,AX);
  const st=document.createElement("style");st.textContent=`.certwrap{max-width:900px;margin:30px auto;padding:0 12px}.cert{background:#fff;border:10px double #0A0A0A;border-radius:6px;padding:46px 36px;text-align:center;box-shadow:var(--sh)}.cert h1{font-size:clamp(30px,6vw,52px);margin:10px 0}.cert h2{font-size:clamp(20px,4vw,30px);margin:8px 0 26px}.certfoot{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap}.certfoot b{display:block}.certfoot span{font-size:12px;color:var(--g)}.noprint{text-align:center;margin-top:20px}@media print{.nav,.foot,.noprint,#toast{display:none!important}body{background:#fff!important}.cert{box-shadow:none}@page{size:A4 landscape;margin:12mm}}`;
  document.head.appendChild(st)}
