/* Tab-local development testing; the original administrator session is retained. */
(function(root){'use strict';
const KEY='neumdesk_development_test';
function read(storage){try{return JSON.parse(storage.getItem(KEY)||'null')}catch{return null}}
function begin(storage,keys,original,response){if(read(storage))throw Error('Return to the administrator before starting another test.');if(!original.token||!response.token||!response.user?.id)throw Error('Incomplete test session.');const marker={token:original.token,user:original.user,name:response.user.full_name,expiresAt:Date.now()+response.expires_in*1000};storage.setItem(KEY,JSON.stringify(marker));try{storage.setItem(keys.token,response.token);storage.setItem(keys.user,JSON.stringify(response.user))}catch(e){storage.setItem(keys.token,original.token);storage.removeItem(KEY);throw e}return marker}
function end(storage,keys){const marker=read(storage);if(!marker)return false;storage.setItem(keys.token,marker.token);if(marker.user)storage.setItem(keys.user,JSON.stringify(marker.user));else storage.removeItem(keys.user);storage.removeItem(KEY);return true}
const api={read,begin,end};root.NeumTestSession=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
