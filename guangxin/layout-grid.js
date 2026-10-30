/* Shared 12-column placement for the editor and the published workbench. */
(() => {
  const canvas = document.querySelector('#ldCanvas');
  const designer = document.querySelector('#layoutDesigner');
  const library = document.querySelector('#ldLibrary');
  const ROW = window.PortalCanvasGeometry?.row||100, GAP = window.PortalCanvasGeometry?.gap||12;
  const types = ['reminders','todo','schedule','mail','approval','apps','portalBanner','portalNews','portalGroup','portalReminders','portalNotices','portalAnnouncements','hotTracking'];
  const storeKey = () => designer.classList.contains('mobile-device') ? 'portal-mobile-grid-v2' : 'portal-web-grid-v2';
  const mobile = () => designer.classList.contains('mobile-device');
  let positions = [], drag = null, placeholder = null, ghost = null, layer = null, floor = null, draftCache = {}, refreshQueued = false, pointerPending = null, suppressClick = false, resizing = null, mobilePending = null, mobileDrag = null;
  function read(key) { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } }
  // Apply the requested new initial brief proportions once to existing drafts.
  // Subsequent user resizes remain untouched.
  try{if(localStorage.getItem('daily-brief-initial-size-v3')!=='done'){
    const key='portal-web-grid-v2',rows=read(key);
    if(rows.length)localStorage.setItem(key,JSON.stringify(rows.map(p=>p.type==='reminders'?{...p,w:3,h:5,x:Math.min(p.x||0,9)}:p)));
    localStorage.setItem('daily-brief-initial-size-v3','done');
  }}catch{}
  const style = document.createElement('style');
  style.textContent = `
  #layoutDesigner #ldCanvas,#savedWorkGrid{display:grid!important;grid-template-columns:repeat(12,minmax(0,1fr))!important;grid-auto-rows:${ROW}px!important;grid-template-rows:none!important;gap:${GAP}px!important;align-content:start!important;align-items:stretch!important;position:relative;isolation:isolate}
  #layoutDesigner #ldCanvas{background:#f4f5f7!important;overflow:auto!important;padding:28px 40px 32px!important}
  #ldCanvas>.ld-widget,#savedWorkGrid>.ld-widget{position:relative;z-index:1;min-height:0!important;height:100%!important;max-height:100%!important;overflow-x:hidden!important;overflow-y:auto!important;box-sizing:border-box;align-self:stretch!important;padding:18px 20px!important;background:#fff;border:1px solid #e5eaf1;border-radius:10px;box-shadow:0 2px 5px #203b5810;transition:box-shadow .15s}
  #ldCanvas>.ld-widget.selected{outline:2px solid #14aaa0}
  #ldCanvas>.ld-widget.selected:before{display:none}
  #ldCanvas>.ld-widget[data-type="portalBanner"],#savedWorkGrid>.ld-widget[data-type="portalBanner"]{padding:0!important}
  #ldCanvas .ld-resize{display:none!important}
  #ldCanvas>.ld-widget :is(button,input,select,textarea,a,[contenteditable]){pointer-events:none!important;cursor:inherit!important}
  #ldCanvas>.ld-widget .ld-remove{pointer-events:auto!important;cursor:pointer!important}
  #ldCanvas>.ld-widget :is(button,input,select,textarea)[disabled]{opacity:1;-webkit-text-fill-color:currentColor}

  #layoutDesigner #ldCanvas>.ld-widget>.grid-resize-handle{position:absolute;right:1px;bottom:1px;width:25px;height:25px;z-index:6;display:block;cursor:nwse-resize;touch-action:none;background:repeating-linear-gradient(135deg,transparent 0 4px,#81a7ba 4px 6px,transparent 6px 9px);clip-path:polygon(100% 0,100% 100%,0 100%);opacity:.8;border-radius:0 0 8px 0}
  #ldCanvas>.ld-widget.grid-resizing{outline:2px solid #14aaa0;z-index:3}
  #ldCanvas>.ld-widget.grid-resizing:after{content:attr(data-grid-size);position:absolute;bottom:9px;right:30px;background:#1677ff;color:white;border-radius:5px;padding:4px 8px;font-size:11px;pointer-events:none}
  body.layout-resize-active,body.layout-resize-active *{cursor:nwse-resize!important;user-select:none!important}
  #layoutDesigner.mobile-device .grid-resize-handle{display:none!important}
  :is(#ldCanvas,#savedWorkGrid) .cw-apps{grid-template-columns:repeat(auto-fit,minmax(min(100%,85px),1fr))!important}
  :is(#ldCanvas,#savedWorkGrid) .cw-alerts{grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))!important}
  :is(#ldCanvas,#savedWorkGrid) :is(.pt-news,.pt-group-news){grid-template-columns:repeat(auto-fit,minmax(min(100%,175px),1fr))!important}
  @container(max-width:300px){
    :is(#ldCanvas,#savedWorkGrid) .cw-head{flex-wrap:wrap;gap:4px}
    :is(#ldCanvas,#savedWorkGrid) .cw-head h3{flex-basis:100%;font-size:13px!important}
    :is(#ldCanvas,#savedWorkGrid) .cw-row{gap:4px;font-size:11px!important}
    :is(#ldCanvas,#savedWorkGrid) .cw-row time{max-width:65px;overflow:hidden;text-overflow:ellipsis}
    :is(#ldCanvas,#savedWorkGrid) .cw-tag{display:none}
    :is(#ldCanvas,#savedWorkGrid) .cw-event{flex-wrap:wrap}
    :is(#ldCanvas,#savedWorkGrid) .cw-approval-tabs{flex-wrap:wrap}
    :is(#ldCanvas,#savedWorkGrid) .cw-approval-tabs button{min-width:65px}
  }
  .grid-cell-layer{position:absolute;pointer-events:none;z-index:0;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));grid-auto-rows:${ROW}px;gap:${GAP}px}
  .grid-cell{border:1px dashed #b6cfee;border-radius:8px;background:#edf4ff80;box-sizing:border-box}
  .grid-drop-preview{z-index:0!important;pointer-events:none;border:1px solid #90bfff;border-radius:9px;background:#cee5ffcc;box-shadow:inset 0 0 0 1px #aecfff}
  #ldCanvas>.grid-dragging{visibility:hidden;pointer-events:none}
  .grid-floating-card{position:fixed;z-index:300;pointer-events:none;background:#fff;border:1px solid #dce6ee;border-radius:10px;box-shadow:0 14px 35px #1f426e38;overflow:hidden;opacity:.97}
  .grid-floating-card .ld-remove,.grid-floating-card .ld-resize{display:none}
  .grid-floating-card .cw-box,.grid-floating-card .pt-panel{border:0;margin:0;padding:0}
  .grid-floating-card .grid-floating-body{padding:20px;height:calc(100% - 42px);overflow:hidden;box-sizing:border-box}
  .grid-floating-card .grid-floating-footer{height:42px;border-top:1px solid #edf0f4;display:flex;align-items:center;justify-content:center;background:white;color:#7b8b9c;font-size:12px}
  .grid-floor{visibility:hidden;pointer-events:none;height:1px}
  #layoutDesigner.mobile-device #ldCanvas>.ld-widget{grid-column:1 / -1!important;grid-row:auto!important;max-height:none!important;height:auto!important;min-height:150px!important}
  #layoutDesigner.mobile-device #ldCanvas{grid-auto-rows:auto!important;background:#f1f5fa!important;align-content:start!important;border:1px dashed #bdd2ed!important;padding:18px!important}
  .mobile-component-title{display:none}
  #layoutDesigner.mobile-device #ldCanvas>.ld-widget{height:auto!important;min-height:120px!important;max-height:420px!important;padding:16px!important;overflow-y:auto!important;overflow-x:hidden!important;cursor:grab}
  #layoutDesigner.mobile-device.mobile-adjusting #ldCanvas>.ld-widget{height:70px!important;min-height:70px!important;max-height:70px!important;padding:0 16px!important;border:1px solid transparent;box-shadow:none;overflow:hidden!important}
  #layoutDesigner.mobile-device.mobile-adjusting #ldCanvas>.ld-widget>:not(.mobile-component-title):not(.ld-remove){display:none!important}
  #layoutDesigner.mobile-device.mobile-adjusting #ldCanvas .mobile-component-title,.mobile-floating-title .mobile-component-title{display:flex;align-items:center;gap:10px;height:68px;min-width:0;padding-right:16px;font-size:16px;color:#263b53}
  .mobile-component-title img{width:26px;height:26px;flex-shrink:0;background:#edf4ff;border-radius:5px;padding:3px;box-sizing:border-box}
  .mobile-component-title b{min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
  #layoutDesigner.mobile-device #ldCanvas>.ld-widget.selected{outline:2px solid #3bb5ad}
  #layoutDesigner.mobile-device #ldCanvas>.ld-widget.mobile-moving{display:none!important}
  .mobile-drop-preview{grid-column:1 / -1;height:70px;border:2px solid #70bcb8;background:#dcefea80;box-sizing:border-box;border-radius:8px;pointer-events:none}
  .mobile-floating-title{position:fixed;z-index:300;background:white;box-shadow:0 7px 25px #1b4e6b2e;border:1px solid #5ab9b3;border-radius:8px;pointer-events:none;padding:0 16px;box-sizing:border-box;opacity:.85}

  #ldCanvas>.ld-widget{cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none}
  #ldCanvas>.ld-widget img{user-select:none;-webkit-user-drag:none}
  body.layout-drag-active,body.layout-drag-active *{cursor:grabbing!important;user-select:none!important}
  `;
  document.head.append(style);
  function width(type) { const preset=window.PortalDefaults?.grid.find(p=>p.type===type);if(preset)return preset.w;return type === 'reminders' ? 3 : ['portalBanner','portalNews','portalGroup'].includes(type) ? 8 : ['mail','approval','apps','portalReminders','portalNotices','portalAnnouncements'].includes(type) ? 4 : 6; }
  function disableDesignControls(el){
    el.querySelectorAll('button,input,select,textarea,a,[contenteditable]').forEach(control=>{
      if(control.matches('.ld-remove'))return;
      if('disabled' in control)control.disabled=true;
      control.setAttribute('aria-disabled','true');control.setAttribute('tabindex','-1');
      if(control.hasAttribute('contenteditable'))control.setAttribute('contenteditable','false');
    });
  }
  new MutationObserver(()=>cards().forEach(disableDesignControls)).observe(canvas,{childList:true,subtree:true});
  function cards(root = canvas) { return [...root.querySelectorAll(':scope > .ld-widget')]; }
  function metrics(root = canvas) { const s=getComputedStyle(root); const left=parseFloat(s.paddingLeft)||0, right=parseFloat(s.paddingRight)||0, top=parseFloat(s.paddingTop)||0; return {left,top,width:root.clientWidth-left-right,col:(root.clientWidth-left-right+GAP)/12}; }
  function place(el,p) { el.style.setProperty('grid-column',`${p.x+1} / span ${p.w}`,'important'); el.style.setProperty('grid-row',`${p.y+1} / span ${p.h}`,'important'); }
  function overlap(a,b) { return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }
  function normalize(p,type) { const w=Math.max(1,Math.min(12,Math.round(Number(p.w)||width(type))));return {type,w,h:Math.max(1,Math.min(30,Number(p.h)||3)),x:Math.max(0,Math.min(12-w,Number(p.x)||0)),y:Math.max(0,Number(p.y)||0)}; }
  function settle(list,fixed,index=-1) {
    const result=list.map(p=>({...p})), used=fixed?[fixed]:[];
    const ordered=list.map((p,i)=>({p,i})).filter(v=>v.i!==index).sort((a,b)=>a.p.y-b.p.y||a.p.x-b.p.x);
    if(fixed&&index>=0)result[index]={...fixed};
    for(const {p:old,i} of ordered){const p={...old};const maxY=Math.max(0,...used.map(q=>q.y+q.h));
      search:for(let y=0;y<=maxY;y++){const columns=Array.from({length:13-p.w},(_,x)=>x);for(const x of columns){p.x=x;p.y=y;if(!used.some(q=>overlap(p,q)))break search;}}
      used.push(p);result[i]=p;
    }return result;
  }
  // Pack from top to bottom and left to right; later components can occupy
  // holes beside or above earlier ones whenever their grid footprint fits.
  function compactGrid(list){
    const result=list.map(p=>({...p})),used=[];
    const order=result.map((p,i)=>({p,i})).sort((a,b)=>a.p.y-b.p.y||a.p.x-b.p.x||a.i-b.i);
    for(const {p} of order){const bottom=Math.max(0,...used.map(q=>q.y+q.h));
      search:for(let y=0;y<=bottom;y++)for(let x=0;x<=12-p.w;x++){
        const candidate={...p,x,y};if(!used.some(q=>overlap(candidate,q))){p.x=x;p.y=y;break search;}
      }
      used.push(p);
    }
    return result;
  }
  function measure(el,w,root=canvas) {const preset=window.PortalDefaults?.grid.find(p=>p.type===el.dataset.type);if(preset)return preset.h;const oldHeight=el.style.height, oldCol=el.style.gridColumn, oldRow=el.style.gridRow; el.style.setProperty('grid-column',`1 / span ${w}`,'important');el.style.setProperty('grid-row','1','important');el.style.setProperty('height','auto','important');const height=Math.max(el.scrollHeight,el.getBoundingClientRect().height,150);el.style.height=oldHeight;el.style.gridColumn=oldCol;el.style.gridRow=oldRow;return Math.max(2,Math.ceil((height+GAP)/(ROW+GAP))); }
  function keyRows(nodes) { const counts={};return nodes.map(el=>{const t=el.dataset.type;return t+':'+(counts[t]=(counts[t]||0)+1);}); }
  function persisted(root,key) { const nodes=cards(root), stored=(key==='portal-web-grid-v2'&&!ComponentAccess.hasPersonalWork()&&ComponentAccess.initial('work')?.grid?.length)?ComponentAccess.initial('work').grid:read(key),rows=stored.length?stored:(key==='portal-web-grid-v2'?window.PortalDefaults?.grid||[]:[]), keys=keyRows(nodes);return nodes.map((el,i)=>{const found=rows.find(p=>p.key===keys[i]&&p.type===el.dataset.type);return found||null;}); }
  function refresh() {
    refreshQueued=false;if(drag||resizing||designer.hidden)return;
    if(mobile()){if(layer)layer.remove();if(floor)floor.remove();layer=floor=null;renderMobileTitles();return;}
    const nodes=cards(), keys=keyRows(nodes), saved=persisted(canvas,storeKey()), cache=draftCache[storeKey()]||{};
    let used=[]; positions=nodes.map((el,i)=>{const type=el.dataset.type,old=cache[keys[i]]||saved[i];let p;
      if(old)p=normalize(old,type);else{p={type,w:width(type),h:measure(el,width(type)),x:0,y:0};outer:for(let y=0;y<1000;y++){for(let x=0;x<=12-p.w;x++){p.x=x;p.y=y;if(!used.some(q=>overlap(p,q)))break outer;}}}
      while(used.some(q=>overlap(p,q)))p.y++;p.key=keys[i];used.push(p);place(el,p);ensureResize(el);return p;});
    if(Object.keys(cache).some(key=>!keys.includes(key))){positions=settle(positions,null);nodes.forEach((el,i)=>place(el,positions[i]));}
    positions=compactGrid(positions);nodes.forEach((el,i)=>place(el,positions[i]));
    remember();paintCells();
  }
  const mobileLabels={hotTracking:['AI热点追踪与事件演化','global'],reminders:['AI每日简报','robot'],todo:['统一待办','audit'],schedule:['我的日程','calendar'],mail:['邮件提醒','bell'],approval:['我的审批','audit'],apps:['常用功能','appstore'],portalBanner:['轮播图','home'],portalNews:['AI智能资讯','bar-chart'],portalGroup:['集团综合资讯','file-text'],portalReminders:['智能提醒','robot'],portalNotices:['最新通知','bell'],portalAnnouncements:['最新公告','file-text']};
  function renderMobileTitles(){cards().forEach(el=>{if(el.querySelector(':scope>.mobile-component-title'))return;const [title,icon]=mobileLabels[el.dataset.type]||[el.dataset.type,'appstore'];const header=document.createElement('div');header.className='mobile-component-title';const image=document.createElement('img');image.src='portal-prototype/assets/icons/'+icon+'.svg';image.alt='';const name=document.createElement('b');name.textContent=title;header.append(image,name);el.prepend(header);});}
  function startMobileMove(e){const p=mobilePending;
    const box=p.el.getBoundingClientRect();designer.classList.add('mobile-adjusting');const compact=p.el.getBoundingClientRect();canvas.scrollTop+=compact.top-box.top;const clone=p.el.querySelector('.mobile-component-title').cloneNode(true);
    const floating=document.createElement('div');floating.className='mobile-floating-title';floating.append(clone);floating.style.width=box.width+'px';document.body.append(floating);
    const marker=document.createElement('div');marker.className='mobile-drop-preview';canvas.insertBefore(marker,p.el);p.el.classList.add('mobile-moving');
    mobileDrag={...p,floating,marker,from:cards().indexOf(p.el),to:cards().indexOf(p.el),offY:Math.min(35,Math.max(8,p.y-box.top))};
    document.body.classList.add('layout-drag-active');
  }
  function moveMobile(e){const d=mobileDrag;if(!d)return;const box=canvas.getBoundingClientRect();d.floating.style.left=(box.left+14)+'px';d.floating.style.top=(e.clientY-d.offY)+'px';const others=cards().filter(el=>el!==d.el);let index=others.findIndex(el=>{const r=el.getBoundingClientRect();return e.clientY<r.top+r.height/2});if(index<0)index=others.length;d.to=index;const target=others[index];if(target)canvas.insertBefore(d.marker,target);else canvas.append(d.marker);if(e.clientY>box.bottom-60)canvas.scrollTop+=12;else if(e.clientY<box.top+50)canvas.scrollTop-=12;}
  function finishMobile(commit){
    if(mobilePending)clearTimeout(mobilePending.holdTimer);
    const d=mobileDrag;mobileDrag=null;mobilePending=null;
    designer.classList.remove('mobile-adjusting');if(!d)return;
    d.el.classList.remove('mobile-moving');d.floating.remove();d.marker.remove();document.body.classList.remove('layout-drag-active');
    if(d.el.hasPointerCapture(d.id))d.el.releasePointerCapture(d.id);
    if(commit&&d.from!==d.to)canvas.dispatchEvent(new CustomEvent('designer-mobile-reorder',{detail:{from:d.from,to:d.to}}));
    queue();
  }
  function ensureResize(el){
    if(el.querySelector(':scope>.grid-resize-handle'))return;
    const handle=document.createElement('span');handle.className='grid-resize-handle';handle.title='按住右下角，按格调整大小';handle.setAttribute('aria-label','按网格调整组件大小');el.append(handle);
  }
  function startResize(e,el){
    refresh();const index=cards().indexOf(el);if(index<0)return;
    e.preventDefault();e.stopImmediatePropagation();
    resizing={el,index,id:e.pointerId,x:e.clientX,y:e.clientY,scroll:canvas.scrollTop,base:positions.map(p=>({...p})),target:{...positions[index]}};
    el.classList.add('grid-resizing');el.setPointerCapture(e.pointerId);
    placeholder=document.createElement('div');placeholder.className='grid-drop-preview';canvas.append(placeholder);place(placeholder,resizing.target);
    document.body.classList.add('layout-resize-active');showResizeSize();
  }
  function showResizeSize(){if(resizing)resizing.el.dataset.gridSize=resizing.target.w+' 列 × '+resizing.target.h+' 行';}
  function resizeMove(e){const r=resizing,m=metrics(),base=r.base[r.index];
    r.target.w=Math.max(1,Math.min(12-base.x,base.w+Math.round((e.clientX-r.x)/m.col)));
    r.target.h=Math.max(1,Math.min(30,base.h+Math.round((e.clientY-r.y+canvas.scrollTop-r.scroll)/(ROW+GAP))));
    positions=settle(r.base,r.target,r.index);cards().forEach((el,i)=>place(el,positions[i]));place(placeholder,r.target);paintCells();showResizeSize();
  }
  function finishResize(commit){if(!resizing)return;const r=resizing;positions=commit?compactGrid(positions):r.base;resizing=null;
    if(r.el.hasPointerCapture(r.id))r.el.releasePointerCapture(r.id);
    r.el.classList.remove('grid-resizing');delete r.el.dataset.gridSize;placeholder?.remove();placeholder=null;
    cards().forEach((el,i)=>place(el,positions[i]));document.body.classList.remove('layout-resize-active');if(commit)remember();paintCells();
  }
  function remember(){draftCache[storeKey()]=Object.fromEntries(positions.map(p=>[p.key,{...p}]));}
  function paintCells(list=positions) {
    if(mobile())return;const m=metrics(), rows=Math.max(9,...list.map(p=>p.y+p.h+2),drag?drag.target.y+drag.target.h+2:0);
    if(!layer||layer.parentElement!==canvas){layer=document.createElement('div');layer.className='grid-cell-layer';layer.setAttribute('aria-hidden','true');canvas.append(layer);}
    layer.style.left=m.left+'px';layer.style.top=m.top+'px';layer.style.width=m.width+'px';
    const count=rows*12;if(layer.children.length!==count){layer.replaceChildren(...Array.from({length:count},()=>{const cell=document.createElement('div');cell.className='grid-cell';return cell;}));}
    if(!floor||floor.parentElement!==canvas){floor=document.createElement('div');floor.className='grid-floor';canvas.append(floor);}floor.style.gridColumn='1 / -1';floor.style.gridRow=String(rows);
  }
  function queue(){if(!refreshQueued){refreshQueued=true;requestAnimationFrame(refresh);}}
  new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&(n.classList.contains('ld-widget')||n.classList.contains('ld-empty')))))queue();}).observe(canvas,{childList:true});
  new MutationObserver(()=>{if(!designer.hidden)queue();}).observe(designer,{attributes:true,attributeFilter:['class','hidden']});
  new ResizeObserver(()=>{if(!drag)queue();}).observe(canvas);
  function start(e,el,index,type) {
    e.stopImmediatePropagation(); if(mobile())return;if(index<0&&cards().some(el=>el.dataset.type===type))return;
    refresh();const rect=el.getBoundingClientRect(),m=metrics();let target=index>=0?{...positions[index]}:{type,w:width(type),h:3,x:0,y:0};
    if(index<0){const body=el.querySelector('.ld-preview-content');const probe=document.createElement('article');probe.className='ld-widget';probe.dataset.type=type;probe.innerHTML=body.innerHTML;canvas.append(probe);target.h=measure(probe,target.w);probe.remove();}
    ghost=document.createElement('div');ghost.className='grid-floating-card';ghost.style.width=(target.w*m.col-GAP)+'px';ghost.style.height=(target.h*(ROW+GAP)-GAP)+'px';
    const body=document.createElement('div');body.className='grid-floating-body';body.innerHTML=index>=0?el.innerHTML:el.querySelector('.ld-preview-content').innerHTML;body.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));ghost.append(body);const foot=document.createElement('div');foot.className='grid-floating-footer';foot.textContent='松手放置组件';ghost.append(foot);document.body.append(ghost);
    const offX=index>=0?Math.min(e.clientX-rect.left,rect.width-20):30,offY=index>=0?Math.min(e.clientY-rect.top,80):30;
    drag={index,type,target,base:positions.map(p=>({...p})),offX,offY,valid:false,lastX:e.clientX,lastY:e.clientY};
    if(index>=0)el.classList.add('grid-dragging');
    placeholder=document.createElement('div');placeholder.className='grid-drop-preview';canvas.append(placeholder);place(placeholder,target);
    document.body.classList.add('layout-drag-active');e.dataTransfer.effectAllowed=index>=0?'move':'copy';e.dataTransfer.setData('text/plain',type);
    const blank=document.createElement('canvas');blank.width=1;blank.height=1;e.dataTransfer.setDragImage(blank,0,0);moveGhost(e.clientX,e.clientY);
  }
  function moveGhost(x,y){if(!drag||!ghost)return;ghost.style.left=(x-drag.offX)+'px';ghost.style.top=(y-drag.offY)+'px';}
  canvas.addEventListener('dragstart',e=>{const card=e.target.closest('.ld-widget');if(!card||mobile())return;start(e,card,cards().indexOf(card),card.dataset.type);},true);
  library.addEventListener('dragstart',e=>{const source=e.target.closest('.ld-source');if(source&&!mobile())start(e,source,-1,types[[...library.children].indexOf(source)]);},true);
  function update(x,y){if(!drag)return;const r=canvas.getBoundingClientRect(),m=metrics();drag.lastX=x;drag.lastY=y;moveGhost(x,y);drag.valid=x>=r.left+m.left&&x<r.right&&y>=r.top&&y<=r.bottom;if(!drag.valid){placeholder.style.visibility='hidden';return;}placeholder.style.visibility='visible';drag.target.x=Math.max(0,Math.min(12-drag.target.w,Math.round((x-r.left-m.left-drag.offX)/m.col)));drag.target.y=Math.max(0,Math.round((y-r.top+canvas.scrollTop-m.top-drag.offY)/(ROW+GAP)));positions=settle(drag.base,drag.target,drag.index);cards().forEach((el,i)=>{if(i!==drag.index)place(el,positions[i]);});place(placeholder,drag.target);paintCells(positions);}
  document.addEventListener('dragenter',e=>{if(drag){e.preventDefault();e.dataTransfer.dropEffect=drag.index<0?'copy':'move';}},true);
  document.addEventListener('dragover',e=>{if(!drag)return;e.preventDefault();e.stopImmediatePropagation();e.dataTransfer.dropEffect=drag.index<0?'copy':'move';update(e.clientX,e.clientY);},true);
  let scrollFrame;function scroll(){if(drag&&drag.valid){const r=canvas.getBoundingClientRect();const delta=drag.lastY>r.bottom-75?16:drag.lastY<r.top+60?-16:0;if(delta){canvas.scrollTop+=delta;update(drag.lastX,drag.lastY);}}scrollFrame=requestAnimationFrame(scroll);}scroll();
  function commitDrop(){if(!drag)return;if(!drag.valid){finish(false);return;}const state=drag;if(state.index<0){let n=1;while(positions.some(p=>p.key===state.type+':'+n))n++;positions.push({...state.target,key:state.type+':'+n});remember();finish(true);library.children[types.indexOf(state.type)].click();}else{remember();finish(true);}}
  document.addEventListener('drop',e=>{if(!drag)return;e.preventDefault();e.stopImmediatePropagation();commitDrop();},true);
  // Use pointer movement rather than relying on native HTML drag initiation:
  // nested buttons, text and images must drag the whole component too.
  document.addEventListener('pointerdown',e=>{
    if(designer.hidden||e.button!==0)return;
    if(mobile()){const el=e.target.closest('#ldCanvas>.ld-widget');if(!el||e.target.closest('.ld-remove'))return;e.preventDefault();e.stopImmediatePropagation();mobilePending={el,id:e.pointerId,x:e.clientX,y:e.clientY,clickTarget:e.target.closest('button,[data-pt-detail],.cw-row,.cw-event')};mobilePending.holdTimer=setTimeout(()=>{if(mobilePending&&!mobileDrag){startMobileMove(e);moveMobile(e)}},180);return;}
    const card=e.target.closest('#ldCanvas>.ld-widget'),source=e.target.closest('#ldLibrary>.ld-source');
    if(card&&e.target.closest('.grid-resize-handle')){startResize(e,card);return;}
    if((!card&&!source)||e.target.closest('.ld-remove,.ld-library-close'))return;
    if(!card&&e.target.closest('textarea,input,select,[contenteditable="true"]'))return;
    e.preventDefault();e.stopImmediatePropagation();
    const el=card||source;
    pointerPending={el,card:!!card,id:e.pointerId,x:e.clientX,y:e.clientY,clickTarget:e.target.closest('button,[data-pt-detail],.cw-row,.cw-event')};
  },true);
  document.addEventListener('pointermove',e=>{
    if(mobilePending&&e.pointerId===mobilePending.id){if(!mobileDrag&&Math.hypot(e.clientX-mobilePending.x,e.clientY-mobilePending.y)<5)return;e.preventDefault();e.stopImmediatePropagation();if(!mobileDrag)startMobileMove(e);moveMobile(e);return;}
    if(resizing&&e.pointerId===resizing.id){e.preventDefault();e.stopImmediatePropagation();resizeMove(e);return;}
    if(!pointerPending||e.pointerId!==pointerPending.id)return;
    const p=pointerPending;
    if(!drag&&Math.hypot(e.clientX-p.x,e.clientY-p.y)<5)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(!drag){p.el.setPointerCapture(e.pointerId);const index=p.card?cards().indexOf(p.el):-1,type=p.card?p.el.dataset.type:types[[...library.children].indexOf(p.el)];
      start({clientX:p.x,clientY:p.y,stopImmediatePropagation(){},dataTransfer:{setData(){},setDragImage(){}}},p.el,index,type);
    }
    update(e.clientX,e.clientY);
  },true);
  function activateClick(e,p){
    if(p.card||p.el.closest('#ldCanvas'))return;
    if(!p.clickTarget||!p.el.contains(p.clickTarget)||p.clickTarget.disabled)return;
    e.preventDefault();e.stopImmediatePropagation();suppressClick=true;
    // WebViews may cancel native click after pointerdown.preventDefault().
    // Explicitly activate a stationary click, suppressing its native duplicate.
    p.clickTarget.click();setTimeout(()=>suppressClick=false,0);
  }
  document.addEventListener('pointerup',e=>{
    if(mobilePending&&e.pointerId===mobilePending.id){const wasMoving=!!mobileDrag,p=mobilePending;clearTimeout(p.holdTimer);mobilePending=null;if(p.el.hasPointerCapture(e.pointerId))p.el.releasePointerCapture(e.pointerId);if(wasMoving){e.preventDefault();e.stopImmediatePropagation();finishMobile(true);suppressClick=true;setTimeout(()=>suppressClick=false,0);}else activateClick(e,p);return;}
    if(resizing&&e.pointerId===resizing.id){e.preventDefault();e.stopImmediatePropagation();finishResize(true);suppressClick=true;setTimeout(()=>suppressClick=false,0);return;}
    if(!pointerPending||e.pointerId!==pointerPending.id)return;
    const p=pointerPending,wasDragging=!!drag;pointerPending=null;
    if(p.el.hasPointerCapture(e.pointerId))p.el.releasePointerCapture(e.pointerId);
    if(wasDragging){e.preventDefault();e.stopImmediatePropagation();suppressClick=true;commitDrop();setTimeout(()=>suppressClick=false,0);}else activateClick(e,p);
  },true);
  document.addEventListener('pointercancel',()=>{pointerPending=null;finish(false);finishResize(false);finishMobile(false);},true);
  document.addEventListener('click',e=>{if(suppressClick&&e.isTrusted){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;}},true);
  document.addEventListener('dragstart',e=>{if(pointerPending){e.preventDefault();e.stopImmediatePropagation();}},true);
  function finish(commit){if(!drag)return;if(!commit)positions=drag.base;else{positions=compactGrid(positions);remember();}drag=null;placeholder?.remove();ghost?.remove();placeholder=ghost=null;cards().forEach((el,i)=>{el.classList.remove('grid-dragging');if(positions[i])place(el,positions[i]);});document.body.classList.remove('layout-drag-active');paintCells();}
  document.addEventListener('dragend',()=>finish(false),true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(drag)finish(false);if(resizing)finishResize(false);if(mobileDrag)finishMobile(false);mobilePending=null;}});
  function syncPublished(){const root=document.querySelector('#savedWorkGrid');if(!root)return;const nodes=cards(root),saved=persisted(root,'portal-web-grid-v2');let placed=[];nodes.forEach((el,i)=>{let p;if(saved[i])p=normalize(saved[i],el.dataset.type);else{p={type:el.dataset.type,w:width(el.dataset.type),h:measure(el,width(el.dataset.type),root),x:0,y:0};outer:for(let y=0;y<1000;y++)for(let x=0;x<=12-p.w;x++){p.x=x;p.y=y;if(!placed.some(q=>overlap(p,q)))break outer;}}while(placed.some(q=>overlap(p,q)))p.y++;placed.push(p);});placed=compactGrid(placed);nodes.forEach((el,i)=>place(el,placed[i]));}
  document.querySelector('#ldSave').addEventListener('click',()=>{if(mobile())return;remember();localStorage.setItem(storeKey(),JSON.stringify(positions));syncPublished();});
  document.querySelector('#ldReset').addEventListener('click',()=>{draftCache[storeKey()]={};localStorage.removeItem(storeKey());queue();});
  document.querySelector('#editWork').addEventListener('click',()=>{draftCache={};canvas.scrollTop=0;queue();});
  document.querySelector('#ldBack').addEventListener('click',()=>{draftCache={};});
  window.PortalLayoutGrid={snapshot(){return mobile()?[]:positions.map(p=>({...p}))},set(list){
    if(mobile())return;refresh();const nodes=cards(),keys=keyRows(nodes);
    positions=nodes.map((el,i)=>{const entry=list.find(p=>p.type===el.dataset.type)||positions[i];return {...normalize(entry,el.dataset.type),key:keys[i]}});
    positions=compactGrid(positions);remember();nodes.forEach((el,i)=>place(el,positions[i]));paintCells();
  }};
  syncPublished();
})();
