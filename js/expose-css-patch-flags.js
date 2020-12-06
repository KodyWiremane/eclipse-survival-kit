/* Set <body data-esk-flags> from the config to trigger CSS patches */
(async () => {

'use strict';

const FLAGS = {
    'ui-augments.add-thumbs-with-ordinal-indices': 'aug-thumb-ordinals',
    'ui-augments.disable-side-dva-zoom': 'aug-unzoom-side',
    'ui-augments.disable-watch-feed-zoom': 'aug-unzoom-watch',
    'ui-augments.enable-better-watch-indi': 'aug-watch-indi',
    'ui-patches.enable-dva-img-pe': 'fix-dva-pe',
    'ui-patches.fix-blocking-tooltips': 'fix-tooltips',
    'ui-patches.fix-comment-avatar-ghost-link': 'fix-ghost-comlink',
    'ui-patches.fix-um-fallout': 'fix-um-fallout'
};

const URL_ESK_MESSAGE_CLIENT = chrome.runtime.getURL('js/lib/esk-message-client.js');
const URL_NATIVE_LOGGER = chrome.runtime.getURL('js/lib/native-logger.js');

const EskMessageClient = (await import(URL_ESK_MESSAGE_CLIENT)).EskMessageClient;
const NativeLogger = (await import(URL_NATIVE_LOGGER)).NativeLogger;

const log = new NativeLogger('ESK:FLAGS');
const eskLink = new EskMessageClient();

eskLink.sendMessage('QueryConfig', Object.keys(FLAGS))
.then(onFlagConfigRetrieved)
.catch(error => log.error(`Config query failed: ${error.message}`));



function onFlagConfigRetrieved(settings) {
    if (settings) {
        document.body.setAttribute(
            'data-esk-flags',
            Object.entries(settings)
                .filter(pair => pair[1])
                .map(pair => FLAGS[pair[0]])
                .join(' ')
        );
        log.info('CSS patch flags set successfully');
    } else {
        log.error(`Failed to retrieve CSS flags configuration: ${config.lastError}`)
    }
}

})()
