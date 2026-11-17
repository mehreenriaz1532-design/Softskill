// softskills LMS extras: public catalog and policy pages, quizzes, assignments, video player with auto-complete,
// grading, payment CSV export, installable app. Loaded after skills.js and before the main script.
const CONTACT="mehreenriaz1532@gmail.com",UPDATED="14 November 2026";
const pg=(t,inner,d)=>`<div class="page"><h1>${t}</h1><p class="hint" style="margin:6px 0 0">Last updated ${d||UPDATED}</p>${inner}</div>`;
function textToHtml(t){const out=[];let ul=[];const flush=()=>{if(ul.length){out.push("<ul>"+ul.map(x=>`<li>${esc(x)}</li>`).join("")+"</ul>");ul=[]}};
  String(t).split(/\r?\n/).forEach(l=>{l=l.trim();if(!l){flush();return}if(l.startsWith("# ")){flush();out.push(`<h2>${esc(l.slice(2))}</h2>`)}else if(l.startsWith("- "))ul.push(l.slice(2));else{flush();out.push(`<p>${esc(l)}</p>`)}});flush();return out.join("")}
function htmlToText(h){const d=document.createElement("div");d.innerHTML=h;d.querySelectorAll("h1,.hint").forEach(e=>e.remove());
  d.querySelectorAll("h2,summary").forEach(e=>e.replaceWith("\n# "+e.textContent+"\n"));d.querySelectorAll("li").forEach(e=>e.replaceWith("\n- "+e.textContent));d.querySelectorAll("p").forEach(e=>e.replaceWith("\n"+e.textContent+"\n"));
  return d.textContent.replace(/\n{3,}/g,"\n\n").trim()}

/* ---------- policy pages (review the wording before you launch) ---------- */
const terms=()=>pg("Terms of Service",`
<h2>1. About softskills</h2><p>softskills is an online learning platform for soft skills, run by Mehreen Riaz ("we", "us"). By creating an account you agree to these terms.</p>
<h2>2. Your account</h2><p>Give accurate details, keep your password private, and use one account per person. Paid content may not be shared with others.</p>
<h2>3. Payments</h2><p>Prices are shown in Pakistani Rupees (PKR). Payment is made by manual transfer to the JazzCash, EasyPaisa or Raast account shown at checkout. After you submit your transaction ID and receipt, your payment is checked automatically and, if needed, by a person. Access is unlocked once it is approved, usually within a few hours. Fake, edited or reused receipts lead to rejection and may lead to account suspension.</p>
<h2>4. Course content</h2><p>You receive a personal, non-transferable licence to view the lessons, notes, quizzes and live classes you have unlocked. You may not copy, record, resell or redistribute them.</p>
<h2>5. Your contributions</h2><p>Comments, journal entries, assignment answers and pitch practice remain yours. You allow us to store and process them to run the platform. Comments and practice-room names are visible to other students.</p>
<h2>6. Conduct</h2><p>No harassment, spam, cheating or sharing of other people's private information. We may remove content or suspend accounts that break these rules.</p>
<h2>7. Certificates</h2><p>A certificate is issued when the course requirements are completed. We may revoke a certificate that was obtained by cheating.</p>
<h2>8. No guarantees</h2><p>The platform is provided "as is". We do not promise any job, grade or income as a result of taking a course. Our liability is limited to the amount you paid for the course concerned.</p>
<h2>9. Changes and law</h2><p>We may update these terms and will show the new date above. These terms are governed by the laws of Pakistan.</p>
<h2>10. Contact</h2><p>Questions: <a href="mailto:${CONTACT}">${CONTACT}</a></p>`);
const privacy=()=>pg("Privacy Policy",`
<h2>What we collect</h2><ul><li>Account details: name, email, city and university.</li><li>Learning activity: progress, quiz results, assignment answers, journal entries and certificates.</li><li>Payment details: your mobile number, transaction ID and receipt screenshot.</li><li>Speaking Coach: the text you type, or the transcript of a short voice recording.</li></ul>
<h2>How we use it</h2><p>To run your account, verify payments, unlock content, give feedback, issue certificates, and send emails such as confirmations, payment decisions and live class reminders.</p>
<h2>Who processes your data</h2><ul><li><b>Supabase</b> stores accounts, data and uploaded files.</li><li><b>Vercel</b> hosts the website.</li><li><b>Groq</b> processes receipt images, pitch recordings or text, and admin-pasted course material to produce AI checks and feedback.</li><li>An <b>email provider</b> delivers our emails.</li></ul><p>We do not sell your data.</p>
<h2>What others can see</h2><p>Your first name or full name appears in lesson Q&amp;A and mock interview rooms. Anyone who scans your certificate's QR code sees your name, the course and the issue date.</p>
<h2>Keeping it safe</h2><p>Data is encrypted in transit and protected by access rules so students can only read their own private records. Your login session is stored in your browser.</p>
<h2>Your choices</h2><p>You can ask us to show, correct or delete your data at any time by emailing <a href="mailto:${CONTACT}">${CONTACT}</a>. The platform is meant for people aged 16 and over.</p>`);
const refund=()=>pg("Refund Policy",`
<p>Our courses are digital and unlock as soon as your payment is approved, so refunds are limited as follows.</p>
<h2>You can request a refund if</h2><ul><li>you ask within <b>3 days</b> of your payment being approved, you have completed less than <b>20%</b> of the modules, and no certificate has been issued; or</li><li>you paid twice for the same course, or paid by mistake; or</li><li>your payment was not approved within 48 hours and you no longer want the course; or</li><li>a live class you paid for is cancelled and not rescheduled.</li></ul>
<h2>How to ask</h2><p>Email <a href="mailto:${CONTACT}">${CONTACT}</a> with your account email and transaction ID.</p>
<h2>How we pay you back</h2><p>Approved refunds go back to the same JazzCash or EasyPaisa account within 7 working days, and access to the course is removed.</p>`);
const faq=()=>pg("Frequently asked questions",[["How do I pay?","Choose a course, tap Unlock, send the fee to the JazzCash or EasyPaisa account shown, then enter your transaction ID and upload the receipt screenshot."],["How long does approval take?","Receipts are checked automatically and approved quickly when everything matches. Anything unclear is reviewed by a person, usually within a few hours."],["I did not get the verification email.","Check your spam or junk folder. If it is not there, wait a minute and try signing up again, or contact us."],["Which modules are free?","The first two modules of each course are free so you can try before you pay."],["How do I get a certificate?","Finish every module and pass every quiz in a course, then open Certificates and tap Get certificate. It has a QR code anyone can scan to verify it."],["Can I retake a quiz?","Yes, up to 5 times a day."],["Are quizzes timed?","Some are. A timed quiz shows a countdown after you press Start, and your answers are sent automatically when the time runs out. If you reload the page the clock keeps running."],["How do I rate a course?","Finish at least one lesson, then scroll to Ratings and reviews on the course page, or use the Feedback page from the menu."],["What is the Speaking Coach?","Record or type a short pitch and get scores for clarity, confidence and tone, plus tips. It is practice feedback, not a grade."],["How do I contact you?",`Email <a href="mailto:${CONTACT}">${CONTACT}</a>.`]].map(([a,b])=>`<details><summary>${a}</summary><p>${b}</p></details>`).join(""));

