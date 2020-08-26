import {Dapi} from './dapi.mjs';

console.log('INNNNNNNNNNNNNNNN');

const dapi = new Dapi();
const log = new NativeLogger('ESK:AUTH');
const optionsUrl = chrome.runtime.getURL('core/options.html');

dapi.processAuthorizationRedirectUri(window.location.href)
.then(() => {
    window.alert('Success!');
    window.location.href = optionsUrl;
})
.catch(e => {
    chrome.storage.local.get(null, data => {
        log.info('', data);
        log.info('Failed', e);
        //log.error('Processing redirect URL failed:', e);
        //window.alert(`Processing redirect URL failed: ${e.message}`);
       // window.location.href = optionsUrl;
    });
});
