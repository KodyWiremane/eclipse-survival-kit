import {Dapi} from './dapi.mjs';
import {NativeLogger} from '../../js/modules/native-logger.mjs';

const dapi = new Dapi();
const log = new NativeLogger('ESK:AUTH');
const optionsUrl = chrome.runtime.getURL('core/options.html');

dapi.processAuthorizationRedirectUri(window.location.href)
.then(
    () => window.location.href = optionsUrl,
//.else()
    error => {
        log.error('Processing redirect URL failed:', error);
        window.alert(`Processing redirect URL failed: ${error.message}`);
        window.location.href = optionsUrl;
    }
);