/* ---------- one Help page with tabs: FAQ, Terms, Privacy, Refund ---------- */
const HELP=[["faq","FAQ",faq],["terms","Terms",terms],["privacy","Privacy",privacy],["refund","Refund",refund]];
async function helpPage(tab){
  const cur=HELP.find(h=>h[0]===tab)||HELP[0];
  const rows=await q(sb.from("pages").select("key,body,updated_at")),row=rows.find(r=>r.key===cur[0]);
  const body=`<div class="tabs" role="tablist">${HELP.map(([k,l])=>`<button role="tab" aria-selected="${k===cur[0]}" data-act="htab" data-v="${k}">${l}</button>`).join("")}</div>${row?pg(cur[1],textToHtml(row.body),new Date(row.updated_at).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})):cur[2]()}`;
  const top=hero("Help","Help and policies","Answers, terms, privacy and refunds in one place.");
  return me?shell("help",top+body):`<div class="wide">${top}${body}</div>`}

/* ---------- public course catalog ---------- */
async function catalog(){
  const [cs,ls,zs,rt]=await Promise.all([q(sb.from("courses").select("*").order("position")),q(sb.from("lessons").select("course_id,kind")),q(sb.from("quizzes").select("course_id")),q(sb.from("course_ratings").select("*"))]);
  const RM=Object.fromEntries(rt.map(r=>[r.course_id,r]));
  const n=(id,k)=>ls.filter(l=>l.course_id===id&&l.kind===k).length;
  return `<div class="wide">${`<div class="banner"><div><span class="eyebrow">softskills</span><h1>Courses</h1><p>Career skills, live masterclasses and practice. The first two modules of every course are free.</p></div>${me?"":'<div><a class="btn o" href="#/signin">Sign in</a></div>'}</div>`}
  <div class="grid">${cs.map((c,i)=>`<div class="card"><div class="cover c${i%4}"><span>${String(i+1).padStart(2,"0")}</span></div><div class="row"><span class="tag ${c.price?"":"k"}">${c.is_bundle?"Bundle":c.price?"Paid":"Free"}</span><b>${pkr(c.price)}</b></div><h3>${esc(c.title)}</h3>${ratingLine(RM[c.id])}<p>${esc(c.description)}</p><span class="hint">${n(c.id,"module")} modules · ${n(c.id,"class")} live · ${n(c.id,"note")} notes · ${zs.filter(z=>z.course_id===c.id).length} quizzes</span><div>${me?`<a class="btn s" href="#/course/${c.id}">Open</a>`:'<a class="btn s" href="#/signup">Sign up to enrol</a>'}</div></div>`).join("")||'<div class="empty">Courses are coming soon.</div>'}</div></div>`}

/* ---------- quizzes and assignments on the course page ---------- */
const stars=(n,s=16)=>Array.from({length:5},(_,i)=>`<span class="star ${i<Math.round(n)?"on":""}" style="font-size:${s}px">★</span>`).join("");
const ratingLine=r=>r?`<div class="rate">${ic("star",13)} ${r.avg_rating} <span class="hint">(${r.n})</span></div>`:"";
const starPick=(id,val)=>`<div class="starpick" role="radiogroup" aria-label="Rating">${[5,4,3,2,1].map(n=>`<input type="radio" id="${id}${n}" name="rating" value="${n}" ${val===n?"checked":""}><label for="${id}${n}" title="${n} out of 5">★</label>`).join("")}</div>`;
const reviewForm=(mine,cid)=>`<form data-form="review" data-cid="${cid}" style="margin-top:10px">${starPick("r"+cid.slice(0,8),mine?.rating)}<textarea name="comment" rows="2" maxlength="1000" placeholder="What did you like? What could be better? (optional)" style="margin-top:8px">${esc(mine?.comment||"")}</textarea><div class="err"></div><button class="btn s" style="margin-top:8px">${mine?"Update my review":"Post review"}</button></form>`;
async function lmsData(cid){
  const [qz,at,as,su,rv]=await Promise.all([q(sb.from("quizzes").select("*").eq("course_id",cid).order("position")),q(sb.from("quiz_attempts").select("quiz_id,score,passed").eq("user_id",me.id)),q(sb.from("assignments").select("*").eq("course_id",cid).order("created_at")),q(sb.from("submissions").select("*").eq("user_id",me.id)),q(sb.from("reviews").select("*").eq("course_id",cid).order("created_at",{ascending:false}).limit(30))]);
  return {qz,at,as,su,rv,nm:await names(rv.map(r=>r.user_id))}}
