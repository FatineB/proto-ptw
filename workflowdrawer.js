/* ePTW shared Workflow modal component — offline-safe.
   A centered modal showing an object's full lifecycle content.
   Trigger from anywhere: onclick="openWorkflow()"

   The page supplies title + body via a hidden template:
     <template id="wf-template" data-wf-title="…" data-wf-sub="…">
       …rich workflow markup (cards / timeline / state machine)…
     </template>

   Uses the shared .modal-bg / .modal styles (same as other modals). */
(function(){
  var MODAL_ID='wfModalCmp';

  function build(){
    if(document.getElementById(MODAL_ID)) return;
    var tpl=document.getElementById('wf-template');
    var title=tpl?(tpl.getAttribute('data-wf-title')||'Workflow'):'Workflow';
    var sub=tpl?(tpl.getAttribute('data-wf-sub')||''):'';
    var body=tpl?tpl.innerHTML:'<div>No workflow data.</div>';

    var modal=document.createElement('div');
    modal.className='modal-bg'; modal.id=MODAL_ID;
    modal.innerHTML=
      '<div class="modal wf-modal">'+
        '<div class="modal-h"><div><h3>'+title+'</h3>'+
          (sub?'<div class="wf-sub">'+sub+'</div>':'')+'</div>'+
          '<button class="x" data-wf-close>×</button></div>'+
        '<div class="modal-b wf-modal-b">'+body+'</div>'+
      '</div>';
    document.body.appendChild(modal);

    modal.querySelector('[data-wf-close]').addEventListener('click', closeWorkflow);
    modal.addEventListener('click', function(e){ if(e.target.id===MODAL_ID) closeWorkflow(); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeWorkflow(); });
  }

  window.openWorkflow=function(){
    build();
    document.getElementById(MODAL_ID).classList.add('on');
  };
  window.closeWorkflow=function(){
    var m=document.getElementById(MODAL_ID);
    if(m) m.classList.remove('on');
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
