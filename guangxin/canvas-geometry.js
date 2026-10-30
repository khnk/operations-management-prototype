/* Grid geometry shared by workbench and custom-component canvases. */
window.PortalCanvasGeometry={columns:12,row:100,gap:12,column(width){return (width+this.gap)/this.columns},snap(value){return Math.round(value)},clamp(value,min,max){return Math.max(min,Math.min(max,value))}};