function revHtml(X,ok,cid){
  const rv=X.rv||[],mine=rv.find(r=>r.user_id===me.id),avg=rv.length?rv.reduce((a,r)=>a+r.rating,0)/rv.length:0;
  return `<h2 style="margin:36px 0 4px">Ratings and reviews</h2><div class="ok" style="margin-top:10px">${rv.length?`<div style="display:flex;align-items:center;gap:14px"><b style="font-size:38px;line-height:1;font-family:'Bricolage Grotesque',sans-serif">${avg.toFixed(1)}</b><div>${stars(avg,20)}<div class="hint">${rv.length} review${rv.length>1?"s":""}</div></div></div>`:'<p class="hint" style="margin:0">No reviews yet. Be the first to rate this course.</p>'}
  ${ok?reviewForm(mine,cid):'<p class="hint" style="margin:12px 0 0">Unlock the course and finish a lesson to leave a review.</p>'}</div>
  ${rv.filter(r=>r.comment).slice(0,10).map(r=>`<div class="item"><div class="t"><b>${first(X.nm[r.user_id])}</b> ${stars(r.rating,14)}<div>${esc(r.comment)}</div><span class="hint">${when(r.created_at)}</span></div></div>`).join("")}`}
function lmsHtml(X,ok,cid){
  const best=id=>Math.max(-1,...X.at.filter(a=>a.quiz_id===id).map(a=>a.score)),passed=id=>X.at.some(a=>a.quiz_id===id&&a.passed);
  const qa=(X.qz.length?`<h2 style="margin:36px 0 4px">Quizzes</h2>${X.qz.map(z=>`<div class="item"><div class="t"><b>${esc(z.title)}</b><span class="hint">Pass mark ${z.pass_mark}%${z.time_limit_min?" · "+z.time_limit_min+" min":""}${best(z.id)>=0?" · best score "+best(z.id)+"%":""}</span></div>${passed(z.id)?'<span class="tag k">Passed</span>':""}${ok?`<a class="btn s" href="#/quiz/${z.id}">${best(z.id)>=0?"Retake":"Start"}</a>`:'<span class="tag d">'+ic("lock",12)+' Locked</span>'}</div>`).join("")}`:"")+
  (X.as.length?`<h2 style="margin:36px 0 4px">Assignments</h2>${X.as.map(a=>{const s=X.su.find(x=>x.assignment_id===a.id),g=s&&s.marks!=null;
    return `<div class="item"><div class="t"><b>${esc(a.title)}</b><span class="hint">${g?"Graded: "+s.marks+" / "+a.max_marks:s?"Submitted, waiting for marks":"Not submitted"}</span>${g&&s.feedback?`<div class="hint">Feedback: ${esc(s.feedback)}</div>`:""}</div>${ok?(g?'<span class="tag k">Graded</span>':`<button class="btn s" data-act="subm" data-id="${a.id}">${s?"Edit answer":"Submit"}</button>`):'<span class="tag d">'+ic("lock",12)+' Locked</span>'}</div>`}).join("")}`:"");
  return qa+revHtml(X,ok,cid)}

/* ---------- taking a quiz ---------- */
let QZ=null,QT=null;
const fmt=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")};
const shuf=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function quizBody(left){
  const {z,qs}=QZ,ord=z.shuffle?shuf(qs.map((_,i)=>i)):qs.map((_,i)=>i);
  return hero("Quiz",esc(z.title),`Pass mark ${z.pass_mark}%.${z.time_limit_min?" Time limit: "+z.time_limit_min+" minutes.":""} A question left empty counts as wrong.`)+
  (left!=null?`<div class="qtimer" id="qtimer">${ic("clock",18)}<span>Time left</span><b>${fmt(left)}</b></div>`:"")+
  `<form data-form="quiz">${ord.map((i,n)=>{const x=qs[i],oo=z.shuffle?shuf(x.options.map((_,j)=>j)):x.options.map((_,j)=>j);
    return `<div class="ok" style="margin-top:12px"><b>${n+1}. ${esc(x.question)}</b>${oo.map(j=>`<label style="display:flex;gap:10px;align-items:flex-start;font-weight:500;margin:10px 0 0"><input type="radio" name="q${i}" value="${j}" style="width:auto;margin-top:5px"><span>${esc(x.options[j])}</span></label>`).join("")}<div class="qres hint" data-i="${i}" style="margin-top:8px"></div></div>`}).join("")}<div class="err"></div><button class="btn" style="margin-top:14px">Submit answers</button></form><div id="qout"></div>`}
function tickQuiz(){
  const el=document.getElementById("qtimer");if(!el||!QZ||!QZ.deadline){clearInterval(QT);return}
  const left=(QZ.deadline-Date.now())/1000;el.querySelector("b").textContent=fmt(left);el.classList.toggle("low",left<=60);
  if(left<=0){clearInterval(QT);toast("Time is up! Sending your answers…");const f=document.querySelector("[data-form=quiz]");if(f)HL.quiz(f,new FormData(f),true).catch(x=>{const e=f.querySelector(".err");if(e)e.textContent=x.message})}}
async function quiz(){
  clearInterval(QT);
  const id=hid(),{data:z}=await sb.from("quizzes").select("*").eq("id",id).maybeSingle();
  if(!z)return shell("app",'<div class="empty">Quiz not found.</div>');
  const qs=await q(sb.from("quiz_questions").select("*").eq("quiz_id",id).order("position"));
  if(!qs.length)return shell("app",hero("Quiz",esc(z.title),"")+'<div class="empty">No questions available. If the course is locked, unlock it first.</div>');
  QZ={z,qs};
  if(z.time_limit_min)return shell("app",hero("Quiz",esc(z.title),`${qs.length} questions · ${z.time_limit_min} minutes · pass mark ${z.pass_mark}%`)+
    `<div class="ok" style="margin-top:0"><h3 style="font-size:20px">Before you start</h3><ul style="margin:10px 0 14px;padding-left:20px;color:#3f3f46"><li>The timer starts when you press Start and cannot be paused.</li><li>If you reload the page, the clock keeps running.</li><li>When the time runs out, your answers are sent automatically.</li></ul><div class="err" id="qerr"></div><button class="btn" data-act="qstart">${ic("clock",15)}Start quiz</button> <a class="btn o" href="#/course/${z.course_id}">Back</a></div>`);
  return shell("app",quizBody(null))}

