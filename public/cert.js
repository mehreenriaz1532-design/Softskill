// Certificate artwork. Draws the whole certificate as one SVG (1000 x 707, A4 landscape), so it scales to any screen
// and prints cleanly. Also usable from Node for testing: require('./cert.js').
const CERT={navy:"#1B1646",violet:"#4B3FBF",gold:"#A86F12",ink:"#5A5679"};
const certEsc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

// Split text into lines of at most `max` characters without breaking words (2 lines at most; the rest is cut with …).
function certWrap(text,max){
  const words=String(text).trim().split(/\s+/),lines=[];let cur="";
  for(const w of words){if((cur+" "+w).trim().length>max&&cur){lines.push(cur);cur=w}else cur=(cur+" "+w).trim()}
  if(cur)lines.push(cur);
  if(lines.length>2){const rest=lines.slice(1).join(" ");lines.length=1;lines.push(rest.length>max?rest.slice(0,max-1).trimEnd()+"…":rest)}
  return lines}

// QR modules as one path, so it stays sharp at any size and takes the certificate colours.
function certQr(url){
  if(typeof qrcode==="undefined")return null;
  const g=qrcode(0,"M");g.addData(url);g.make();const n=g.getModuleCount();let d="";
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(g.isDark(r,c))d+=`M${c} ${r}h1v1h-1z`;
  return {n,d}}

function certSeal(cx,cy){
  const pts=[];for(let i=0;i<48;i++){const a=i*Math.PI/24,r=i%2?44:52;pts.push((cx+r*Math.cos(a)).toFixed(1)+","+(cy+r*Math.sin(a)).toFixed(1))}
  return `<path d="M${cx-30} ${cy+36}L${cx-44} ${cy+104}L${cx-24} ${cy+92}L${cx-12} ${cy+112}L${cx-2} ${cy+44}Z" fill="url(#navy)" stroke="url(#gold)" stroke-width="1.5"/>
  <path d="M${cx+30} ${cy+36}L${cx+44} ${cy+104}L${cx+24} ${cy+92}L${cx+12} ${cy+112}L${cx+2} ${cy+44}Z" fill="url(#navy)" stroke="url(#gold)" stroke-width="1.5"/>
  <polygon points="${pts.join(" ")}" fill="url(#gold)"/>
  <circle cx="${cx}" cy="${cy}" r="40" fill="none" stroke="#FFF3C4" stroke-width="1.2" opacity=".9"/>
  <circle cx="${cx}" cy="${cy}" r="34" fill="url(#sealin)" stroke="url(#gold)" stroke-width="3"/>
  <text x="${cx}" y="${cy+10}" text-anchor="middle" font-family="'Cormorant Garamond',Georgia,serif" font-weight="700" font-size="32" fill="#F6DC8B">ss</text>
  <circle cx="${cx+17}" cy="${cy+3}" r="2.6" fill="#FF7A59"/>`}

