(()=>{
if(!new URLSearchParams(location.search).has('componentDesigner'))return;
window.addEventListener('message',event=>{if(event.source!==parent||event.data?.type!=='gx-component-init')return;
const existing=event.data.component;let saving=false;
const notify=(type,component)=>parent.postMessage({type,component},'*');
save=function(){if(saving){const snapshot=structuredClone(componentDraft);setTimeout(()=>notify('gx-component-save',snapshot),0)}};
const priorSave=saveDesignedComponent;saveDesignedComponent=function(){saving=true;try{priorSave()}finally{saving=false}};
const priorClose=closeDialog;closeDialog=function(force){const inDesigner=!!document.querySelector('#singleComponentDesigner');priorClose(force);if(inDesigner&&document.querySelector('#overlay').classList.contains('hidden')&&!saving)notify('gx-component-close')};
portalDraft=null;if(existing){const c=structuredClone(existing);if(!c.blocks&&c.url){c.endpoint=c.kind==='api'?c.url:'';c.page=c.kind!=='api'?c.url:''}state.customComponents=[c];createComponent(c.id)}else createComponent();
notify('gx-component-ready');
},{once:false});
})();
