layout=function(){const p=activePortal();return p?structuredClone(p.layout):{left:[],right:[],hidden:[]}};
const beforeConsistentPortalHome=homeView;
homeView=function(){return beforeConsistentPortalHome()};
// Runtime may fill geometry for newly introduced widgets, but must never move saved rectangles.
normalizeRuntimeGrid=function(p,ids){p.gridLayout??={};const placed=ids.filter(id=>p.gridLayout[id]).map(id=>p.gridLayout[id]);for(const id of ids.filter(id=>!p.gridLayout[id])){const r={x:0,y:0,w:12,h:8};let found=false;for(let y=0;!found;y++)for(let x=0;x<=36;x++){const candidate={...r,x,y};if(!placed.some(a=>gridOverlap(a,candidate))){Object.assign(r,candidate);found=true;break}}p.gridLayout[id]=r;placed.push(r)}};
// Preview uses a copy so rendering cannot change the published portal definition.
const beforeConsistentStyles=applyDesignerCardStyles;
applyDesignerCardStyles=function(root,p){beforeConsistentStyles(root,structuredClone(p))};
render();
