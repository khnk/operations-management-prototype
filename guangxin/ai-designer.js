(() => {
  const designer=document.querySelector('#layoutDesigner'),canvas=document.querySelector('#ldCanvas');
  const KEY='portal-ai-design-style-v1',defaults={theme:'default',density:'comfortable',corners:'rounded'};
  let stored={};try{stored=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}
  let draftStyles={},sessions={},sequence=0;
  function session(){return sessions[device()]??={plans:[],selected:null,undos:[],active:null}}
  const names={reminders:['AI每日简报','每日简报','晨间简报'],todo:['统一待办','我的待办','待办'],schedule:['我的日程','日程'],mail:['邮件提醒','邮件'],approval:['我的审批','审批'],apps:['常用功能','应用入口'],portalBanner:['门户轮播横幅','轮播图','轮播横幅','横幅'],portalNews:['AI智能资讯','智能资讯','新闻资讯'],portalGroup:['集团综合资讯','集团资讯'],portalReminders:['AI主动服务与智能提醒','主动服务','智能提醒'],portalNotices:['最新通知','系统通知'],portalAnnouncements:['最新公告','公告'],hotTracking:['AI热点追踪与事件演化','热点追踪','事件演化']};
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const device=()=>PortalDesigner.snapshot().device;
  const currentStyle=()=>({...defaults,...stored[device()],...window.PortalPresetDesignContext?.style,...draftStyles[device()]});
  function styleRoot(root,value){root.dataset.portalTheme=value.theme;root.dataset.portalDensity=value.density;root.dataset.portalCorners=value.corners;}
  function syncStyle(){styleRoot(canvas,currentStyle());}
  styleRoot(document.querySelector('.work'),{...defaults,...stored.web});syncStyle();
  function snap(){return {state:PortalDesigner.snapshot(),grid:PortalLayoutGrid.snapshot(),style:currentStyle()};}
  function makePlan(text){
    const base=snap(),list=base.state.components.slice(),grid=base.grid.map(p=>({...p})),styles={...base.style},notes=[],unhandled=[];
    const clauses=text.split(/[，,。；;\n]+/).map(x=>x.trim()).filter(Boolean);
    const allowed=base.state.catalog.map(x=>x.type),catalog=Object.fromEntries(base.state.catalog.map(x=>[x.type,x.name]));
    let recognized=false;
    const width=t=>t==='reminders'?3:['portalBanner','portalNews','portalGroup'].includes(t)?8:['mail','approval','apps','portalReminders','portalNotices','portalAnnouncements'].includes(t)?4:6;
    const height=t=>t==='reminders'?5:t==='hotTracking'?5:3;
    const rank={};list.forEach((t,i)=>rank[t]=100+i);
    const chineseNumbers=x=>x.replace(/[一二三四五六七八九十]/g,v=>({'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10}[v]));
    for(const [index,clause] of clauses.entries()){
      let handled=false;
      const matches=Object.entries(names).filter(([,aliases])=>aliases.some(a=>clause.includes(a)));
      for(const [type,aliases] of matches){
        handled=recognized=true;
        if(!allowed.includes(type)){notes.push('当前组件库不提供“'+(catalog[type]||aliases[0])+'”，已跳过。');continue;}
        const remove=aliases.some(a=>new RegExp('(?:去掉|移除|删除|隐藏|不显示|取消)\\s*(?:组件)?\\s*'+a).test(clause));
        if(remove){const at=list.indexOf(type);if(at>=0){list.splice(at,1);notes.push('移除“'+catalog[type]+'”');}else notes.push('“'+catalog[type]+'”当前未放置');continue;}
        if(!list.includes(type)){list.push(type);rank[type]=100+list.length;notes.push('添加“'+catalog[type]+'”');}
        let pos=grid.find(p=>p.type===type);if(!pos){pos={type,w:width(type),h:height(type),x:0,y:0};grid.push(pos);}
        const c=chineseNumbers(clause),size=c.match(/(\d+)\s*[*×xX]\s*(\d+)/),w=c.match(/(\d+)\s*列/),h=c.match(/(\d+)\s*行/);
        if(base.state.device==='web'&&(size||w||h)){pos.w=Math.max(1,Math.min(12,Number(size?.[1]||w?.[1]||pos.w)));pos.h=Math.max(1,Math.min(30,Number(size?.[2]||h?.[1]||pos.h)));notes.push('“'+catalog[type]+'”调整为 '+pos.w+' 列 × '+pos.h+' 行');}
        else if(size||w||h)notes.push('移动端保持单列，已忽略网格宽高要求');
        if(/顶部|顶端|最上|上方|第一|首屏|优先/.test(clause)){rank[type]=-100+index;notes.push('“'+catalog[type]+'”优先放在上方');}
        else if(/底部|最后|下方|最下/.test(clause)){rank[type]=1000+index;notes.push('“'+catalog[type]+'”放在后面');}
        else if(/左边|左侧/.test(clause)){rank[type]=-50+index;notes.push('“'+catalog[type]+'”优先从左侧排列');}
        else if(/中间|中部/.test(clause)){rank[type]=-30+index;notes.push('“'+catalog[type]+'”排在左侧组件之后');}
        else if(/右边|右侧/.test(clause)){rank[type]=-10+index;notes.push('“'+catalog[type]+'”排在同组组件后方');}
        else if(/放|移|调整|排列|添加|增加/.test(clause))notes.push('保留“'+catalog[type]+'”，按当前内容紧凑排布');
      }
      let theme=/紫色|紫调/.test(clause)?'violet':/绿色|青绿/.test(clause)?'green':/蓝色|蓝调|商务蓝|清爽蓝/.test(clause)?'blue':/极简|简约|纯白|白色/.test(clause)?'minimal':/默认风格|原始风格/.test(clause)?'default':null;
      if(theme){styles.theme=theme;handled=recognized=true;notes.push('门户配色：'+({violet:'柔和紫',green:'清新绿',blue:'清爽蓝',minimal:'简约白',default:'默认'}[theme]));}
      if(/紧凑|密集/.test(clause)){styles.density='compact';handled=recognized=true;notes.push('组件内部采用紧凑留白');}
      if(/宽松|舒适|大留白/.test(clause)){styles.density='comfortable';handled=recognized=true;notes.push('组件内部采用舒适留白');}
      if(/小圆角|直角/.test(clause)){styles.corners='square';handled=recognized=true;notes.push('卡片采用小圆角');}
      else if(/圆角|柔和/.test(clause)){styles.corners='rounded';handled=recognized=true;notes.push('卡片采用柔和圆角');}
      const columns=chineseNumbers(clause).match(/(?:整体|页面|门户|采用|按)?\s*([234])\s*栏/);
      if(columns&&base.state.device==='web'){const n=Number(columns[1]);grid.forEach(p=>{if(list.includes(p.type))p.w=12/n});notes.push('现有组件统一采用 '+n+' 栏宽度');handled=recognized=true;}
      if(!handled)unhandled.push(clause);
    }
    if(!recognized)throw new Error('暂未识别可执行的调整，请说明组件名称、摆放顺序、网格尺寸或配色。例如：“每日简报放左侧3×5，待办放右侧，整体蓝色”。');
    const ordered=list.sort((a,b)=>(rank[a]??100)-(rank[b]??100));
    const packed=[],overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
    ordered.forEach(type=>{let p={...(grid.find(p=>p.type===type)||{w:width(type),h:height(type)}),type,x:0,y:0};const max=Math.max(0,...packed.map(q=>q.y+q.h));outer:for(let y=0;y<=max;y++)for(let x=0;x<=12-p.w;x++){p.x=x;p.y=y;if(!packed.some(q=>overlap(p,q)))break outer;}packed.push(p);});
    if(!notes.length)notes.push('将指定组件保留在画布，并按网格紧凑排布');
    if(unhandled.length)notes.push('暂未执行的描述：'+unhandled.join('；'));
    notes.push('遵循自动补空位规则，左右位置以可容纳空间为准');
    return {base,components:ordered,grid:packed,style:styles,notes:[...new Set(notes)]};
  }
  const drawer=document.createElement('aside');drawer.id='aiDesignDrawer';drawer.hidden=true;drawer.setAttribute('aria-label','AI设计助手');drawer.innerHTML='<header><div><b>✦ AI 设计</b><small>描述需求，调整当前终端的门户</small></div><button id="aiDesignClose" aria-label="收起AI设计">×</button></header><div class="aid-content"><label for="aiDesignPrompt">想怎样调整门户？</label><textarea id="aiDesignPrompt" maxlength="1200" placeholder="例如：每日简报放左侧，宽3列高5行；待办放中间，审批放右侧；常用功能放在顶部，整体改成清爽蓝色、紧凑一点。"></textarea><div class="aid-examples"><button>每日简报放左侧3×5，待办放右侧6×3，整体蓝色</button><button>常用功能放顶部，邮件放最后，简约白色、小圆角</button><button>整体三栏，绿色，宽松一点</button></div><p class="aid-note">当前为自然语言规则演示，支持组件添加/移除、排序、网格尺寸和配色样式。未接入真实 AI。</p><button id="aiDesignGenerate" class="aid-primary">✦ 生成调整方案</button><p id="aiDesignStatus" role="status"></p><section id="aiDesignHistory" hidden><h4>最近方案 <span id="aiDesignHistoryCount"></span></h4><p class="aid-history-note">保留最近 5 个方案。选择历史方案后应用，将恢复该方案的完整布局及样式。</p><div id="aiDesignHistoryList"></div></section><section id="aiDesignPlan" hidden><h4>调整方案</h4><ul></ul><p>应用后可继续手动调整，点击顶部“保存并生效”后才更新门户。</p><button id="aiDesignApply" class="aid-primary">应用到画布</button></section><button id="aiDesignUndo" hidden>↶ 撤销上次应用</button></div>';designer.append(drawer);
  const prompt=drawer.querySelector('textarea'),status=drawer.querySelector('#aiDesignStatus'),planPanel=drawer.querySelector('#aiDesignPlan'),undo=drawer.querySelector('#aiDesignUndo');
  document.querySelector('#ldAiDesign').onclick=()=>{drawer.hidden=!drawer.hidden;if(!drawer.hidden){syncStyle();refreshHistory();prompt.focus()}};
  document.querySelector('#aiDesignClose').onclick=()=>drawer.hidden=true;
  drawer.querySelectorAll('.aid-examples button').forEach(b=>b.onclick=()=>{prompt.value=b.textContent;prompt.dispatchEvent(new Event('input'));prompt.focus()});
  const history=drawer.querySelector('#aiDesignHistory'),historyList=drawer.querySelector('#aiDesignHistoryList');
  function refreshHistory(){
    const s=session(),selected=s.plans.find(p=>p.id===s.selected);history.hidden=!s.plans.length;
    drawer.querySelector('#aiDesignHistoryCount').textContent='（'+s.plans.length+' / 5）';
    historyList.innerHTML=s.plans.map(p=>'<button type="button" class="aid-history-item '+(p.id===s.selected?'selected':'')+'" data-ai-plan="'+p.id+'" aria-pressed="'+(p.id===s.selected)+'"><span><b>方案 '+p.number+'</b> <small>'+esc(p.time)+'</small>'+(p.id===s.active?'<em>当前应用</em>':'')+'</span><span class="aid-history-request">'+esc(p.request)+'</span></button>').join('');
    historyList.querySelectorAll('[data-ai-plan]').forEach(b=>b.onclick=()=>{s.selected=b.dataset.aiPlan;refreshHistory();status.textContent='已选择方案 '+s.plans.find(p=>p.id===s.selected).number+'，点击“应用到画布”执行。'});
    planPanel.hidden=!selected;
    if(selected){planPanel.querySelector('h4').textContent='方案 '+selected.number+' · 调整详情';planPanel.querySelector('ul').replaceChildren(...selected.notes.map(text=>{const li=document.createElement('li');li.textContent=text;return li}));}
    undo.hidden=!s.undos.length;undo.textContent='↶ 撤销上次应用（可撤销 '+s.undos.length+' 步）';
  }
  function restore(snapshot){PortalDesigner.replace(snapshot.state.components);PortalLayoutGrid.set(snapshot.grid);draftStyles[device()]={...snapshot.style};syncStyle();}
  prompt.oninput=()=>{status.textContent=''};
  drawer.querySelector('#aiDesignGenerate').onclick=()=>{try{
    const request=prompt.value.trim(),generated=makePlan(request),s=session(),number=++sequence;
    const entry={...generated,id:String(number),number,request,time:new Date().toLocaleTimeString('zh-CN',{hour12:false})};
    s.plans.unshift(entry);s.plans=s.plans.slice(0,5);s.selected=entry.id;refreshHistory();status.textContent='方案 '+number+' 已生成，尚未修改画布。';
  }catch(e){status.textContent=e.message}};
  drawer.querySelector('#aiDesignApply').onclick=()=>{
    const s=session(),plan=s.plans.find(p=>p.id===s.selected);if(!plan)return;
    const allowed=new Set(PortalDesigner.snapshot().catalog.map(c=>c.type));
    if(plan.base.state.device!==device()||plan.components.some(t=>!allowed.has(t))){status.textContent='当前终端或组件权限已变化，请重新生成方案。';return;}
    const before=snap();s.undos.push({snapshot:before,active:s.active});s.undos=s.undos.slice(-5);
    try{PortalDesigner.replace(plan.components);PortalLayoutGrid.set(plan.grid);draftStyles[device()]={...plan.style};syncStyle();s.active=plan.id;refreshHistory();status.textContent='已应用方案 '+plan.number+'，尚未保存。可继续选择方案或逐步撤销。';}
    catch(e){s.undos.pop();restore(before);refreshHistory();status.textContent='应用失败，已恢复应用前画布。';}
  };
  undo.onclick=()=>{const s=session(),previous=s.undos.pop();if(!previous)return;restore(previous.snapshot);s.active=previous.active;refreshHistory();status.textContent='已恢复上次应用前的画布'+(s.undos.length?'，还可撤销 '+s.undos.length+' 步。':'，暂无更多可撤销记录。');};
  function clearSession(){draftStyles={};sessions={};sequence=0;refreshHistory();status.textContent='';drawer.hidden=true;syncStyle();}
  window.PortalAIDesignSession={clear:clearSession};
  document.querySelector('#editWork').addEventListener('click',clearSession);
  document.querySelector('#ldBack').addEventListener('click',clearSession);
  document.querySelectorAll('[data-device]').forEach(b=>b.addEventListener('click',()=>{syncStyle();refreshHistory();status.textContent='已切换终端，显示当前终端的方案与撤销记录。';}));
  document.querySelector('#ldReset').addEventListener('click',()=>{draftStyles[device()]={...defaults};syncStyle();session().undos=[];session().active=null;refreshHistory();status.textContent='布局与样式已重置，历史方案保留，撤销记录已清空。';});
  document.querySelector('#ldSave').addEventListener('click',()=>{stored[device()]=currentStyle();try{localStorage.setItem(KEY,JSON.stringify(stored))}catch{}if(device()==='web')styleRoot(document.querySelector('.work'),stored.web);clearSession();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!drawer.hidden){drawer.hidden=true;e.stopPropagation();}});
})();
