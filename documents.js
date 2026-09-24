/* ePTW shared Documents component — offline-safe.
   Usage: <div id="documents"
              data-doc-title="4 · Document section"
              data-docs="Document #1.pdf|Document #2.pdf|Document #3.jpg"></div>
   Renders a consultable list of documents (open + remove) and an
   "Add a document" button that opens an upload modal. Colour follows --module.
   Multiple instances per page are supported (pass a unique id + point the
   markup's data-doc-host at it). For the common single-instance case just use
   id="documents". */
(function(){
  var MODAL_ID = 'docUploadModal';

  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  function fileIcon(name){
    var n=(name||'').toLowerCase();
    if(/\.(png|jpe?g|gif|webp|svg)$/.test(n)) return '🖼️';
    if(/\.pdf$/.test(n)) return '📄';
    if(/\.(xls|xlsx|csv)$/.test(n)) return '📊';
    if(/\.(doc|docx)$/.test(n)) return '📝';
    return '🔗';
  }

  function renderList(host){
    var docs = (host.getAttribute('data-docs')||'').split('|').map(function(s){return s.trim();}).filter(Boolean);
    var title = host.getAttribute('data-doc-title');
    var head = title ? '<div class="sec-h"><span class="sh-num">'+ (host.getAttribute('data-doc-num')||'') +'</span><h2>'+esc(title.replace(/^\d+\s*·\s*/,''))+'</h2></div>' : '';
    var items = docs.length
      ? docs.map(function(d){
          return '<span class="doc-item"><a href="#" class="doc-open" title="Open">'+fileIcon(d)+' '+esc(d)+'</a>'+
                 '<button class="doc-rm" title="Remove" aria-label="Remove document">✕</button></span>';
        }).join('')
      : '<div class="doc-empty">No document yet.</div>';
    host.innerHTML =
      head +
      '<div class="doc-list" data-doc-list>'+items+'</div>'+
      '<button class="doc-add" data-doc-add>＋ Add a document</button>';
    bindList(host);
  }

  function bindList(host){
    host.querySelectorAll('.doc-rm').forEach(function(b){
      b.addEventListener('click', function(){
        if(confirm('Remove this document from the list?')) this.closest('.doc-item').remove();
        refreshEmpty(host);
      });
    });
    var addBtn = host.querySelector('[data-doc-add]');
    if(addBtn) addBtn.addEventListener('click', function(){ openUpload(host); });
  }

  function refreshEmpty(host){
    var list = host.querySelector('[data-doc-list]');
    if(list && !list.querySelector('.doc-item') && !list.querySelector('.doc-empty')){
      list.innerHTML = '<div class="doc-empty">No document yet.</div>';
    }
  }

  var activeHost = null;
  function openUpload(host){
    activeHost = host;
    document.getElementById(MODAL_ID).classList.add('on');
  }
  function closeUpload(){ document.getElementById(MODAL_ID).classList.remove('on'); }

  function addDoc(){
    var input = document.getElementById('docUploadName');
    var name = (input.value||'').trim() || 'New document.pdf';
    if(activeHost){
      var list = activeHost.querySelector('[data-doc-list]');
      var empty = list.querySelector('.doc-empty'); if(empty) empty.remove();
      var span = document.createElement('span');
      span.className='doc-item';
      span.innerHTML = '<a href="#" class="doc-open" title="Open">'+fileIcon(name)+' '+esc(name)+'</a>'+
                       '<button class="doc-rm" title="Remove" aria-label="Remove document">✕</button>';
      span.querySelector('.doc-rm').addEventListener('click', function(){ span.remove(); refreshEmpty(activeHost); });
      list.appendChild(span);
    }
    input.value='';
    closeUpload();
  }

  var MODAL =
    '<div class="modal-bg" id="'+MODAL_ID+'"><div class="modal">'+
    '<div class="modal-h"><h3>Add a document</h3><button class="x" data-doc-close>×</button></div>'+
    '<div class="modal-b">'+
      '<div class="field"><label>Choose file <span class="hint">max 25 Mo</span></label>'+
      '<div class="drop"><b>Choose file</b> &nbsp;&nbsp; Max: 25 Mo</div></div>'+
      '<div class="field" style="margin-bottom:0"><label>File name</label>'+
      '<input type="text" id="docUploadName" placeholder="e.g. Barrier impairment note.pdf"></div>'+
    '</div>'+
    '<div class="modal-f"><div class="actions"><button class="btn" data-doc-close>Cancel</button>'+
    '<button class="doc-apply" data-doc-apply>Add document</button></div></div>'+
    '</div></div>';

  function mount(){
    var hosts = document.querySelectorAll('#documents, [data-doc-host]');
    if(!hosts.length) return;
    if(!document.getElementById(MODAL_ID)){
      var wrap=document.createElement('div'); wrap.innerHTML = MODAL;
      document.body.appendChild(wrap.firstElementChild);
      document.querySelectorAll('[data-doc-close]').forEach(function(b){ b.addEventListener('click', closeUpload); });
      var apply=document.querySelector('[data-doc-apply]'); if(apply) apply.addEventListener('click', addDoc);
      var modal=document.getElementById(MODAL_ID);
      modal.addEventListener('click', function(e){ if(e.target.id===MODAL_ID) closeUpload(); });
    }
    hosts.forEach(renderList);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
