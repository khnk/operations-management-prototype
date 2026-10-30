(() => {
  const KEY='portal-hot-tracking-v1';
  const initial=[
    {id:'manufacturing',name:'人工智能+制造',keywords:'人工智能,制造,工业大模型',scope:'行业媒体、企业官网'},
    {id:'compute',name:'国产算力',keywords:'国产芯片,算力,适配',scope:'官方媒体、行业媒体'},
    {id:'policy',name:'某项政策',keywords:'数字化转型,政策实施',scope:'政府网站'},
    {id:'competitor',name:'某家竞争对手',keywords:'竞争对手,产品发布,业务合作',scope:'企业官网、行业媒体'}
  ];
  let state={topics:initial,selected:'manufacturing',seen:{},updates:{},filter:'all'};
  try { const stored=JSON.parse(localStorage.getItem(KEY)||'null');if(stored&&Array.isArray(stored.topics))state={...state,...stored}; } catch{}
  state.topics.forEach(t=>delete t.notify);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}};
  const icon='<img src="portal-prototype/assets/icons/global.svg" alt="">';
  function topic(){return state.topics.find(t=>t.id===state.selected)||state.topics[0];}
  function events(t){
    const descriptors={manufacturing:['试点启动','方案验证','应用推广','落地范围扩大'],compute:['产品路线公布','完成适配验证','生态合作扩展','适配范围更新'],policy:['征求意见','正式文件发布','实施细则解读','实施口径更新'],competitor:['新产品线索','企业发布公告','媒体跟进解读','产品进展更新']};
    const stages=descriptors[t.id]||['线索出现','信息确认','报道跟进','最新进展'];
    const data=[
      {id:'e3',date:'10-28 09:30',kind:'analysis',label:'AI 分析',title:stages[2],text:'综合前两个节点，关注点已从“是否启动”转向“具体如何实施”。下一步建议核验实际落地范围、进度和约束条件。此为推断，不代表已发生事实。',sources:['示例资料 A','示例资料 B'],change:'关注点变化',major:false},
      {id:'e2',date:'10-27 15:20',kind:'fact',label:'已确认事实',title:stages[1],text:'示例原始公告公布了项目或文件的正式安排；两篇转载报道指向同一份材料，已合并为一个事件节点。具体效果尚无可核验材料。',sources:['示例原始公告','示例转载报道 A','示例转载报道 B'],change:'由线索转为公开公告',major:true},
      {id:'e1',date:'10-26 10:00',kind:'opinion',label:'媒体观点',title:stages[0],text:'示例行业报道提出该事项可能带来业务机会，并讨论了潜在影响；属于媒体判断，尚不能作为结果或收益的事实依据。',sources:['示例行业报道'],change:'首次出现相关线索',major:false}
    ];
    if(state.updates[t.id])data.unshift({id:'e4',date:'10-28 11:00',kind:'fact',label:'已确认事实',title:stages[3],text:'演示新增的原始材料补充了实施范围，相关转载合并为同一条进展。与上一节点相比，明确了范围变化；仍需持续跟踪后续结果。',sources:['示例补充公告','示例跟进报道'],change:'新增明确实施范围',major:true});
    return data;
  }
  function unread(t){return events(t).filter(e=>e.major&&!(state.seen[t.id]||[]).includes(e.id)).length;}
  function markup(){const t=topic();return `<section class="ht-component"><header class="ht-header"><h3>${icon}AI 热点追踪与事件演化</h3><button data-hot="manage">管理关注</button><button data-hot="refresh">⟳ 更新</button></header><div class="ht-demo">示例数据 · 外网采集待接入 <span>持续追踪主题，而非单篇新闻</span></div><div class="ht-topics">${state.topics.map(x=>`<button data-hot="select" data-topic="${esc(x.id)}" class="${t?.id===x.id?'active':''}">${esc(x.name)}${unread(x)?`<em>${unread(x)}</em>`:''}</button>`).join('')}<button data-hot="add">＋ 关注主题</button></div>${t?`<div class="ht-summary"><div><b>${esc(t.name)}</b><small>${events(t).length} 个节点 · ${new Set(events(t).flatMap(e=>e.sources)).size} 个示例来源 · 已合并同一事件报道</small></div></div><div class="ht-change"><span>关键变化</span>${esc(events(t).find(e=>e.major)?.change)} <button data-hot="detail">查看完整脉络 →</button></div><div class="ht-filters">${[['all','全部'],['fact','已确认事实'],['opinion','媒体观点'],['analysis','AI 分析']].map(([id,label])=>`<button data-hot="filter" data-filter="${id}" class="${state.filter===id?'active':''}">${label}</button>`).join('')}<small>最新进展在前</small></div><div class="ht-timeline">${eventMarkup(t,false)}</div>`:'<div class="ht-empty">还未关注主题，点击“关注主题”开始追踪。</div>'}</section>`;}
  function eventMarkup(t,full){return events(t).filter(e=>full||state.filter==='all'||e.kind===state.filter).map(e=>`<article class="ht-event"><div class="ht-event-top"><time>${e.date}</time><span class="ht-kind ${e.kind}">${e.label}</span>${e.major?'<span class="ht-major">重大进展</span>':''}</div><b>${esc(e.title)}</b><p>${esc(e.text)}</p><div class="ht-event-bottom"><span>${esc(e.change)}</span><button data-hot="source" data-event="${e.id}">${e.sources.length} 个来源 · 查看依据</button></div></article>`).join('')||'<p class="ht-empty">该类型暂无进展</p>';}
  function render(){document.querySelectorAll('.ht-component').forEach(el=>{if(el.closest('#ldCanvas,#ldLibrary,.grid-floating-card'))return;el.outerHTML=markup()});}
  function dialog(title,html){let d=document.querySelector('#hotDialog');if(!d){d=document.createElement('dialog');d.id='hotDialog';document.body.append(d)}d.innerHTML=`<header><h2>${esc(title)}</h2><button data-hot="close" aria-label="关闭">×</button></header><div class="ht-dialog-body">${html}</div>`;if(!d.open)d.showModal();return d;}
  function manage(){dialog('管理关注主题',`<div class="ht-manage-toolbar"><div class="ht-sub-tabs" role="tablist" aria-label="关注管理"><button type="button" role="tab" data-hot="manage" aria-selected="true">已关注主题</button><button type="button" role="tab" data-hot="manage-ai" aria-selected="false">✦ AI 订阅</button></div><button class="ht-primary" data-hot="add">＋ 关注新主题</button></div><p class="ht-note">设置关注主题、关键词和来源范围，配置保存在本机。当前为演示数据，不会实际采集外网资讯。</p><div class="ht-manage-list">${state.topics.map(t=>`<div><b>${esc(t.name)}</b><small>${esc(t.keywords)} · ${esc(t.scope)}</small>${t.excludedKeywords?`<small>排除：${esc(t.excludedKeywords)}</small>`:''}${t.aiDescription?`<small>订阅描述：${esc(t.aiDescription)}</small>`:''}<button data-hot="remove" data-topic="${esc(t.id)}">取消关注</button></div>`).join('')}</div>`);}
  function add(initialMode='manual',fromManage=false){
    const d=dialog(fromManage?'管理关注主题':'关注新主题',`<div class="ht-sub-tabs" role="tablist" aria-label="关注方式"><button type="button" role="tab" data-track-mode="manual" aria-selected="true">手动订阅</button><button type="button" role="tab" data-track-mode="ai" aria-selected="false">✦ AI 订阅</button></div><form id="hotTopicForm"><section class="ht-ai-pane" hidden><h3>描述你想持续追踪的事情</h3><p>可以说明关注的行业、政策、企业、关键变化和来源，生成后确认追踪条件。</p><textarea id="hotAiPrompt" maxlength="1000" placeholder="例如：持续关注国产算力的芯片适配和生态合作，重点看企业官网和行业媒体，排除股价消息。"></textarea><div class="ht-ai-examples"><button type="button">追踪人工智能+制造的落地项目和技术进展</button><button type="button">关注广东新材料政策的发布和实施进展，只看政府网站</button></div><div class="ht-ai-generate"><small>原型演示：按关键词生成条件，请确认识别结果。</small><button type="button" class="ht-primary" id="hotAiGenerate">✦ 生成追踪条件</button></div><p class="ht-ai-status" role="status"></p></section><div class="ht-topic-fields"><label>主题名称<input name="name" required maxlength="40" placeholder="例如：人工智能+制造、企业名称或政策名称"></label><label>匹配关键词<input name="keywords" required maxlength="160" placeholder="多个词用逗号分隔"></label><label>来源范围<select name="scope"><option>全部公开来源</option><option>政府网站</option><option>官方媒体、行业媒体</option><option>企业官网、行业媒体</option></select></label><label>排除关键词 <small>选填</small><input name="excludedKeywords" maxlength="160" placeholder="例如：股价、营销广告"></label></div><p class="ht-note">演示模式：新主题生成示例时间线。实际追踪需接入新闻源、去重与事实核验服务。</p><div class="ht-error" role="alert"></div><div class="ht-topic-footer"><button type="button" data-hot="close">取消</button><button type="submit" class="ht-primary">保存并关注</button></div></form>`);
    const form=d.querySelector('form'),pane=d.querySelector('.ht-ai-pane'),fields=d.querySelector('.ht-topic-fields'),input=d.querySelector('#hotAiPrompt'),error=d.querySelector('.ht-error'),status=d.querySelector('.ht-ai-status');
    let mode='manual',generated='';
    if(fromManage){const first=d.querySelector('[data-track-mode="manual"]');first.textContent='已关注主题';first.removeAttribute('data-track-mode');first.setAttribute('data-hot','manage');first.setAttribute('aria-selected','false');}
    function switchMode(next){mode=next;d.querySelectorAll('[data-track-mode]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.trackMode===mode)));pane.hidden=mode!=='ai';fields.hidden=mode==='ai'&&!generated;fields.querySelectorAll('[required]').forEach(i=>i.disabled=fields.hidden);error.textContent='';}
    d.querySelectorAll('[data-track-mode]').forEach(b=>b.onclick=()=>switchMode(b.dataset.trackMode));
    pane.querySelectorAll('.ht-ai-examples button').forEach(b=>b.onclick=()=>{input.value=b.textContent;input.dispatchEvent(new Event('input'));input.focus()});
    input.oninput=()=>{status.textContent=generated&&input.value.trim()!==generated?'描述已修改，请重新生成追踪条件。':'';};
    d.querySelector('#hotAiGenerate').onclick=()=>{
      const text=input.value.trim();if(!text){error.textContent='请先描述想持续追踪的内容。';input.focus();return;}
      const parts=text.split(/[，,。；;\n]+/).map(p=>p.trim()).filter(Boolean),negative=parts.filter(p=>/排除|屏蔽|不要|不看|不关注/.test(p)),positive=parts.filter(p=>!negative.includes(p)).join('，');
      if(!positive){error.textContent='请补充希望关注的主题，不能只填写排除内容。';return;}
      const phrases=(positive.match(/人工智能[+＋]制造|人工智能|国产算力|芯片适配|生态合作|新材料|政策|实施进展|技术进展|落地项目|竞争对手|产品发布|业务合作|广东|[“「][^”」]+[”」]/g)||[]).map(p=>p.replace(/[“”「」]/g,''));
      const first=parts.find(p=>!negative.includes(p))||positive;
      const name=first.replace(/^(请帮我|请|帮我)?(持续)?(关注|追踪|跟踪|订阅)/,'').replace(/的(发布|落地|实施|芯片适配|产品发布|技术进展).*$/,'').trim();
      form.elements.name.value=(name||positive).slice(0,40);
      form.elements.keywords.value=([...new Set(phrases)].join('，')||positive).slice(0,160);
      form.elements.excludedKeywords.value=negative.map(p=>p.replace(/^.*?(排除|屏蔽|不要|不看|不关注)/,'').replace(/消息|新闻|内容/g,'').trim()).join('，').slice(0,160);
      form.elements.scope.value=/政府网站|政府官网/.test(positive)?'政府网站':/企业官网|公司官网/.test(positive)?'企业官网、行业媒体':/媒体/.test(positive)?'官方媒体、行业媒体':'全部公开来源';
      generated=text;error.textContent='';status.textContent='追踪条件已生成，请检查并修改下方内容，保存后生效。';switchMode('ai');
    };
    // Validate the current description before native required-field validation.
    form.querySelector('[type="submit"]').addEventListener('click',e=>{if(mode==='ai'&&(!generated||input.value.trim()!==generated)){e.preventDefault();error.textContent='请先根据最新描述生成并确认追踪条件。';input.focus();}});
    form.onsubmit=e=>{
      e.preventDefault();if(mode==='ai'&&(!generated||input.value.trim()!==generated)){error.textContent='请先根据最新描述生成并确认追踪条件。';return;}
      const data=new FormData(form),name=String(data.get('name')||'').trim(),keywords=String(data.get('keywords')||'').trim();
      if(!name||!keywords){error.textContent='请填写主题名称和关键词';return;}
      if(state.topics.some(t=>t.name===name)){error.textContent='该主题已在关注列表中';return;}
      const t={id:'custom-'+Date.now(),name,keywords,scope:data.get('scope'),excludedKeywords:String(data.get('excludedKeywords')||'').trim(),aiDescription:generated,subscriptionMode:mode};
      state.topics.push(t);state.selected=t.id;state.filter='all';save();render();if(fromManage)manage();else d.close();
    };
    switchMode(initialMode);
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-hot]');if(!b||b.closest('#ldCanvas,#ldLibrary,.grid-floating-card'))return;
    e.preventDefault();const action=b.dataset.hot,t=topic();
    if(action==='close'){b.closest('dialog').close();return}
    if(action==='manage'){manage();return}if(action==='manage-ai'){add('ai',true);return}if(action==='add'){add();return}
    if(action==='select'){state.selected=b.dataset.topic;state.filter='all';const next=topic();state.seen[next.id]=events(next).filter(e=>e.major).map(e=>e.id);save();render();return}
    if(action==='filter'){state.filter=b.dataset.filter;save();render();return}


    if(action==='remove'){state.topics=state.topics.filter(x=>x.id!==b.dataset.topic);if(state.selected===b.dataset.topic)state.selected=state.topics[0]?.id;save();render();manage();return}
    if(action==='detail'&&t){state.seen[t.id]=events(t).filter(e=>e.major).map(e=>e.id);save();render();dialog(t.name+' · 事件发展脉络',`<p class="ht-note">示例时间线 · 按时间从新到旧排序，同一事件的多来源报道合并展示。</p><div class="ht-timeline">${eventMarkup(t,true)}</div>`);return}
    if(action==='source'&&t){const node=events(t).find(x=>x.id===b.dataset.event);dialog('信息依据与判断边界',`<span class="ht-kind ${node.kind}">${node.label}</span><h3>${esc(node.title)}</h3><p>${esc(node.text)}</p><ul>${node.sources.map(source=>`<li>${esc(source)}<small>演示材料，无真实原文链接</small></li>`).join('')}</ul><p class="ht-note">事实应以可核验原始材料为依据；媒体观点仅代表报道者判断；AI 分析为推断，不能替代事实。正式接入后展示来源链接、发布时间和核验状态。</p>`);return}
    if(action==='refresh'&&t){if(state.updates[t.id]){show('该示例主题暂无更多进展');return}state.updates[t.id]=true;save();render();show('已更新示例时间线');return}
  });
  window.HotTracking={markup};
})();