/* ---------- video player (YouTube / Vimeo) with automatic completion ---------- */
let VIDDONE=false;
function embedOf(u){try{const x=new URL(u),h=x.hostname.replace(/^www\./,"");
  if(h==="youtu.be")return {t:"yt",id:x.pathname.slice(1)};
  if(h.endsWith("youtube.com")){const id=x.searchParams.get("v")||(x.pathname.match(/\/(?:embed|shorts)\/([\w-]+)/)||[])[1];if(id)return {t:"yt",id}}
  if(h==="vimeo.com"){const id=x.pathname.split("/").filter(Boolean)[0];if(/^\d+$/.test(id))return {t:"vimeo",id}}}catch(e){}return null}
const ytLoad=()=>new Promise(r=>{if(window.YT&&YT.Player)return r();window.onYouTubeIframeAPIReady=r;const s=document.createElement("script");s.src="https://www.youtube.com/iframe_api";document.head.appendChild(s)});
async function markDone(id){const{error}=await sb.from("lesson_progress").insert({user_id:me.id,lesson_id:id});if(!error||error.code==="23505"){VIDDONE=true;toast("Lesson marked complete")}}
async function playVideo(id,title,e){
  $("#dbody").innerHTML=`<h2 style="font-size:20px">${esc(title)}</h2><div class="vid">${e.t==="vimeo"?`<iframe src="https://player.vimeo.com/video/${e.id}" allow="fullscreen; picture-in-picture" allowfullscreen title="${esc(title)}"></iframe>`:'<div id="ytp"></div>'}</div><div class="row" style="margin-top:14px"><button class="btn s o" data-act="vdone" data-id="${id}">Mark complete</button><button class="btn s" data-act="close">Close</button></div>${e.t==="yt"?'<p class="hint" style="margin:10px 0 0">This lesson is marked complete automatically when the video ends.</p>':""}`;
  dlg.style.width="min(900px,96vw)";dlg.showModal();
  if(e.t==="yt"){await ytLoad();new YT.Player("ytp",{videoId:e.id,width:"100%",height:"100%",playerVars:{rel:0,modestbranding:1},events:{onStateChange:ev=>{if(ev.data===0)markDone(id)}}})}}

/* ---------- feedback: students rate courses and send suggestions ---------- */
async function feedback(){
  const [pr,rv,fb,cs]=await Promise.all([q(sb.from("lesson_progress").select("lessons(course_id)").eq("user_id",me.id)),q(sb.from("reviews").select("*").eq("user_id",me.id)),q(sb.from("feedback").select("*").eq("user_id",me.id).order("created_at",{ascending:false}).limit(10)),q(sb.from("courses").select("id,title").order("position"))]);
  const taking=new Set(pr.map(x=>x.lessons?.course_id).filter(Boolean)),rm=Object.fromEntries(rv.map(r=>[r.course_id,r])),list=cs.filter(c=>taking.has(c.id));
  const cat={courses:"Courses",website:"Website",live:"Live classes",other:"Other"};
  return shell("feedback",hero("Feedback","Tell us how we are doing","Rate the courses you are taking and tell us what to improve. We read every message.")+
  `<h2 style="margin:6px 0 10px">Rate your courses</h2>`+(list.length?list.map(c=>`<div class="ok" style="margin-top:12px"><b>${esc(c.title)}</b>${reviewForm(rm[c.id],c.id)}</div>`).join(""):'<div class="empty">Finish a lesson in any course and it will appear here, so you can rate it.</div>')+
  `<h2 style="margin:30px 0 10px">Suggestions and problems</h2><div class="ok" style="margin-top:0"><form data-form="feedback"><div class="two"><div><label style="margin-top:0">About</label><select name="category"><option value="courses">Courses</option><option value="website">The website</option><option value="live">Live classes</option><option value="other">Something else</option></select></div><div><label style="margin-top:0">Overall rating (optional)</label>${starPick("fb",null)}</div></div><label>Your message</label><textarea name="message" rows="4" required minlength="3" maxlength="2000" placeholder="What should we improve? What do you love?"></textarea><div class="err"></div><button class="btn" style="margin-top:12px">Send feedback</button></form></div>`+
  (fb.length?`<h3 style="font-size:20px;margin:26px 0 6px">Your recent messages</h3>`+fb.map(f=>`<div class="item"><div class="t"><b>${cat[f.category]||"Other"}</b> ${f.rating?stars(f.rating,13):""}<div>${esc(f.message)}</div><span class="hint">${when(f.created_at)} · ${f.status==="read"?"Seen by our team":"Sent"}</span></div></div>`).join(""):""))}
