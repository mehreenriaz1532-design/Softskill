// softskill course builder (instructors and admins): sections, drag-and-drop order, draft/publish, release dates, duplicate.
// Loaded after lms.js; relies on helpers from the other scripts (sb, me, prof, q, esc, when, pkr, api, toast, go, hid, hero, err, safe, localDT, AC, H, A, dlg ...).
const staffOk=()=>prof?.is_admin||prof?.is_instructor;
const tshell=inner=>`<div class="dash"><aside class="side"><a href="#/teach" class="on">${ic("cap")}<span>Teach</span></a><a href="#/app">${ic("book")}<span>Student view</span></a></aside><div class="body">${inner}</div></div>`;

// Used by the student course page: order lessons by section, and show a heading where the section changes.
const secSort=SEC=>{const ix=Object.fromEntries(SEC.map((s,i)=>[s.id,i])),k=l=>l.section_id&&ix[l.section_id]!==undefined?ix[l.section_id]:9999;return (a,b)=>k(a)-k(b)||a.position-b.position};
const secHead=(l,prev,SEC)=>{if(!SEC.length)return "";if(prev&&prev.section_id===l.section_id)return "";
  const t=SEC.find(s=>s.id===l.section_id)?.title||"More";return `<h3 style="font-size:17px;margin:22px 0 2px;color:var(--g)">${esc(t)}</h3>`};

AUTH.push("teach");
async function teach(){
  if(!staffOk())return shell("app",'<div class="empty">Teaching tools are for instructors. Ask the admin to give you the instructor role.</div>');
  return hid()?builder(hid()):teachHome()}

async function teachHome(){
  let qy=sb.from("courses").select("*").order("created_at",{ascending:false});
  if(!prof.is_admin)qy=qy.eq("owner_id",me.id);
  const [cs,ls]=await Promise.all([q(qy),q(sb.from("lessons").select("course_id"))]);
  const n=id=>ls.filter(l=>l.course_id===id).length;
  return tshell(hero("Teach","Course builder","Create a course, organise it into sections, set release dates, then publish it when it is ready.")+
  `<div class="ok" style="margin-top:0"><h3 style="font-size:20px">New course</h3><form data-form="newcourse"><div class="two"><div><label>Title</label><input name="title" required maxlength="120"></div><div><label>Price (PKR, 0 for free)</label><input name="price" type="number" min="0" value="0"></div></div><label>Description</label><textarea name="description" rows="2"></textarea><div class="err"></div><button class="btn s" style="margin-top:12px">${ic("sparkles",14)}Create draft</button></form></div>
  <h2 style="margin:28px 0 10px">${prof.is_admin?"All courses":"My courses"}</h2>`+
  (cs.length?cs.map(c=>`<div class="item"><div class="t"><b>${esc(c.title)}</b><span class="hint">${n(c.id)} lessons · ${pkr(c.price)}</span></div>${c.status==="draft"?'<span class="tag d">Draft</span>':'<span class="tag k">Published</span>'}<a class="btn s" href="#/teach/${c.id}">Open builder</a></div>`).join(""):'<div class="empty">You have no courses yet. Create your first draft above.</div>'))}

