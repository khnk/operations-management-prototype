(()=>{
if(!new URLSearchParams(location.search).has('externalSystems'))return;
const css=document.createElement('style');css.textContent='body>header,#sidebar,body>.context-ai-float,#contextAiFloat{display:none!important}.shell{display:block;min-height:100vh}#main{max-width:none;width:100%;padding:0 0 24px}.titlebar{padding-top:0}body{background:#f5f8fc}';document.head.append(css);
const originalTitlebar=titlebar;titlebar=function(title,subtitle,actions){return originalTitlebar(title==='门户配置'?'外部系统管理':title,subtitle,actions)};
userId='admin';settingsTab='systems';go('settings');document.documentElement.style.visibility='visible';parent.postMessage({type:'gx-external-systems-ready'},'*');
})();
