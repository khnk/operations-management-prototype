/* Initial desktop layout from the approved reference. */
(() => {
 const version='reference-20261028-v1';
 const grid=[{"type": "todo", "key": "todo:1", "x": 0, "y": 0, "w": 6, "h": 3}, {"type": "portalReminders", "key": "portalReminders:1", "x": 6, "y": 0, "w": 3, "h": 5}, {"type": "reminders", "key": "reminders:1", "x": 9, "y": 0, "w": 3, "h": 5}, {"type": "mail", "key": "mail:1", "x": 0, "y": 3, "w": 3, "h": 3}, {"type": "approval", "key": "approval:1", "x": 3, "y": 3, "w": 3, "h": 4}, {"type": "apps", "key": "apps:1", "x": 6, "y": 5, "w": 6, "h": 2}, {"type": "portalAnnouncements", "key": "portalAnnouncements:1", "x": 0, "y": 6, "w": 3, "h": 3}, {"type": "portalNotices", "key": "portalNotices:1", "x": 3, "y": 7, "w": 4, "h": 2}, {"type": "schedule", "key": "schedule:1", "x": 7, "y": 7, "w": 5, "h": 3}, {"type": "portalNews", "key": "portalNews:1", "x": 0, "y": 9, "w": 7, "h": 4}, {"type": "hotTracking", "key": "hotTracking:1", "x": 7, "y": 10, "w": 5, "h": 7}, {"type": "portalGroup", "key": "portalGroup:1", "x": 0, "y": 13, "w": 7, "h": 2}, {"type": "portalBanner", "key": "portalBanner:1", "x": 0, "y": 15, "w": 7, "h": 2}];
 const components=grid.map(p=>p.type);
 window.PortalDefaults={version,components,grid};
 try{
   if(localStorage.getItem('portal-default-layout-version')!==version){
     localStorage.setItem('work-layout-v1',JSON.stringify(components));
     localStorage.setItem('portal-web-grid-v2',JSON.stringify(grid));
     localStorage.setItem('portal-default-layout-version',version);
   }
 }catch{}
})();
