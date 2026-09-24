// deckmap.js — pseudo-map interactive d'un deck offshore pour ePTW (wireframe)
// Plan schématique cliquable avec pins d'activités, scrubber horaire, toggle conflits.
(function(){
  const ZONES=[
    {id:"main",label:"Main deck",x:60,y:70,w:360,h:200},
    {id:"cellar",label:"Cellar deck",x:60,y:290,w:170,h:150},
    {id:"bc",label:"BC deck",x:250,y:290,w:170,h:150},
    {id:"wh",label:"Wellhead 27A",x:450,y:70,w:180,h:150},
    {id:"proc",label:"Process 27B",x:450,y:240,w:180,h:120},
    {id:"out",label:"Outboard 27E",x:450,y:380,w:180,h:60},
  ];
  // activités : zone, label, risk band, heure début/fin (h), type
  const ACTS=[
    {zone:"bc",  t:"Permit",  id:"27-b-Hw203",  risk:"lo", h0:6, h1:18, desc:"BC deck hatches — HPU"},
    {zone:"cellar",t:"Permit",id:"321-A-gfvm32",risk:"med",h0:8, h1:20, desc:"Grinding adjacent bay"},
    {zone:"main",t:"Isolation",id:"1-45-Ercv",  risk:"lo", h0:0, h1:24, desc:"Export scrubber A"},
    {zone:"main",t:"Permit",  id:"12-ptw-O012", risk:"med",h0:6, h1:16, desc:"110v saw — grating"},
    {zone:"proc",t:"ORA",     id:"A-123-456",   risk:"med",h0:0, h1:24, desc:"Diesel generation"},
    {zone:"wh",  t:"Permit",  id:"rig-01-2367", risk:"hi", h0:10,h1:14, desc:"Hot work — SIMOPS ⚠"},
    {zone:"wh",  t:"Permit",  id:"AqwSD-14",    risk:"hi", h0:9, h1:15, desc:"Rope access — SIMOPS ⚠"},
    {zone:"out", t:"Permit",  id:"Aqv-35678",   risk:"lo", h0:7, h1:17, desc:"Outboard access"},
  ];
  const RISK={lo:"#1C9E7A",med:"#C77A16",hi:"#C23B4B"};

  function el(tag,attrs,txt){const e=document.createElementNS("http://www.w3.org/2000/svg",tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(txt!=null)e.textContent=txt;return e;}

  window.renderDeckMap=function(mountId){
    const mount=document.getElementById(mountId);
    mount.innerHTML="";
    // controls
    const bar=document.createElement("div");
    bar.style.cssText="display:flex;align-items:center;gap:14px;margin-bottom:14px;flex-wrap:wrap";
    bar.innerHTML=`
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:12px;color:#5C6875;font-weight:600">Time</span>
        <input id="dm-time" type="range" min="0" max="23" value="11" style="width:220px">
        <span id="dm-timeval" style="font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;min-width:52px">11:00</span>
      </div>
      <label style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:#1C2530;cursor:pointer">
        <input id="dm-conf" type="checkbox" checked> Highlight SIMOPS conflicts
      </label>
      <div style="margin-left:auto;display:flex;gap:12px;font-size:12px;color:#5C6875">
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#1C9E7A;margin-right:4px"></span>Low</span>
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#C77A16;margin-right:4px"></span>Medium</span>
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#C23B4B;margin-right:4px"></span>High</span>
      </div>`;
    mount.appendChild(bar);

    const info=document.createElement("div");
    info.id="dm-info";
    info.style.cssText="font-size:12.5px;color:#5C6875;margin-bottom:10px;min-height:18px";
    info.textContent="Hover a zone or a pin to inspect. Move the time slider to see what is active at that hour.";
    mount.appendChild(info);

    const svg=el("svg",{viewBox:"0 0 700 470",width:"100%",style:"max-width:820px;display:block;margin:0 auto;background:#F2F5F8;border-radius:10px"});
    // sea gradient bg hint
    svg.appendChild(el("rect",{x:0,y:0,width:700,height:470,fill:"#EDF2F6"}));
    // platform outline
    svg.appendChild(el("rect",{x:40,y:50,width:610,height:400,rx:14,fill:"#FFFFFF",stroke:"#CBD5DE","stroke-width":2}));
    svg.appendChild(el("text",{x:50,y:38,fill:"#5C6875","font-size":13,"font-weight":700},"Bacton — platform deck plan (schematic)"));

    const zoneEls={};
    ZONES.forEach(z=>{
      const g=el("g",{});
      const r=el("rect",{x:z.x,y:z.y,width:z.w,height:z.h,rx:8,fill:"#F7F9FB",stroke:"#C4CFD8","stroke-width":1.5,style:"cursor:pointer;transition:fill .12s"});
      const lb=el("text",{x:z.x+10,y:z.y+20,fill:"#5C6875","font-size":11,"font-weight":700},z.label);
      g.appendChild(r);g.appendChild(lb);svg.appendChild(g);
      zoneEls[z.id]={rect:r,zone:z};
      r.addEventListener("mouseenter",()=>{r.setAttribute("fill","#E9EEF3");info.textContent=z.label+" — "+ACTS.filter(a=>a.zone===z.id).length+" activities in this zone";});
      r.addEventListener("mouseleave",()=>{r.setAttribute("fill","#F7F9FB");});
    });

    // pins layer
    const pinsG=el("g",{});svg.appendChild(pinsG);
    mount.appendChild(svg);

    function zoneCenter(zid,i,n){const z=ZONES.find(z=>z.id===zid);const cols=Math.min(n,3);const col=i%cols;const row=Math.floor(i/cols);const cw=z.w/(cols+1);return {x:z.x+cw*(col+1),y:z.y+40+row*34};}

    function draw(hour,showConf){
      pinsG.innerHTML="";
      // group acts by zone for layout
      const byZone={};
      ACTS.forEach(a=>{(byZone[a.zone]=byZone[a.zone]||[]).push(a);});
      // detect conflicts: >1 active act in same zone at hour
      Object.keys(byZone).forEach(zid=>{
        const list=byZone[zid];
        const activeNow=list.filter(a=>hour>=a.h0&&hour<a.h1);
        list.forEach((a,i)=>{
          const active=hour>=a.h0&&hour<a.h1;
          const c=zoneCenter(zid,i,list.length);
          const conflict=showConf && activeNow.length>1 && active;
          const g=el("g",{style:"cursor:pointer"});
          if(conflict){
            g.appendChild(el("circle",{cx:c.x,cy:c.y,r:15,fill:"none",stroke:"#C23B4B","stroke-width":2,opacity:.6}));
          }
          const pin=el("circle",{cx:c.x,cy:c.y,r:9,fill:active?RISK[a.risk]:"#C4CFD8",stroke:"#fff","stroke-width":2,opacity:active?1:.4});
          g.appendChild(pin);
          g.appendChild(el("text",{x:c.x,y:c.y+3.5,fill:"#fff","font-size":8,"font-weight":700,"text-anchor":"middle"},a.t[0]));
          g.addEventListener("mouseenter",()=>{info.innerHTML="<b>"+a.id+"</b> · "+a.t+" · "+a.desc+" · "+a.h0+":00→"+a.h1+":00"+(conflict?' · <span style="color:#C23B4B;font-weight:700">SIMOPS CONFLICT</span>':'');pin.setAttribute("r",11);});
          g.addEventListener("mouseleave",()=>{pin.setAttribute("r",9);});
          pinsG.appendChild(g);
        });
      });
    }
    const slider=bar.querySelector("#dm-time"),tv=bar.querySelector("#dm-timeval"),cf=bar.querySelector("#dm-conf");
    function upd(){const h=+slider.value;tv.textContent=String(h).padStart(2,"0")+":00";draw(h,cf.checked);}
    slider.addEventListener("input",upd);cf.addEventListener("change",upd);
    upd();
  };
})();
