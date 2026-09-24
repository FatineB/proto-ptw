/* ePTW shared Risk Assessment component — offline-safe.
   Usage: <div id="risk-assessment" data-ra-title="3 · Risk assessment"></div>
   Injects the TRA table + interactive severity×likelihood matrix modal.
   Colour follows the page --module variable. Functions used by inline onclick
   are exposed on window so the injected markup can call them. */
(function(){
  var SECTION = '<section class="sec sec-center" id="sec-ra"><div class="sec-b" style="padding-top:24px">\n      <h2 style="text-align:center;font-size:16px;margin-bottom:20px">Risk assessment</h2>\n      <div class="field"><label>Assessment level</label>\n        <div class="radio-inline">\n          <label><input type="radio" name="ra" checked onclick="setLevel(\'L1\')"> TRA Level 1 — basic</label>\n          <label><input type="radio" name="ra" onclick="setLevel(\'L2\')"> TRA Level 2 — full TRA + matrix + RA team</label>\n        </div>\n      </div>\n      <div id="ra-l2-label" style="display:none;text-align:center;font-style:italic;font-size:12px;color:var(--muted);margin-bottom:8px">Level 2 form shown</div>\n      <div class="tra-wrap"><div class="tra-scroll">\n        <table class="tra"><thead><tr><th style="width:26px">#</th><th class="col-grp">HAZARD GROUP</th><th class="ra2col">INITIAL RISK</th><th class="col-ctrl">CONTROLS</th><th class="ra2col">RESIDUAL RISK</th><th></th></tr></thead>\n        <tbody id="tra-body"></tbody></table>\n      </div>\n        <div class="tra-foot"><button class="add-haz" onclick="addRow()">＋ Add hazard</button> <button class="view-map-btn" onclick="alert(\'Deck map — 2 conflicts\')">⚠ View map - 2 conflicts 🗺</button><span class="tra-sum" id="tra-sum">Hazards: <b id="haz-count">0</b></span></div>\n      </div>\n      <div class="ra-team-block" id="ra-team" style="display:none">\n        <h4 style="text-align:center;font-size:13px;margin-bottom:14px">RA team — assign 3 signers</h4>\n        <div class="signer"><div><label>Signer 1</label><input type="text" value="P. Nevitt - Job position"></div><button class="btn-select">Select signer</button></div>\n        <div class="signer"><div><label>Signer 2</label><input type="text" value="A. Denton - Job position"></div><button class="btn-select">Select signer</button></div>\n        <div class="signer"><div><label>Signer 3</label><input type="text" value="C. Boyd - Job position"></div><button class="btn-select">Select signer</button></div>\n      </div>\n    </div></section>';
  var MODAL = '<div class="modal-bg" id="matrixModal"><div class="modal">  <div class="modal-h"><div><h3>Risk matrix</h3><div class="m-ctx" id="m-ctx">Initial risk · Hazard #1</div></div><button class="x" onclick="closeMatrix()">×</button></div>  <div class="modal-b"><p style="text-align:center;font-size:13px;margin-bottom:14px">Tap the cell where <b>Severity</b> meets <b>Likelihood</b>. Score = Severity × Likelihood.</p><div class="mx" id="mx"></div><div class="mx-axis">Likelihood →</div></div>  <div class="modal-f"><div class="m-readout" id="m-readout">No cell selected</div><div class="actions"><button class="btn" onclick="closeMatrix()">Cancel</button><button class="btn-apply-matrix" onclick="applyMatrix()">Apply rating</button></div></div></div></div>';

  function mount(){
    var host = document.getElementById('risk-assessment');
    if(!host) return;
    var titleAttr = host.getAttribute('data-ra-title');
    var title = titleAttr != null ? titleAttr : 'Risk assessment';
    if(title === ''){
      // caller already renders its own section header → hide the component's <h2>
      host.innerHTML = SECTION.replace(/<h2[^>]*>Risk assessment<\/h2>/, '');
    } else {
      host.innerHTML = SECTION.replace('>Risk assessment<', '>'+title+'<');
    }
    if(!document.getElementById('matrixModal')){
      var wrap=document.createElement('div'); wrap.innerHTML = MODAL;
      document.body.appendChild(wrap.firstElementChild);
    }
    boot();
  }

  function boot(){
    
      var LEVEL='L1';
      window.setLevel = function(lv){
        LEVEL=lv;
        document.getElementById('ra-team').style.display = lv==='L2'?'block':'none';
        // Matrices (initial/residual) toujours visibles en L1 comme en L2 — seul le bloc RA team change.
        document.getElementById('tra-sum').innerHTML = 'Hazards: <b id="haz-count">'+rows.length+'</b> · Highest residual: <b id="haz-max">'+highest()+'</b>';
      }
      var SEV=["5 · Catastrophic","4 · Major","3 · Moderate","2 · Minor","1 · Negligible"];
      var LIK=["1·Rare","2·Unlikely","3·Possible","4·Likely","5·Almost c."];
      function band(s){return s>=15?{k:"hi",label:"High"}:s>=6?{k:"med",label:"Medium"}:{k:"lo",label:"Low"};}
      var mxEl=document.getElementById('mx');
      (function(){var corner=document.createElement('div');corner.className='corner';corner.textContent='Sev / Lik';mxEl.appendChild(corner);
        LIK.forEach(function(l){var h=document.createElement('div');h.className='colh';h.textContent=l;mxEl.appendChild(h);});
        for(var i=0;i<5;i++){var sev=5-i;var rh=document.createElement('div');rh.className='rowh';rh.textContent=SEV[i];mxEl.appendChild(rh);
          for(var lik=1;lik<=5;lik++){var sc=sev*lik,b=band(sc);var c=document.createElement('div');c.className='cell m-'+b.k;c.innerHTML=sc+'<small>'+b.label+'</small>';c.dataset.score=sc;c.dataset.sev=sev;c.dataset.lik=lik;c.dataset.band=b.k;c.dataset.label=b.label;c.onclick=(function(cell){return function(){selCell(cell);};})(c);mxEl.appendChild(c);}}})();
      var current={rowId:null,kind:null,cell:null};var modal=document.getElementById('matrixModal');
      window.openMatrix = function(rowId,kind){current={rowId:rowId,kind:kind,cell:null};document.getElementById('m-ctx').textContent=(kind==='initial'?'Initial risk':'Residual risk')+' · Hazard #'+(rowIndex(rowId)+1);document.getElementById('m-readout').textContent='No cell selected';document.querySelectorAll('.mx .cell.sel').forEach(function(c){c.classList.remove('sel');});modal.classList.add('on');}
      window.closeMatrix = function(){modal.classList.remove('on');}
      modal.addEventListener('click',function(e){if(e.target.id==='matrixModal')closeMatrix();});
      window.selCell = function(c){document.querySelectorAll('.mx .cell.sel').forEach(function(x){x.classList.remove('sel');});c.classList.add('sel');current.cell=c;document.getElementById('m-readout').innerHTML='Sev '+c.dataset.sev+' × Lik '+c.dataset.lik+' = <b>'+c.dataset.score+'</b> · '+c.dataset.label;}
      window.applyMatrix = function(){if(!current.cell){closeMatrix();return;}var d=current.cell.dataset;setRisk(current.rowId,current.kind,{score:d.score,band:d.band,label:d.label,sev:d.sev,lik:d.lik});closeMatrix();}
      var seq=0;var rows=[];var body=document.getElementById('tra-body');
      var HG=["Fire / ignition","Working at height","Electrical","Pressure","Chemical / COSHH","Mechanical"];
      var CTRLS=["Fire watch posted","Gas test satisfactory","Isolation confirmed","Barriers in place"];
      function rowIndex(id){return rows.findIndex(function(r){return r.id===id;});}
      function highest(){var max=null;rows.forEach(function(r){if(r.residual){var s=+r.residual.score;if(max===null||s>max.score)max={score:s,label:r.residual.label};}});return max?max.label+' · '+max.score:'—';}
      function riskCellHTML(rowId,kind,d){var st='class="ra2cell" style="text-align:center"';
        if(!d)return '<td '+st+'><button class="btn-select" style="padding:7px 12px;font-size:12px" onclick="openMatrix('+rowId+',\''+kind+'\')">Select…</button></td>';
        var bg=d.band==='hi'?'var(--danger)':d.band==='med'?'#F5C518':'var(--ok)';var col=d.band==='med'?'#3a2e00':'#fff';
        return '<td '+st+'><span onclick="openMatrix('+rowId+',\''+kind+'\')" style="cursor:pointer;display:inline-block;min-width:34px;padding:7px 10px;border-radius:6px;font-weight:700;color:'+col+';background:'+bg+'">'+d.score+'</span></td>';}
      window.addRow = function(){var id=++seq;rows.push({id:id,initial:null,residual:null});var tr=document.createElement('tr');tr.id='row-'+id;
        tr.innerHTML='<td style="text-align:center;color:var(--muted);font-weight:700">'+rows.length+'</td>'+
          '<td class="col-grp"><select>'+HG.map(function(g){return '<option>'+g+'</option>';}).join('')+'</select><textarea placeholder="Ignition source near hydrocarbon lines" style="margin-top:5px"></textarea></td>'+
          riskCellHTML(id,'initial',null)+
          '<td class="col-ctrl"><select>'+CTRLS.map(function(c){return '<option>'+c+'</option>';}).join('')+'</select><textarea placeholder="ADHOC controls — optional (free text)" style="margin-top:5px"></textarea></td>'+
          riskCellHTML(id,'residual',null)+
          '<td><button class="row-del" onclick="delRow('+id+')">✕</button></td>';
        body.appendChild(tr);document.getElementById('haz-count').textContent=rows.length;applyRaExpand();}
      var RA_LIMIT=5;
      function applyRaExpand(){
        var trs=body.querySelectorAll('tr');
        trs.forEach(function(tr,i){ tr.style.display = (i<RA_LIMIT || body.classList.contains('ra-expanded')) ? '' : 'none'; });
        var btn=document.getElementById('raExpandBtn');
        var hidden=Math.max(0, trs.length-RA_LIMIT);
        if(!btn){
          var foot=document.querySelector('.tra-foot');
          if(foot){ btn=document.createElement('button'); btn.id='raExpandBtn'; btn.className='ra-expand-btn';
            btn.onclick=function(){ body.classList.toggle('ra-expanded'); applyRaExpand(); };
            foot.parentNode.insertBefore(btn, foot); }
        }
        if(btn){
          if(hidden>0){ btn.style.display='block';
            btn.textContent = body.classList.contains('ra-expanded') ? '▲ Show less' : ('▾ Show all '+trs.length+' hazards ('+hidden+' more)');
          } else { btn.style.display='none'; }
        }
      }
      window.setRisk = function(rowId,kind,d){rows[rowIndex(rowId)][kind]=d;var tr=document.getElementById('row-'+rowId);var cells=tr.querySelectorAll('.ra2cell');var idx=kind==='initial'?0:1;
        var tmp=document.createElement('tbody');tmp.innerHTML='<tr>'+riskCellHTML(rowId,kind,d)+'</tr>';cells[idx].replaceWith(tmp.querySelector('td'));
        if(document.getElementById('haz-max'))document.getElementById('haz-max').textContent=highest();}
      window.delRow = function(id){var i=rowIndex(id);if(i<0)return;rows.splice(i,1);document.getElementById('row-'+id).remove();[].slice.call(body.children).forEach(function(tr,k){tr.firstElementChild.textContent=k+1;});document.getElementById('haz-count').textContent=rows.length;}
      addRow();addRow();
      setLevel('L1');
      try{
      var secs=[].slice.call(document.querySelectorAll('.sec')),ri=[].slice.call(document.querySelectorAll('.rail-btn'));
      var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var i=secs.indexOf(e.target);if(i>=0){ri.forEach(function(r,k){if(k<4)r.classList.remove('active');});if(ri[i])ri[i].classList.add('active');}}});},{rootMargin:'-30% 0px -60% 0px'});
      secs.forEach(function(s){io.observe(s);});
      }catch(e){/* rail highlight is non-critical */}
    
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
