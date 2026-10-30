/* Delegation keeps original modules and cloned modules behavior identical. */
(() => {
  // Dialogs belong to the page shell, independent of a module's current host.
  ['ptDialog','resourceDialog'].forEach(id=>{const dialog=document.getElementById(id);if(dialog)document.body.append(dialog)});
  let newsView='cards';try{newsView=localStorage.getItem('portal-news-view')==='list'?'list':'cards'}catch{}
  function syncNewsView(){document.querySelectorAll('.pt-panel:has(.pt-view-switch)').forEach(panel=>{panel.dataset.newsLayout=newsView;panel.querySelectorAll('[data-news-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.newsView===newsView)))})}
  syncNewsView();new MutationObserver(records=>{if(records.some(r=>r.addedNodes.length))syncNewsView()}).observe(document.body,{childList:true,subtree:true});
  let newsFeedback={};try{newsFeedback=JSON.parse(localStorage.getItem('news-item-feedback-v1')||'{}')||{}}catch{}
  function syncNewsFeedback(){document.querySelectorAll('.pt-card[data-news-id]').forEach(card=>{
    const choice=newsFeedback[card.dataset.newsId];
    for(const [action,text] of [['ptLike','♧ 感兴趣'],['ptLess','♧ 减少此类内容']]){
      const button=card.querySelector('[data-component-action="'+action+'"]');if(!button)continue;
      const active=choice===action,label=active?(action==='ptLike'?'✓ 已感兴趣':'✓ 已减少此类'):text;
      if(button.textContent!==label)button.textContent=label;
      button.setAttribute('aria-pressed',String(active));
    }
  });}
  syncNewsFeedback();new MutationObserver(records=>{if(records.some(r=>r.addedNodes.length))syncNewsFeedback()}).observe(document.body,{childList:true,subtree:true});
  function articleAction(target,action){const card=target.closest('.pt-card');if(!card)return;
    const open=card.querySelector('.pt-card-open'),title=open.dataset.ptDetail;
    if(action==='ptSummary'){info('AI 摘要 · '+title,'资讯：'+title+'\n\n要点：'+open.dataset.description+'\n\n来源：'+card.querySelector('small').textContent+'\n\n根据当前这条资讯的示例内容提炼，未合并其他资讯。');return;}
    const id=card.dataset.newsId;newsFeedback[id]=newsFeedback[id]===action?null:action;
    try{localStorage.setItem('news-item-feedback-v1',JSON.stringify(newsFeedback))}catch{}
    syncNewsFeedback();show(newsFeedback[id]?(action==='ptLike'?'已记录对这条资讯的兴趣':'已记录减少这条资讯的同类推荐'):'已取消这条资讯的反馈');
  }
  const approvals = new WeakMap();
  const scopeSelector = '.pt-panel,.pt-banner,.cw-box';
  function scope(node) { return node.closest(scopeSelector); }
  function preview(node) { return !!node.closest('#ldLibrary,#ldCanvas,.grid-floating-card,.mobile-floating-title'); }
  function leaveEditor(){const editor=document.querySelector('#layoutDesigner');if(!editor.hidden)editor.hidden=true;}
  function info(title, text) { ptOpen(title, text); }
  function filter(panel) {
    const term = panel.querySelector('[data-component-action="ptSearch"]')?.value.trim() || '';
    const cat = panel.querySelector('.pt-filters .active')?.textContent || '推荐';
    panel.querySelectorAll('.pt-card').forEach(card => {
      const match = cat === '行业趋势' || cat === '政策法规' ? card.dataset.category === cat : cat === '集团要闻' ? card.dataset.category === '集团动态' : true;
      card.hidden = !(match && ((card.querySelector('.pt-card-open')?.dataset.ptDetail||'')+(card.querySelector('.pt-card-open')?.dataset.description||'')+(card.querySelector('small')?.textContent||'')).includes(term));
      card.style.display = card.hidden ? 'none' : 'flex';
    });
  }
  function approvalClick(button, panel) {
    const tabs = [...panel.querySelectorAll('.cw-approval-tabs button')];
    const list = panel.querySelector('[id="cwApprovalRows"],.cw-approval-tabs + div');
    if (!list) return;
    if (!approvals.has(panel)) approvals.set(panel, list.innerHTML);
    tabs.forEach(tab => tab.classList.toggle('selected', tab === button));
    const i = tabs.indexOf(button);
    list.innerHTML = i === 0 ? approvals.get(panel) : i === 1 ? '<div class="cw-row"><span class="cw-item">季度采购合同审批</span><span class="cw-tag">已超期</span></div>' : '<div class="cw-row"><span class="cw-item">市场活动费用申请</span><span class="cw-tag">重要</span></div><div class="cw-row"><span class="cw-item">季度采购合同审批</span><span class="cw-tag">重要</span></div>';
  }
  const moduleStyle=document.createElement('style');moduleStyle.textContent='#ptDialogBody{white-space:pre-line}#ptDialogBody:has(form){white-space:normal}.cw-row,.cw-event{cursor:pointer}';document.head.append(moduleStyle);
  document.addEventListener('keydown',event=>{const opener=event.target.closest('.pt-card-open[role="button"]');if(!opener||event.target!==opener||preview(opener))return;if(event.key==='Enter'||event.key===' '){event.preventDefault();opener.click()}});
  document.addEventListener('input', event => {
    const input = event.target.closest('[data-component-action="ptSearch"]');
    if (!input || preview(input)) return;
    event.stopImmediatePropagation();filter(scope(input));
  }, true);
  document.addEventListener('click', event => {
    const target = event.target.closest('button,[data-pt-detail],.cw-row,.cw-event');
    if (!target || preview(target) || target.closest('.ld-remove,#ptDialog,#resourceDialog')) return;
    const panel = scope(target);
    if (!panel||target.closest('.ht-component,.daily-brief,.proactive-service,.calendar-component')) return;
    if (!target.matches('button,[data-pt-detail],.cw-row,.cw-event')) return;
    // Handle only module controls; editor controls continue to use their own bindings.
    if (!target.closest('.pt-panel,.pt-banner,.cw-box')) return;
    event.stopImmediatePropagation();
    if (target.dataset.ptDetail) { info(target.dataset.ptDetail, target.dataset.description || '这里展示该条资讯的详细内容。可联系相关业务部门获取更多信息。'); return; }
    const action = target.dataset.componentAction;
    if (action === 'ptView') {newsView=target.dataset.newsView==='list'?'list':'cards';try{localStorage.setItem('portal-news-view',newsView)}catch{}syncNewsView();return;}
    if (action === 'ptSubscribe') { openSubscriptions(); return; }
    if (action === 'ptSync') { target.textContent = '已同步';target.disabled = true;show('会议已同步到日程');return; }
    if (action === 'ptIgnore') { target.closest('.pt-reminder').remove();return; }
    if (['ptLike','ptLess','ptSummary'].includes(action)){articleAction(target,action);return;}
    if (target.closest('.pt-filters')) { panel.querySelectorAll('.pt-filters button').forEach(b=>b.classList.toggle('active',b===target));filter(panel);return; }
    if (target.closest('.pt-group-tabs')) { panel.querySelectorAll('.pt-group-tabs button').forEach(b=>b.classList.toggle('active',b===target));const list=panel.querySelector('.pt-group-news');if(list?.lastElementChild)list.prepend(list.lastElementChild);return; }
    if (target.closest('.pt-dots')) { const dots=[...panel.querySelectorAll('.pt-dots button')];dots.forEach(b=>b.classList.toggle('active',b===target));const image=panel.querySelector('img');if(image)image.style.filter=['none','hue-rotate(15deg)','hue-rotate(-15deg)'][dots.indexOf(target)];return; }
    if (target.closest('.cw-approval-tabs')) { approvalClick(target,panel);return; }
    if (target.closest('.cw-week')) { panel.querySelectorAll('.cw-week button').forEach(b=>b.classList.toggle('selected',b===target));return; }
    if (target.matches('.cw-join')) { info('加入会议','渠道合作方案评审 · 线上会议 · 14:00。已进入会议等候室（原型演示）。');return; }
    if (target.closest('.cw-apps')) {
      const name=target.textContent.trim();
      if(name==='知识库'){leaveEditor();openKnowledge();return;}
      if(name==='文档'){leaveEditor();openDrive();return;}
      info(name,name==='更多应用'?'常用应用：文档、表格、CRM、知识库、公告通知。':'已打开'+name+'（原型演示）。');return;
    }
    if (target.matches('.cw-alert')) { info(target.querySelector('b')?.textContent || '智能提醒',target.querySelector('small')?.textContent || '查看提醒详情');return; }
    if (target.matches('.cw-more')) { const title=panel.querySelector('h3')?.textContent.trim()||'全部内容';const rows=[...panel.querySelectorAll('.cw-row,.cw-event,.cw-alert')].map(n=>n.textContent.trim().replace(/\s+/g,' '));info(title,rows.join('\n')||'当前暂无更多记录。');return; }
    if (target.matches('.cw-menu')) { info('组件操作','可通过“编辑布局”调整组件位置和大小，或从画布中移除组件。');return; }
    if (target.matches('.cw-row')) { info(target.querySelector('.cw-item,b')?.textContent || '记录详情',target.textContent.trim().replace(/\s+/g,' '));return; }
    if (target.matches('.cw-event')) { info(target.querySelector('b')?.textContent||'日程详情',target.textContent.trim());return; }
  }, true);
})();
