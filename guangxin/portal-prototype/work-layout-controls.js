state.workPersonalLayouts??={};
window.addEventListener('load',()=>render());
const managedPortalBeforeWorkPersonal=activePortal;
function workLayoutSignature(p){return JSON.stringify([p.layout,p.gridLayout,p.componentStyles,p.template])}
function workOverride(){const p=managedPortalBeforeWorkPersonal(),key=userId+'@'+p?.id,entry=state.workPersonalLayouts[key];return entry&&entry.signature===workLayoutSignature(p)?entry:null}
activePortal=function(){const p=managedPortalBeforeWorkPersonal();if(route!=='home'||!p)return p;const entry=workOverride();return entry?{...p,layout:structuredClone(entry.layout),gridLayout:entry.gridLayout?structuredClone(entry.gridLayout):undefined}:p};
layout=function(){const p=activePortal();return p?structuredClone(p.layout):{left:[],right:[],hidden:[]}};
function saveWorkLayout(l,grid){const base=managedPortalBeforeWorkPersonal();state.workPersonalLayouts[userId+'@'+base.id]={signature:workLayoutSignature(base),layout:structuredClone(l),gridLayout:grid?structuredClone(grid):undefined};save()}
saveCustom=function(){const p=activePortal();saveWorkLayout(customLayoutDraft,p?.gridLayout);closeDialog(true);render();toast('当前门户的个人布局已保存')};
resetPersonal=function(){if(!confirm('恢复门户管理配置的默认布局？'))return;const p=managedPortalBeforeWorkPersonal();delete state.workPersonalLayouts[userId+'@'+p.id];save();closeDialog(true);render()};
dropWidget=function(e,id){e.preventDefault();e.stopPropagation();if(!layoutEditing||!e.dataTransfer.getData('text/plain').startsWith('widget:')||!dragWidget||dragWidget===id)return;const p=activePortal(),l=structuredClone(p.layout),col=l.left.includes(id)?'left':'right';l.left=l.left.filter(x=>x!==dragWidget);l.right=l.right.filter(x=>x!==dragWidget);l[col].splice(l[col].indexOf(id),0,dragWidget);const grid=structuredClone(p.gridLayout||{});if(grid[id]&&grid[dragWidget]){const a=grid[id],b=grid[dragWidget];[a.x,b.x]=[b.x,a.x];[a.y,b.y]=[b.y,a.y]}saveWorkLayout(l,Object.keys(grid).length?grid:undefined);render()};