async function builder(id){
  const [{data:c},secs,ls,ins]=await Promise.all([
    sb.from("courses").select("*").eq("id",id).maybeSingle(),
    q(sb.from("sections").select("*").eq("course_id",id).order("position")),
    q(sb.from("lessons").select("*").eq("course_id",id).order("position")),
    prof.is_admin?q(sb.from("profiles").select("id,full_name").eq("is_instructor",true)):Promise.resolve([])]);
  if(!c||(!prof.is_admin&&c.owner_id!==me.id))return tshell('<div class="empty">Course not found, or it belongs to another instructor.</div>');
  const inSec=new Set(secs.map(s=>s.id)),loose=ls.filter(l=>!l.section_id||!inSec.has(l.section_id));
  const lrow=l=>`<div class="lrow" draggable="true" data-lid="${l.id}" data-sec="${l.section_id||""}" data-pos="${l.position}"><span class="grip" title="Drag to reorder">⋮⋮</span><div class="t"><b>${esc(l.title)}</b><span class="hint">${l.kind}${l.is_free?" · free preview":""}${l.release_at?" · opens "+when(l.release_at):""}</span></div><span class="mv"><button class="btn s o" data-act="mv" data-d="-1" aria-label="Move up">↑</button><button class="btn s o" data-act="mv" data-d="1" aria-label="Move down">↓</button></span><button class="btn s o" data-act="ledit" data-id="${l.id}">Edit</button><button class="btn s o" data-act="del" data-t="lessons" data-id="${l.id}">Delete</button></div>`;
  const box=(s,list)=>`<div class="secbox" data-sid="${s?s.id:"none"}" data-pos="${s?s.position:""}"><div class="sechead">${s?`<span class="grip sgrip" draggable="true" title="Drag to reorder this section">⋮⋮</span><b>${esc(s.title)}</b><span class="mv"><button class="btn s o" data-act="mv" data-d="-1" aria-label="Move section up">↑</button><button class="btn s o" data-act="mv" data-d="1" aria-label="Move section down">↓</button></span><button class="btn s o" data-act="secrename" data-id="${s.id}">Rename</button><button class="btn s o" data-act="secdel" data-id="${s.id}">Delete</button>`:`<b>Unsorted lessons</b><span class="hint">Drag a lesson into a section</span>`}</div><div class="lbody">${list.map(lrow).join("")}</div></div>`;
  const opts=secs.map(s=>`<option value="${s.id}">${esc(s.title)}</option>`).join("");
  return tshell(`<div class="banner"><div><span class="eyebrow">${c.status==="draft"?"Draft":"Published"}</span><h1>${esc(c.title)}</h1><p>${ls.length} lessons in ${secs.length} sections. ${c.status==="draft"?"Students cannot see this course yet.":"Students can see this course."}</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ${c.status==="draft"?"":"o"}" data-act="pubtoggle" data-id="${id}" data-to="${c.status==="draft"?"published":"draft"}">${c.status==="draft"?"Publish course":"Unpublish"}</button><a class="btn o" href="#/course/${id}">Preview as student</a></div></div>
  <div class="ok" style="margin-top:0"><h3 style="font-size:20px">Course details</h3><form data-form="csettings" data-id="${id}"><div class="two"><div><label>Title</label><input name="title" required maxlength="120" value="${esc(c.title)}"></div><div><label>Price (PKR, 0 for free)</label><input name="price" type="number" min="0" value="${c.price}"></div></div><label>Description</label><textarea name="description" rows="2">${esc(c.description||"")}</textarea>${prof.is_admin?`<label>Owner (the instructor who manages this course)</label><select name="owner_id"><option value="${me.id}">Me (admin)</option>${ins.map(i=>`<option value="${i.id}" ${i.id===c.owner_id?"selected":""}>${esc(i.full_name||"Instructor")}</option>`).join("")}</select>`:""}<div class="err"></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn s">Save details</button><button type="button" class="btn s o" data-act="dupcourse" data-id="${id}">Duplicate course</button><button type="button" class="btn s o" data-act="cdel" data-id="${id}">Delete course</button></div></form></div>
  <h2 style="margin:30px 0 4px">Sections and lessons</h2><p class="sub" style="margin-top:0">Drag the dots to reorder lessons and sections (or use the arrows). Changes save automatically.</p>
  <div id="secs">${secs.map(s=>box(s,ls.filter(l=>l.section_id===s.id))).join("")}${box(null,loose)}</div>
  <form data-form="addsec" data-id="${id}" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><input name="title" placeholder="New section title, e.g. Week 1" required maxlength="80" style="flex:1;min-width:200px"><button class="btn s">Add section</button><div class="err" style="flex-basis:100%"></div></form>
  <details class="ok"><summary>${ic("file",16)} Add a lesson, PDF note or link</summary><form data-form="addles" data-cid="${id}"><div class="two"><div><label>Type</label><select name="kind"><option value="module">Video module</option><option value="note">PDF note</option><option value="link">Link</option></select></div><div><label>Section</label><select name="section_id"><option value="">Unsorted</option>${opts}</select></div></div><label>Title</label><input name="title" required maxlength="120"><label>Link (YouTube, Vimeo or any website)</label><input name="url" type="url" placeholder="https://"><label>Or upload a PDF</label><input name="file" type="file" accept="application/pdf"><label>Opens on (optional, leave empty to open straight away)</label><input name="release_at" type="datetime-local"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="is_free" style="width:auto"> Free preview</label><div class="err"></div><button class="btn s" style="margin-top:12px">Add lesson</button></form></details>
  <div class="ok"><h3 style="font-size:20px">${ic("sparkles",16)} AI: arrange my notes</h3><p class="hint">Paste raw notes, links or a lesson list. AI turns it into lessons that you can then drag into sections.</p><form data-form="aicourse"><input type="hidden" name="course_id" value="${id}"><textarea name="text" rows="5" required></textarea><div class="err"></div><button class="btn s" style="margin-top:10px">Arrange with AI</button></form><div id="plan"></div></div>`)}