async function adminFeedback(){
  const [fb,rv]=await Promise.all([q(sb.from("feedback").select("*,profiles(full_name)").order("created_at",{ascending:false}).limit(100)),q(sb.from("reviews").select("*,profiles(full_name),courses(title)").order("created_at",{ascending:false}).limit(100))]);
  const tb=(h,r)=>r.length?`<div class="scroll"><table><tr>${h.map(x=>`<th>${x}</th>`).join("")}</tr>${r.join("")}</table></div>`:'<div class="empty">Nothing yet.</div>';
  const cat={courses:"Courses",website:"Website",live:"Live classes",other:"Other"},avg=rv.length?(rv.reduce((a,r)=>a+r.rating,0)/rv.length).toFixed(1):"–";
  return `<div class="stats"><div><b>${fb.filter(x=>x.status==="new").length}</b>New messages</div><div><b>${rv.length}</b>Course reviews</div><div><b>${avg}</b>Average rating</div></div>
  <h3 style="font-size:22px;margin:10px 0 8px">Messages from students</h3>${tb(["Student","About","Rating","Message","When","",""],fb.map(f=>`<tr><td>${esc(f.profiles?.full_name)}</td><td>${cat[f.category]||""}</td><td>${f.rating?stars(f.rating,13):""}</td><td style="max-width:380px">${esc(f.message)}</td><td class="hint">${when(f.created_at)}</td><td>${f.status==="new"?`<button class="btn s" data-act="fbread" data-id="${f.id}">Mark as read</button>`:'<span class="tag">Read</span>'}</td><td><button class="btn s o" data-act="del" data-t="feedback" data-id="${f.id}">Delete</button></td></tr>`))}
  <h3 style="font-size:22px;margin:34px 0 8px">Course reviews</h3>${tb(["Student","Course","Rating","Comment","When",""],rv.map(r=>`<tr><td>${esc(r.profiles?.full_name)}</td><td>${esc(r.courses?.title)}</td><td>${stars(r.rating,13)}</td><td style="max-width:380px">${esc(r.comment)}</td><td class="hint">${when(r.created_at)}</td><td><button class="btn s o" data-act="del" data-t="reviews" data-id="${r.id}">Delete</button></td></tr>`))}`}

/* ---------- admin: quizzes, assignments, grading ---------- */
async function adminLMS(){
  const [cs,qz,as,su]=await Promise.all([q(sb.from("courses").select("id,title").order("position")),q(sb.from("quizzes").select("*,courses(title)").order("created_at",{ascending:false})),q(sb.from("assignments").select("*,courses(title)").order("created_at",{ascending:false})),q(sb.from("submissions").select("*,profiles(full_name),assignments(title,max_marks)").order("created_at",{ascending:false}))]);
  const opts=cs.map(c=>`<option value="${c.id}">${esc(c.title)}</option>`).join("");
  const tbl=(h,rows)=>rows.length?`<div class="scroll"><table><tr>${h.map(x=>`<th>${x}</th>`).join("")}</tr>${rows.join("")}</table></div>`:'<div class="empty">Nothing yet.</div>';
  return `<p class="sub" style="margin-top:18px">Create quizzes with AI from your lesson text, add assignments, and grade what students submit.</p>
  <div class="ok"><h3 style="font-size:22px">AI: create a quiz</h3><form data-form="aiquiz"><label style="margin-top:0">Course</label><select name="course_id">${opts}</select><div class="two"><div><label>Quiz title</label><input name="title" required></div><div><label>Pass mark (%)</label><input name="pass" type="number" min="1" max="100" value="60"></div></div><div class="two"><div><label>Time limit in minutes (empty = no timer)</label><input name="limit" type="number" min="1" max="300"></div><div><label style="display:flex;gap:8px;align-items:center;margin-top:36px"><input type="checkbox" name="shuffle" style="width:auto"> Shuffle questions and answers</label></div></div><label>Number of questions</label><select name="count"><option>5</option><option>8</option><option>10</option></select><label>Lesson text or topic notes</label><textarea name="text" rows="6" required placeholder="Paste the lesson text the questions should be based on"></textarea><div class="err"></div><button class="btn s" style="margin-top:12px">Generate quiz</button></form></div>
  <h3 style="font-size:22px;margin:30px 0 8px">Quizzes</h3>${tbl(["Quiz","Course","Pass",""],qz.map(z=>`<tr><td>${esc(z.title)}</td><td>${esc(z.courses?.title)}</td><td>${z.pass_mark}%${z.time_limit_min?" · "+z.time_limit_min+" min":""}${z.shuffle?" · shuffled":""}</td><td><a class="btn s o" href="#/quiz/${z.id}">Preview</a> <button class="btn s o" data-act="edit" data-t="quizzes" data-id="${z.id}">Settings</button> <button class="btn s o" data-act="del" data-t="quizzes" data-id="${z.id}">Delete</button></td></tr>`))}
  <h3 style="font-size:22px;margin:34px 0 8px">Add assignment</h3><form data-form="addassign" style="max-width:520px"><label style="margin-top:0">Course</label><select name="course_id">${opts}</select><label>Title</label><input name="title" required><label>Instructions</label><textarea name="instructions" rows="3"></textarea><label>Maximum marks</label><input name="max" type="number" min="1" value="100"><div class="err"></div><button class="btn s" style="margin-top:12px">Add assignment</button></form>
  <h3 style="font-size:22px;margin:34px 0 8px">Assignments</h3>${tbl(["Title","Course","Marks",""],as.map(a=>`<tr><td>${esc(a.title)}</td><td>${esc(a.courses?.title)}</td><td>${a.max_marks}</td><td><button class="btn s o" data-act="del" data-t="assignments" data-id="${a.id}">Delete</button></td></tr>`))}
  <h3 style="font-size:22px;margin:34px 0 8px">Submissions</h3>${tbl(["Student","Assignment","Answer","Status",""],su.map(s=>`<tr><td>${esc(s.profiles?.full_name)}</td><td>${esc(s.assignments?.title)}</td><td style="max-width:280px">${esc(s.body.slice(0,120))}${s.body.length>120?"…":""}</td><td>${s.marks!=null?`<span class="tag k">${s.marks} / ${s.assignments?.max_marks}</span>`:'<span class="tag">Needs grading</span>'}</td><td><button class="btn s o" data-act="grade" data-id="${s.id}">${s.marks!=null?"Regrade":"Grade"}</button></td></tr>`))}`}

