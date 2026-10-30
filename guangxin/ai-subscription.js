(() => {
  const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.setupAiSubscriptions=function(saved){
    const form=document.querySelector('#subscriptionForm'),scroll=form.querySelector('.sub-scroll');
    const manual=document.createElement('div');manual.className='sub-manual-fields';
    while(scroll.firstChild)manual.append(scroll.firstChild);scroll.append(manual);
    const tabs=document.createElement('div');tabs.className='sub-mode-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','订阅方式');tabs.innerHTML='<button type="button" role="tab" data-sub-mode="manual">手动订阅</button><button type="button" role="tab" data-sub-mode="ai">✦ AI 订阅</button>';scroll.prepend(tabs);
    const pane=document.createElement('section');pane.className='sub-ai-pane';pane.innerHTML='<h3>用一句话告诉 AI，你想关注什么</h3><p>描述关注的行业、主题、地区、来源或不想看到的内容，生成后可继续修改订阅条件。</p><textarea id="subAiPrompt" maxlength="1000" placeholder="例如：我关注人工智能在制造业的应用和国产算力，重点看广东的政策解读和企业动态，每天更新，不要娱乐新闻。"></textarea><div class="sub-ai-examples"><span>试试：</span><button type="button">关注人工智能+制造和国产算力，每天更新</button><button type="button">每周关注广东新材料政策，只看政府网站，排除娱乐</button></div><div class="sub-ai-generate"><small>原型演示：按关键词生成条件，请确认识别结果。</small><button type="button" id="subAiGenerate">✦ 生成订阅条件</button></div><div class="sub-ai-message" role="status"></div><div class="sub-ai-result" hidden></div>';
    scroll.insertBefore(pane,manual);
    const input=pane.querySelector('textarea'),result=pane.querySelector('.sub-ai-result'),message=pane.querySelector('.sub-ai-message');input.value=saved.aiDescription||'';
    let mode=saved.subscriptionMode==='ai'?'ai':'manual',applied=saved.aiDescription||'',reviewed=!!applied;
    const intro=manual.querySelector('.sub-intro');
    function switchMode(next){mode=next;tabs.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.subMode===mode);b.setAttribute('aria-selected',String(b.dataset.subMode===mode))});pane.hidden=mode!=='ai';manual.hidden=mode==='ai'&&!reviewed;if(intro)intro.textContent=mode==='ai'?'以下为订阅条件，可直接勾选修改。确认后点击“保存订阅”。':'选择关注的行业和主题，为你推荐更相关的外网资讯。更多偏好可在高级设置中调整。';}
    tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>switchMode(b.dataset.subMode));
    pane.querySelectorAll('.sub-ai-examples button').forEach(b=>b.onclick=()=>{input.value=b.textContent;input.focus();input.dispatchEvent(new Event('input'))});
    input.oninput=()=>{message.textContent=reviewed&&input.value.trim()!==applied?'描述已修改，请重新生成条件后保存。':'';};
    function parse(text){
      const parts=text.split(/[，,。；;\n]+/).map(x=>x.trim()).filter(Boolean),negative=parts.filter(p=>/不要|不想|排除|屏蔽|不关注|不看/.test(p));
      const positive=parts.filter(p=>!negative.includes(p)).join('，');
      const match=(list)=>list.filter(([label,pattern])=>pattern.test(positive)).map(x=>x[0]);
      const industries=match([['人工智能',/人工智能|AI|AIGC|大模型|算力|芯片/i],['制造业',/制造|工业|工厂/],['新材料',/新材料|材料产业/],['国际贸易',/外贸|国际贸易|进出口/],['金融投资',/金融|投资/],['新能源',/新能源|光伏|储能|锂电/],['现代服务业',/服务业|物流/]]);
      const topics=match([['企业数字化',/数字化|数字转型|智能制造|智能工厂|人工智能.*制造|AI.*制造/i],['供应链',/供应链|产业链/],['产业投资',/投资|并购/],['绿色低碳',/低碳|绿色|碳排/],['产业协同',/协同|合作/],['科技创新',/创新|算力|芯片|大模型|研发|人工智能/],['市场动态',/市场|竞争|企业动态|产品/],['风险管理',/风险|合规/]]);
      const regions=match([['全国',/全国/],['广东',/广东|广州|深圳/],['长三角',/长三角|上海|浙江|江苏/],['京津冀',/京津冀|北京|天津|河北/],['东南亚',/东南亚/],['欧洲',/欧洲/],['北美',/北美|美国|加拿大/],['全球',/全球|海外/]]);
      const types=match([['行业新闻',/行业|新闻|动态/],['政策解读',/政策|法规/],['研究报告',/研究报告|研报/],['企业动态',/企业|竞争对手|公司/],['深度分析',/深度|分析/]]);
      const sources=match([['官方媒体',/官方媒体|权威媒体/],['行业媒体',/行业媒体/],['政府网站',/政府网站|政府官网|官方政策/],['研究机构',/研究机构|智库/],['企业官网',/企业官网|公司官网/]]);
      const blockedKeywords=negative.map(p=>p.replace(/^.*?(不要|不想看|不想|排除|屏蔽|不关注|不看)/,'').replace(/新闻|内容|报道/g,'').trim()).filter(Boolean).join('，');
      const keywords=[...new Set(positive.match(/人工智能[+＋]制造|国产算力|AIGC|人工智能|数字化转型|供应链|新材料|新能源|产业链|大模型|[“「][^”」]+[”」]/gi)||[])].map(v=>v.replace(/[“”「」]/g,''));
      return {industries,topics,regions:regions.length?regions:['全国'],types:types.length?types:['行业新闻'],sources:sources.length?sources:['官方媒体','行业媒体','政府网站'],keywords:keywords.join('，')||positive,blockedKeywords,frequency:/每周|一周/.test(positive)?'每周摘要':/实时|随时/.test(positive)?'实时更新':'每日更新'};
    }
    pane.querySelector('#subAiGenerate').onclick=()=>{
      const text=input.value.trim();if(!text){message.textContent='请先描述想订阅的内容。';input.focus();return;}
      const prefs=parse(text);
      ['industries','topics','regions','types','sources'].forEach(k=>form.querySelectorAll('input[name="'+k+'"]').forEach(el=>el.checked=prefs[k].includes(el.value)));
      ['keywords','blockedKeywords','frequency'].forEach(k=>form.querySelector('#sub-'+k).value=prefs[k]);
      applied=text;reviewed=true;result.hidden=false;
      result.innerHTML='<b>订阅条件已生成</b><p>'+esc([prefs.industries.join('、')||'行业待补充',prefs.topics.join('、')||'主题待补充',prefs.frequency].join(' · '))+'</p><small>查看下方条件并按需修改，保存后生效。</small>';
      message.textContent=!prefs.industries.length||!prefs.topics.length?'部分意图尚未匹配，请在下方补选关注行业和主题。':'';
      switchMode('ai');
    };
    const priorReset=document.querySelector('#subReset').onclick;document.querySelector('#subReset').onclick=()=>{priorReset();input.value='';applied='';reviewed=false;result.hidden=true;message.textContent='';switchMode(mode)};
    form.addEventListener('submit',e=>{if(mode==='ai'&&(!reviewed||input.value.trim()!==applied)){e.preventDefault();e.stopImmediatePropagation();message.textContent='请先生成并确认最新的订阅条件。';scroll.scrollTop=0;}},true);
    window.readAiSubscriptionMetadata=()=>({aiDescription:applied,subscriptionMode:mode});
    switchMode(mode);
  };
})();