/* ---------- saving the order after a drag or an arrow click ---------- */
async function saveOrder(){
  const ups=[];
  document.querySelectorAll("#secs > [data-sid]").forEach((bx,bi)=>{
    const sid=bx.dataset.sid;
    if(sid!=="none"&&bx.dataset.pos!==String(bi+1)){ups.push(sb.from("sections").update({position:bi+1}).eq("id",sid));bx.dataset.pos=String(bi+1)}
    bx.querySelectorAll("[data-lid]").forEach((l,i)=>{const ns=sid==="none"?"":sid;
      if(l.dataset.sec!==ns||l.dataset.pos!==String(i+1)){ups.push(sb.from("lessons").update({section_id:ns||null,position:i+1}).eq("id",l.dataset.lid));l.dataset.sec=ns;l.dataset.pos=String(i+1)}})});
  if(!ups.length)return;
  const rs=await Promise.all(ups),bad=rs.find(r=>r.error);toast(bad?bad.error.message:"Order saved")}
const afterEl=(box,y,sel)=>[...box.querySelectorAll(sel)].find(el=>{const r=el.getBoundingClientRect();return y<r.top+r.height/2})||null;
let DRAG=null;

/* ---------- handlers ---------- */
const HT={
  async newcourse(f,d){const{data,error}=await sb.from("courses").insert({title:d.get("title"),description:d.get("description"),price:+d.get("price")||0,owner_id:me.id,status:"draft",position:Date.now()%100000}).select("id").single();
    if(error)return err(f,error.message);location.hash="#/teach/"+data.id},
  async csettings(f,d){const o={title:d.get("title"),description:d.get("description"),price:+d.get("price")||0};if(prof.is_admin&&d.get("owner_id"))o.owner_id=d.get("owner_id");
    const{error}=await sb.from("courses").update(o).eq("id",f.dataset.id);if(error)return err(f,error.message);toast("Saved");go()},
  async addsec(f,d){const id=f.dataset.id,{data:mx}=await sb.from("sections").select("position").eq("course_id",id).order("position",{ascending:false}).limit(1);
    const{error}=await sb.from("sections").insert({course_id:id,title:d.get("title"),position:(mx?.[0]?.position||0)+1});if(error)return err(f,error.message);go()},
  async addles(f,d){const cid=f.dataset.cid,file=d.get("file");let fp=null;
    if(file&&file.size){fp=`${cid}/${Date.now()}-${safe(file.name)}`;const{error}=await sb.storage.from("notes").upload(fp,file);if(error)return err(f,error.message)}
    const{data:mx}=await sb.from("lessons").select("position").eq("course_id",cid).order("position",{ascending:false}).limit(1);
    const{data:l,error}=await sb.from("lessons").insert({course_id:cid,section_id:d.get("section_id")||null,kind:d.get("kind"),title:d.get("title"),is_free:d.get("is_free")==="on",position:(mx?.[0]?.position||0)+1,release_at:d.get("release_at")?new Date(d.get("release_at")).toISOString():null}).select("id").single();
    if(error)return err(f,error.message);
    if(d.get("url")||fp){const r=await sb.from("lesson_secrets").insert({lesson_id:l.id,url:d.get("url")||null,file_path:fp});if(r.error)return err(f,r.error.message)}
    toast("Lesson added");go()},
  async ledit(f,d){const id=f.dataset.id,{error}=await sb.from("lessons").update({title:d.get("title"),section_id:d.get("section_id")||null,is_free:d.get("is_free")==="on",release_at:d.get("release_at")?new Date(d.get("release_at")).toISOString():null}).eq("id",id);
    if(error)return err(f,error.message);
    const r=await sb.from("lesson_secrets").upsert({lesson_id:id,url:d.get("url")||null});if(r.error)return err(f,r.error.message);
    dlg.close();toast("Saved");go()}
};
const AT={
  mv(el){const row=el.closest("[data-lid]")||el.closest("[data-sid]"),d=+el.dataset.d,sib=d<0?row.previousElementSibling:row.nextElementSibling;
    if(!sib)return;
    if(row.dataset.lid){if(!sib.dataset.lid)return}else if(row.dataset.sid==="none"||!sib.dataset.sid||sib.dataset.sid==="none")return;
    d<0?sib.before(row):sib.after(row);saveOrder()},
  async secrename(el){const{data:s}=await sb.from("sections").select("title").eq("id",el.dataset.id).single(),t=prompt("Section name:",s?.title||"");
    if(!t||!t.trim())return;const{error}=await sb.from("sections").update({title:t.trim()}).eq("id",el.dataset.id);if(error)return toast(error.message);go()},
  async secdel(el){if(!confirm("Delete this section? Its lessons are kept and moved to Unsorted."))return;
    const{error}=await sb.from("sections").delete().eq("id",el.dataset.id);if(error)return toast(error.message);toast("Section deleted");go()},
  async pubtoggle(el){const to=el.dataset.to;
    if(to==="published"){const{count}=await sb.from("lessons").select("id",{count:"exact",head:true}).eq("course_id",el.dataset.id);if(!count&&!confirm("This course has no lessons yet. Publish anyway?"))return}
    const{error}=await sb.from("courses").update({status:to}).eq("id",el.dataset.id);if(error)return toast(error.message);toast(to==="published"?"Course published":"Course is now a draft");go()},
  async cdel(el){if(!confirm("Delete this whole course with all its lessons? This cannot be undone."))return;
    const{error}=await sb.from("courses").delete().eq("id",el.dataset.id);if(error)return toast(error.message);toast("Course deleted");location.hash="#/teach"},
  async dupcourse(el){el.disabled=true;const id=el.dataset.id;
    try{const[{data:c},secs,ls]=await Promise.all([sb.from("courses").select("*").eq("id",id).single(),q(sb.from("sections").select("*").eq("course_id",id)),q(sb.from("lessons").select("*").eq("course_id",id))]);
      const{data:n,error}=await sb.from("courses").insert({title:c.title+" (copy)",description:c.description,price:c.price,owner_id:me.id,status:"draft",position:Date.now()%100000}).select("id").single();if(error)throw error;
      const map={};for(const s of secs){const{data:ns,error:e}=await sb.from("sections").insert({course_id:n.id,title:s.title,position:s.position}).select("id").single();if(e)throw e;map[s.id]=ns.id}
      await Promise.all(ls.map(async l=>{const{data:nl,error:e}=await sb.from("lessons").insert({course_id:n.id,section_id:l.section_id?map[l.section_id]:null,kind:l.kind,title:l.title,is_free:l.is_free,position:l.position,release_at:l.release_at}).select("id").single();if(e)throw e;
        const{data:sc}=await sb.from("lesson_secrets").select("url,file_path").eq("lesson_id",l.id).maybeSingle();if(sc)await sb.from("lesson_secrets").insert({lesson_id:nl.id,url:sc.url,file_path:sc.file_path})}));
      toast("Copied as a draft");location.hash="#/teach/"+n.id}
    catch(e){el.disabled=false;toast(e.message||"Could not copy the course")}},
  async ledit(el){const id=el.dataset.id,[{data:l},{data:s}]=await Promise.all([sb.from("lessons").select("*").eq("id",id).single(),sb.from("lesson_secrets").select("url").eq("lesson_id",id).maybeSingle()]);
    const secs=await q(sb.from("sections").select("id,title").eq("course_id",l.course_id).order("position"));
    $("#dbody").innerHTML=`<h2 style="font-size:22px">Edit lesson</h2><form data-form="ledit" data-id="${id}"><label>Title</label><input name="title" required maxlength="120" value="${esc(l.title)}"><label>Section</label><select name="section_id"><option value="">Unsorted</option>${secs.map(x=>`<option value="${x.id}" ${x.id===l.section_id?"selected":""}>${esc(x.title)}</option>`).join("")}</select><label>Link</label><input name="url" type="url" value="${esc(s?.url||"")}" placeholder="https://"><label>Opens on (optional)</label><input name="release_at" type="datetime-local" value="${l.release_at?localDT(l.release_at):""}"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="is_free" style="width:auto" ${l.is_free?"checked":""}> Free preview</label><div class="err"></div><div class="row" style="margin-top:14px"><button type="button" class="btn o" data-act="close">Cancel</button><button class="btn">Save changes</button></div></form>`;dlg.showModal()},
  async role(el){const on=el.dataset.i==="1";if(on&&!confirm("Give this person the instructor role? They will be able to create and edit their own courses."))return;
    try{await api("set-role",{user_id:el.dataset.id,instructor:on},AC());toast(on?"Instructor role given":"Instructor role removed");go()}catch(e){toast(e.message)}}
};