/* ---------- admin: students, moderation, help pages ---------- */
let STU=[],CRS=[];
function stuRows(f){f=(f||"").toLowerCase();const rows=STU.filter(s=>!f||[s.name,s.email,s.city,s.university].join(" ").toLowerCase().includes(f));
  return rows.length?rows.map(s=>`<tr><td><b>${esc(s.name||"(no name)")}</b><div class="hint">${esc(s.email)}</div></td><td>${esc(s.city)}<div class="hint">${esc(s.university)}</div></td><td>${s.courses.length?s.courses.map(c=>`<span class="tag">${esc(c)}</span>`).join(" "):'<span class="hint">None</span>'}</td><td class="hint">${s.modules_done} modules · ${s.quizzes_passed} quizzes · ${s.pitches} pitches${s.last?"<br>Last seen "+when(s.last):""}</td><td>${s.blocked?'<span class="tag d">Blocked</span>':s.is_admin?'<span class="tag k">Admin</span>':s.is_instructor?'<span class="tag k">Instructor</span>':'<span class="tag">Active</span>'}</td><td>${s.is_admin?"":`<button class="btn s o" data-act="gdlg" data-id="${s.id}">Access</button> <button class="btn s o" data-act="role" data-id="${s.id}" data-i="${s.is_instructor?0:1}">${s.is_instructor?"Remove instructor":"Make instructor"}</button> <button class="btn s o" data-act="block" data-id="${s.id}" data-b="${s.blocked?0:1}">${s.blocked?"Unblock":"Block"}</button>`}</td></tr>`).join(""):'<tr><td colspan="6" class="hint">No students match.</td></tr>'}
async function adminStudents(){
  try{const r=await api("list-students",{},AC());STU=r.students;CRS=r.courses;
    return `<p class="sub" style="margin-top:18px">${STU.length} accounts. Grant or remove course access, or block an account. Private journals and pitch recordings are not shown.</p><input id="stq" placeholder="Search by name, email, city or university" style="max-width:420px;margin-bottom:14px"><div class="scroll"><table><tr><th>Student</th><th>City / university</th><th>Courses</th><th>Activity</th><th>Status</th><th></th></tr><tbody id="stbody">${stuRows("")}</tbody></table></div>`}
  catch(e){if(/admin code/i.test(e.message))sessionStorage.removeItem("ac");return `<div class="empty" style="margin-top:18px">${esc(e.message)}</div>`}}
async function adminMod(){
  const [cm,sl,ce]=await Promise.all([q(sb.from("lesson_comments").select("*,profiles(full_name),lessons(title)").order("created_at",{ascending:false}).limit(50)),q(sb.from("practice_slots").select("*,profiles!host_id(full_name)").order("starts_at",{ascending:false}).limit(50)),q(sb.from("certificates").select("*,profiles(full_name),courses(title)").order("issued_at",{ascending:false}).limit(100))]);
  const tb=(h,r)=>r.length?`<div class="scroll"><table><tr>${h.map(x=>`<th>${x}</th>`).join("")}</tr>${r.join("")}</table></div>`:'<div class="empty">Nothing yet.</div>';
  const del=(t,id,l)=>`<button class="btn s o" data-act="del" data-t="${t}" data-id="${id}">${l}</button>`;
  return `<p class="sub" style="margin-top:18px">Remove anything that should not be on the site.</p>
  <h3 style="font-size:22px;margin:10px 0 8px">Lesson Q&amp;A (latest 50)</h3>${tb(["Student","Lesson","Comment","When",""],cm.map(c=>`<tr><td>${esc(c.profiles?.full_name)}</td><td>${esc(c.lessons?.title)}</td><td style="max-width:360px">${esc(c.body)}</td><td class="hint">${when(c.created_at)}</td><td>${del("lesson_comments",c.id,"Delete")}</td></tr>`))}
  <h3 style="font-size:22px;margin:34px 0 8px">Practice slots (latest 50)</h3>${tb(["Host","Type","Topic","When","Seat",""],sl.map(x=>`<tr><td>${esc(x.profiles?.full_name)}</td><td>${esc(x.kind)}</td><td>${esc(x.topic)}</td><td class="hint">${when(x.starts_at)}</td><td>${x.guest_id?"Taken":"Open"}</td><td>${del("practice_slots",x.id,"Remove")}</td></tr>`))}
  <h3 style="font-size:22px;margin:34px 0 8px">Certificates issued</h3>${tb(["Student","Course","ID","Issued",""],ce.map(c=>`<tr><td>${esc(c.profiles?.full_name)}</td><td>${esc(c.courses?.title)}</td><td>${c.code}</td><td class="hint">${when(c.issued_at)}</td><td>${del("certificates",c.id,"Revoke")}</td></tr>`))}`}
async function adminPages(){
  const P=Object.fromEntries((await q(sb.from("pages").select("key,body"))).map(r=>[r.key,r.body]));
  return `<p class="sub" style="margin-top:18px">Edit what students see on the Help page. Leave a box empty to keep the built-in text. Start a line with "# " for a heading and "- " for a bullet; a blank line starts a new paragraph.</p>
  <form data-form="pages" style="max-width:760px">${HELP.map(([k,l])=>`<label>${l}</label><textarea name="${k}" rows="9">${esc(P[k]||"")}</textarea><button type="button" class="btn s o" style="margin-top:8px" data-act="loadpage" data-k="${k}">Load the built-in text to edit</button>`).join("")}<div class="err"></div><button class="btn" style="margin-top:18px">Save pages</button></form>`}