function certSvg(o){
  const name=String(o.name||"Student"),nl=name.length,nfs=Math.max(38,Math.min(88,Math.floor(1500/nl)));
  const course=certWrap(o.course||"",length(o.course)>70?38:34),cfs=course.length>1||String(o.course).length>60?36:42;
  const y0=course.length>1?452:470,yDate=y0+(course.length-1)*38+42;
  const sig=(x,b)=>`<text x="${x}" y="598" text-anchor="middle" font-family="'Allura','Brush Script MT',cursive" font-size="${Math.min(36,Math.floor(540/Math.max(8,(b.name||"").length)))}" fill="${CERT.navy}">${certEsc(b.name)}</text>
    <line x1="${x-92}" y1="610" x2="${x+92}" y2="610" stroke="${CERT.gold}" stroke-width="1.4"/>
    <text x="${x}" y="631" text-anchor="middle" font-family="'DM Sans',Arial,sans-serif" font-weight="700" font-size="13.5" fill="${CERT.navy}">${certEsc(b.name)}</text>
    <text x="${x}" y="648" text-anchor="middle" font-family="'DM Sans',Arial,sans-serif" font-size="12" letter-spacing="1" fill="${CERT.ink}">${certEsc(b.title)}</text>`;
  const q=o.qr?`<rect x="454" y="552" width="92" height="92" rx="6" fill="#fff" stroke="url(#gold)" stroke-width="2"/>
    <g transform="translate(465 563) scale(${(70/o.qr.n).toFixed(4)})"><path d="${o.qr.d}" fill="${CERT.navy}" shape-rendering="crispEdges"/></g>`:"";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 707" role="img" aria-label="Certificate of completion for ${certEsc(name)}">
<defs>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B8821F"/><stop offset=".35" stop-color="#F6DC8B"/><stop offset=".65" stop-color="#C99A2E"/><stop offset="1" stop-color="#8F6414"/></linearGradient>
<linearGradient id="navy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3A2F8C"/><stop offset="1" stop-color="#14103A"/></linearGradient>
<radialGradient id="paper" cx=".3" cy=".25" r="1.05"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".65" stop-color="#FCF8EE"/><stop offset="1" stop-color="#F3EAD3"/></radialGradient>
<radialGradient id="sealin" cx=".4" cy=".35" r=".85"><stop offset="0" stop-color="#5B4BDB"/><stop offset="1" stop-color="#16132B"/></radialGradient>
<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="1.1" fill="#C99A2E" opacity=".16"/></pattern>
</defs>
<rect width="1000" height="707" fill="url(#paper)"/><rect width="1000" height="707" fill="url(#dots)"/>
<rect x="34" y="34" width="932" height="639" rx="4" fill="none" stroke="url(#gold)" stroke-width="2.5"/>
<rect x="45" y="45" width="910" height="617" rx="2" fill="none" stroke="url(#gold)" stroke-width=".9" opacity=".8"/>
<path d="M0 0H250C195 72 105 135 0 158Z" fill="url(#navy)"/>
<path d="M0 175C112 147 208 82 270 0" fill="none" stroke="url(#gold)" stroke-width="6"/>
<path d="M0 193C122 162 224 90 294 0" fill="none" stroke="url(#gold)" stroke-width="2"/>
<path d="M1000 707H800C852 640 920 588 1000 566Z" fill="url(#navy)"/>
<path d="M1000 549C905 573 836 630 790 707" fill="none" stroke="url(#gold)" stroke-width="6"/>
<path d="M1000 531C896 558 822 620 768 707" fill="none" stroke="url(#gold)" stroke-width="2"/>
${certSeal(878,128)}
<text x="500" y="100" text-anchor="middle" font-family="'DM Sans',Arial,sans-serif" font-weight="700" font-size="14" letter-spacing="7" fill="${CERT.violet}">SOFTSKILL</text>
<text x="500" y="172" text-anchor="middle" font-family="'Cormorant Garamond',Georgia,serif" font-weight="700" font-size="78" letter-spacing="8" fill="${CERT.navy}">CERTIFICATE</text>
<text x="500" y="210" text-anchor="middle" font-family="'Cormorant Garamond',Georgia,serif" font-weight="700" font-size="25" letter-spacing="12" fill="${CERT.gold}">OF COMPLETION</text>
<path d="M395 230H478M522 230H605" stroke="url(#gold)" stroke-width="1.6"/><rect x="496" y="225" width="8" height="8" transform="rotate(45 500 229)" fill="url(#gold)"/>
<text x="500" y="272" text-anchor="middle" font-family="'DM Sans',Arial,sans-serif" font-size="17" fill="${CERT.ink}">This certificate is proudly presented to</text>
<text x="500" y="364" text-anchor="middle" font-family="'Allura','Brush Script MT',cursive" font-size="${nfs}" fill="${CERT.gold}">${certEsc(name)}</text>
<line x1="240" y1="384" x2="760" y2="384" stroke="url(#gold)" stroke-width="1.6"/>
<text x="500" y="420" text-anchor="middle" font-family="'DM Sans',Arial,sans-serif" font-size="17" fill="${CERT.ink}">for successfully completing the course</text>
${course.map((l,i)=>`<text x="500" y="${y0+i*38}" text-anchor="middle" font-family="'Cormorant Garamond',Georgia,serif" font-weight="700" font-size="${cfs}" fill="${CERT.violet}">${certEsc(l)}</text>`).join("\n")}
<text x="500" y="${yDate}" text-anchor="middle" font-family="'DM Sans',Arial,sans-serif" font-size="16" fill="${CERT.ink}">Issued on ${certEsc(o.date)}</text>
${sig(235,o.left||{})}${sig(675,o.right||{})}
${q}
<text x="500" y="657" text-anchor="middle" font-family="'DM Sans',Arial,sans-serif" font-size="10" letter-spacing="1.2" fill="${CERT.ink}">SCAN TO VERIFY · ${certEsc(o.code)}</text>
</svg>`}
function length(x){return String(x||"").length}
if(typeof module!=="undefined")module.exports={certSvg,certWrap,certQr};