/* ---------- wire in ---------- */
EXTRA.teach=teach;
const _install2=install;
install=function(){_install2();Object.assign(H,HT);Object.assign(A,AT);
  document.addEventListener("dragstart",e=>{
    const l=e.target.closest&&e.target.closest("[data-lid]");
    if(l){DRAG={t:"l",el:l};l.classList.add("dragging");e.dataTransfer.effectAllowed="move";try{e.dataTransfer.setData("text/plain",l.dataset.lid)}catch(x){}return}
    const g=e.target.closest&&e.target.closest(".sgrip");
    if(g){const b=g.closest("[data-sid]");DRAG={t:"s",el:b};b.classList.add("dragging");e.dataTransfer.effectAllowed="move";try{e.dataTransfer.setData("text/plain","section")}catch(x){}}});
  document.addEventListener("dragover",e=>{
    if(!DRAG)return;const bx=e.target.closest&&e.target.closest("[data-sid]");if(!bx)return;
    if(DRAG.t==="l"){e.preventDefault();const body=bx.querySelector(".lbody"),a=afterEl(body,e.clientY,"[data-lid]:not(.dragging)");a?a.before(DRAG.el):body.appendChild(DRAG.el)}
    else if(bx!==DRAG.el&&bx.dataset.sid!=="none"){e.preventDefault();const wrap=bx.parentElement,a=afterEl(wrap,e.clientY,".secbox:not(.dragging):not([data-sid=none])");a?a.before(DRAG.el):wrap.insertBefore(DRAG.el,wrap.querySelector('[data-sid="none"]'))}});
  document.addEventListener("drop",e=>{if(DRAG)e.preventDefault()});
  document.addEventListener("dragend",()=>{if(!DRAG)return;DRAG.el.classList.remove("dragging");DRAG=null;saveOrder()});
  const st=document.createElement("style");
  st.textContent=`.secbox{background:#fff;border:1px solid var(--l);border-radius:20px;box-shadow:var(--sh);margin-top:14px;padding:6px 12px 12px}.sechead{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 4px}.sechead b{flex:1;min-width:120px}.lbody{min-height:46px;display:flex;flex-direction:column;gap:8px;padding:2px 0}.lrow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 12px;background:#FAF8FF;border:1px solid var(--l);border-radius:14px}.lrow .t{flex:1;min-width:140px}.lrow .t b{display:block}.grip{cursor:grab;color:var(--g);user-select:none;padding:0 4px;letter-spacing:-2px}.dragging{opacity:.45}.mv{display:flex;gap:4px}details.ok summary{cursor:pointer;font-weight:600}details.ok[open] summary{margin-bottom:6px}`;
  document.head.appendChild(st)};