/* ---------- handlers ---------- */
const HL={
  async quiz(f,d,auto){
    const answers=QZ.qs.map((_,i)=>{const v=d.get("q"+i);return v===null?-1:+v}),empty=answers.filter(a=>a<0).length;
    if(!auto&&empty&&!confirm(`You left ${empty} question${empty>1?"s":""} unanswered. Submit anyway?`)){f.querySelector("button:not([type=button])").disabled=false;return}
    clearInterval(QT);
    const r=await api("quiz-submit",{quiz_id:QZ.z.id,answers});
    $("#qtimer")?.remove();f.querySelectorAll(".qres").forEach(n=>n.textContent="");
    r.wrong.forEach(w=>{const n=f.querySelector('.qres[data-i="'+w.i+'"]');if(n)n.innerHTML=`<span style="color:#b42318;font-weight:600">${w.unanswered?"Not answered.":"Not correct."}</span> ${esc(w.explanation)}`});
    $("#qout").innerHTML=`<div class="ok"><h3 style="font-size:22px">${r.passed?"You passed":"Not passed yet"}: ${r.score}%</h3><p class="hint">Pass mark ${r.pass_mark}%.${r.unanswered?" "+r.unanswered+" unanswered.":""}</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn s" data-act="again">Try again</button><a class="btn s o" href="#/course/${QZ.z.course_id}">Back to course</a></div></div>`;
    f.querySelector("button:not([type=button])").disabled=false;$("#qout").scrollIntoView({behavior:"smooth"})},
  async review(f,d){if(!d.get("rating"))return err(f,"Tap a star to rate the course.");
    const{error}=await sb.from("reviews").upsert({course_id:f.dataset.cid,user_id:me.id,rating:+d.get("rating"),comment:d.get("comment")||null,updated_at:new Date().toISOString()},{onConflict:"course_id,user_id"});
    if(error)return err(f,/row-level security/i.test(error.message)?"Finish at least one lesson of this course to leave a review.":error.message);toast("Thank you for your review!");go()},
  async feedback(f,d){const{error}=await sb.from("feedback").insert({user_id:me.id,rating:d.get("rating")?+d.get("rating"):null,category:d.get("category"),message:d.get("message")});
    if(error)return err(f,/row-level security/i.test(error.message)?"You can send up to 5 messages a day. Please try again tomorrow.":error.message);toast("Thank you! We read every message.");go()},
  async subm(f,d){const id=f.dataset.id,body=d.get("body");
    const{data:s}=await sb.from("submissions").select("id").eq("assignment_id",id).eq("user_id",me.id).maybeSingle();
    const{error}=s?await sb.from("submissions").update({body}).eq("id",s.id):await sb.from("submissions").insert({assignment_id:id,user_id:me.id,body});
    if(error)return err(f,error.message);dlg.close();toast("Submitted");go()},
  async aiquiz(f,d){const r=await api("ai-quiz",{text:d.get("text"),count:+d.get("count")},AC());
    const{data:z,error}=await sb.from("quizzes").insert({course_id:d.get("course_id"),title:d.get("title"),pass_mark:+d.get("pass")||60,time_limit_min:d.get("limit")?+d.get("limit"):null,shuffle:d.get("shuffle")==="on"}).select().single();if(error)return err(f,error.message);
    const{data:rows,error:e2}=await sb.from("quiz_questions").insert(r.questions.map((x,i)=>({quiz_id:z.id,position:i+1,question:x.question,options:x.options}))).select("id,position");
    if(e2){await sb.from("quizzes").delete().eq("id",z.id);return err(f,e2.message)}
    const by=Object.fromEntries(rows.map(x=>[x.position,x.id])),{error:e3}=await sb.from("quiz_answers").insert(r.questions.map((x,i)=>({question_id:by[i+1],correct:x.correct,explanation:x.explanation})));
    if(e3){await sb.from("quizzes").delete().eq("id",z.id);return err(f,e3.message)}
    toast("Quiz created with "+r.questions.length+" questions");go()},
  async addassign(f,d){const{error}=await sb.from("assignments").insert({course_id:d.get("course_id"),title:d.get("title"),instructions:d.get("instructions"),max_marks:+d.get("max")||100});if(error)return err(f,error.message);toast("Assignment added");go()},
  async pages(f,d){for(const[k]of HELP){const v=String(d.get(k)||"").trim();
      const r=v?await sb.from("pages").upsert({key:k,body:v,updated_at:new Date().toISOString()}):await sb.from("pages").delete().eq("key",k);if(r.error)return err(f,r.error.message)}
    toast("Help pages saved");f.querySelector("button:not([type=button])").disabled=false},
  async grade(f,d){const max=+f.dataset.max,m=+d.get("marks");if(!(m>=0&&m<=max))return err(f,"Marks must be between 0 and "+max+".");
    const{error}=await sb.from("submissions").update({marks:m,feedback:d.get("feedback"),graded_at:new Date().toISOString()}).eq("id",f.dataset.id);if(error)return err(f,error.message);dlg.close();toast("Graded");go()}
};
const AL={
  async open(el){const{data:s}=await sb.from("lesson_secrets").select("*").eq("lesson_id",el.dataset.id).maybeSingle();
    if(!s)return toast("This item is locked. Unlock the course first.");
    if(s.file_path){const{data,error}=await sb.storage.from("notes").createSignedUrl(s.file_path,300);if(error)return toast(error.message);window.open(data.signedUrl,"_blank");return}
    if(!s.url)return toast("No link added yet.");
    const e=embedOf(s.url);
    if(e&&el.textContent.trim()==="Watch")return playVideo(el.dataset.id,el.closest(".item")?.querySelector("b")?.textContent||"Lesson",e);
    window.open(s.url,"_blank","noopener")},
  htab:el=>{location.hash="#/help/"+el.dataset.v},
  loadpage:el=>{document.querySelector(`textarea[name="${el.dataset.k}"]`).value=htmlToText(HELP.find(h=>h[0]===el.dataset.k)[2]())},
  gdlg(el){const s=STU.find(x=>x.id===el.dataset.id);
    $("#dbody").innerHTML=`<h2 style="font-size:22px">Course access</h2><p class="hint">${esc(s.name)} · ${esc(s.email)}</p><label>Course</label><select id="gcourse">${CRS.map(c=>`<option value="${c.id}">${esc(c.title)}${c.price?"":" (free)"}</option>`).join("")}</select><p class="hint" style="margin-top:10px">Remove access only removes a course that was approved directly. If the student has a bundle, remove the bundle.</p><div class="row" style="margin-top:14px"><button class="btn o" data-act="close">Cancel</button><span><button class="btn s o" data-act="gdo" data-mode="revoke" data-id="${s.id}">Remove access</button> <button class="btn s" data-act="gdo" data-mode="grant" data-id="${s.id}">Grant access</button></span></div><div class="err" id="gerr"></div>`;dlg.showModal()},
  async gdo(el){try{await api("grant-access",{user_id:el.dataset.id,course_id:$("#gcourse").value,mode:el.dataset.mode},AC());dlg.close();toast(el.dataset.mode==="grant"?"Access granted":"Access removed");go()}catch(e){$("#gerr").textContent=e.message}},
  async block(el){const b=el.dataset.b==="1";if(b&&!confirm("Block this student? They will not be able to sign in."))return;
    try{await api("block-user",{user_id:el.dataset.id,block:b},AC());toast(b?"Blocked":"Unblocked");go()}catch(e){toast(e.message)}},
  async qstart(el){el.disabled=true;
    try{const r=await api("quiz-start",{quiz_id:QZ.z.id});QZ.deadline=Date.now()+r.seconds_left*1000;
      main.innerHTML=shell("app",quizBody(r.seconds_left));clearInterval(QT);QT=setInterval(tickQuiz,1000);tickQuiz()}
    catch(e){el.disabled=false;const x=$("#qerr");if(x)x.textContent=e.message}},
  async fbread(el){const{error}=await sb.from("feedback").update({status:"read"}).eq("id",el.dataset.id);if(error)return toast(error.message);go()},
  async vdone(el){await markDone(el.dataset.id)},
  async subm(el){const id=el.dataset.id,[{data:a},{data:s}]=await Promise.all([sb.from("assignments").select("*").eq("id",id).single(),sb.from("submissions").select("*").eq("assignment_id",id).eq("user_id",me.id).maybeSingle()]);
    $("#dbody").innerHTML=`<h2>${esc(a.title)}</h2><p class="hint" style="white-space:pre-wrap">${esc(a.instructions)}</p><form data-form="subm" data-id="${id}"><label>Your answer or a link to your work</label><textarea name="body" rows="6" required maxlength="5000">${esc(s?.body||"")}</textarea><div class="err"></div><div class="row" style="margin-top:12px"><button type="button" class="btn o" data-act="close">Cancel</button><button class="btn">Submit</button></div></form>`;dlg.showModal()},
  async grade(el){const{data:s}=await sb.from("submissions").select("*,profiles(full_name),assignments(title,max_marks)").eq("id",el.dataset.id).single();
    $("#dbody").innerHTML=`<h2 style="font-size:22px">${esc(s.assignments.title)}</h2><p class="hint">${esc(s.profiles?.full_name)}</p><div class="ok" style="margin-top:0;white-space:pre-wrap;max-height:36vh;overflow:auto">${esc(s.body)}</div><form data-form="grade" data-id="${s.id}" data-max="${s.assignments.max_marks}"><label>Marks (out of ${s.assignments.max_marks})</label><input name="marks" type="number" min="0" max="${s.assignments.max_marks}" value="${s.marks??""}" required><label>Feedback</label><textarea name="feedback" rows="3">${esc(s.feedback||"")}</textarea><div class="err"></div><div class="row" style="margin-top:12px"><button type="button" class="btn o" data-act="close">Cancel</button><button class="btn">Save marks</button></div></form>`;dlg.showModal()},
  async appr(el){try{await api("approve-payment",{payment_id:el.dataset.id,action:"approve"},AC());toast("Approved. The student was emailed.");go()}catch(e){toast(e.message)}},
  async rej(el){const r=prompt("Reason for rejection (shown to the student):","Transaction ID does not match.");if(r===null)return;
    try{await api("approve-payment",{payment_id:el.dataset.id,action:"reject",reason:r},AC());toast("Rejected. The student was emailed.");go()}catch(e){toast(e.message)}},
  async csv(){const ps=await q(sb.from("payments").select("*,profiles(full_name),courses(title,price)").order("created_at",{ascending:false}));
    const cell=v=>{v=String(v??"");if(/^[=+\-@]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'};
    const rows=[["Date","Student","Course","Price","Method","Sender","TID","Status","Reason"],...ps.map(p=>[p.created_at,p.profiles?.full_name,p.courses?.title,p.courses?.price,p.method,p.sender_phone,p.tid,p.status,p.reason])];
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+rows.map(r=>r.map(cell).join(",")).join("\n")],{type:"text/csv"}));a.download="softskills-payments.csv";a.click()}
};

