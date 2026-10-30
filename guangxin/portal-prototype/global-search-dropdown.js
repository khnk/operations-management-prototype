globalSearchBox.querySelector('button')?.remove();
const globalDropdown=document.createElement('div');globalDropdown.id='globalFunctionDropdown';globalDropdown.className='global-function-dropdown hidden';globalDropdown.innerHTML='<div id="globalFunctionResults"></div>';globalSearchBox.appendChild(globalDropdown);
const globalInput=$('globalFunctionSearch');globalInput.setAttribute('aria-expanded','false');globalInput.setAttribute('aria-controls','globalFunctionDropdown');let globalSearchDebounce=null;
runGlobalFunctionSearch=function(){globalSearchText=globalInput.value.trim();if(!globalSearchText){hideGlobalSearchDropdown();return}globalDropdown.classList.remove('hidden');globalInput.setAttribute('aria-expanded','true');renderGlobalFunctionResults()};
globalInput.oninput=()=>{clearTimeout(globalSearchDebounce);globalSearchDebounce=setTimeout(runGlobalFunctionSearch,180)};
globalInput.onfocus=()=>{if(globalInput.value.trim())runGlobalFunctionSearch()};
globalInput.onkeydown=e=>{if(e.key==='Escape'){clearTimeout(globalSearchDebounce);hideGlobalSearchDropdown()}else if(e.key==='Enter'){clearTimeout(globalSearchDebounce);runGlobalFunctionSearch()}};
function hideGlobalSearchDropdown(){globalDropdown.classList.add('hidden');globalInput.setAttribute('aria-expanded','false')}
document.addEventListener('click',e=>{if(!e.target.closest('.global-search-box')){clearTimeout(globalSearchDebounce);hideGlobalSearchDropdown()}});
const beforeDropdownOpenGlobal=openGlobalFunction;
openGlobalFunction=function(id,mode){hideGlobalSearchDropdown();beforeDropdownOpenGlobal(id,mode)};
const beforeSearchUserSwitch=switchUser;
switchUser=function(id){clearTimeout(globalSearchDebounce);globalInput.value='';globalSearchText='';hideGlobalSearchDropdown();beforeSearchUserSwitch(id)};
const dropdownCss=document.createElement('style');dropdownCss.textContent='.global-search-box{position:relative}.global-function-dropdown{position:absolute;top:calc(100% + 8px);right:0;width:600px;max-width:calc(100vw - 30px);max-height:min(480px,70vh);overflow:auto;background:white;border:1px solid #e0e7f2;border-radius:10px;box-shadow:0 10px 35px #20375726;padding:8px 16px;z-index:20}.global-function-dropdown .global-function-result{padding:14px 0}.global-function-dropdown .global-function-result strong{font-size:13px}.global-function-dropdown .global-function-result .gap{flex-shrink:0}.global-function-dropdown .global-function-result button{font-size:12px;padding:7px 10px}@media(max-width:560px){.global-function-dropdown{width:100%;max-width:100%;padding:8px 12px}.global-function-dropdown .global-function-result{flex-direction:column}.global-function-dropdown .sub{font-size:11px}}';document.head.appendChild(dropdownCss);