/* ---------- wire in ---------- */
Object.assign(EXTRA,{feedback,courses:catalog,help:()=>helpPage(hid()),terms:()=>helpPage("terms"),privacy:()=>helpPage("privacy"),refund:()=>helpPage("refund"),faq:()=>helpPage("faq"),quiz});
AUTH.push("quiz","feedback");
const _install=install;
install=function(){_install();Object.assign(H,HL);Object.assign(A,AL);
  addEventListener("hashchange",()=>clearInterval(QT));
  document.addEventListener("input",e=>{if(e.target.id==="stq"&&$("#stbody"))$("#stbody").innerHTML=stuRows(e.target.value)});
  const st=document.createElement("style");
  st.textContent=`.page{max-width:820px;margin:26px auto;padding:34px;background:#fff;border:1px solid var(--l);border-radius:24px;box-shadow:var(--sh)}.page h1{font-size:clamp(28px,4vw,38px)}.page h2{font-size:20px;margin:26px 0 8px}.page p,.page li{color:#3f3f46}.page ul{padding-left:20px}.wide{max-width:1180px;margin:18px auto;padding:0 12px 20px}details{border:1px solid var(--l);border-radius:16px;padding:14px 18px;margin-top:10px}summary{cursor:pointer;font-weight:600}details p{margin:10px 0 0}.vid{aspect-ratio:16/9;background:#000;border-radius:14px;overflow:hidden;margin-top:12px}.vid iframe,.vid div{width:100%;height:100%;border:0}@media(max-width:560px){.page{padding:22px 18px;margin:14px 10px;border-radius:20px}}`;
  document.head.appendChild(st);
  dlg.addEventListener("close",()=>{dlg.style.width="";if($("#ytp")||$(".vid"))$("#dbody").innerHTML="";if(VIDDONE){VIDDONE=false;go()}});
  if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js").catch(()=>{})};
