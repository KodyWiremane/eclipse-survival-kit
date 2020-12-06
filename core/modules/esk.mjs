// A temporary module incapsulating the old BG script flow

import {EskExtensionConfig} from './esk-extension-config.mjs';
import {Dapi} from './dapi.mjs';
import {NativeLogger} from '../../js/modules/native-logger.mjs';
import {isObject} from '../../js/modules/utils.mjs';

/* DEFINITIONS */
const DEFAULTS = {
    'ui-augments.add-thumbs-with-ordinal-indices': true,
    'ui-augments.add-um-profile-links': true,
    'ui-augments.disable-side-dva-zoom': false,
    'ui-augments.disable-watch-feed-zoom': false,
    'ui-augments.enable-better-watch-indi': true,
    'ui-patches.enable-dva-img-pe': true,
    'ui-patches.fix-blocking-tooltips': true,
    'ui-patches.fix-comment-avatar-ghost-link': true,
    'ui-patches.fix-um-fallout': true
};



/* STARTUP */
const log = new NativeLogger('ESK');
const config = new EskExtensionConfig();
const dapi = new Dapi();

setupMessageDispatcher();
setupFakePortListener();
setupAuthUriInterceptor();

fillConfigGapsWithDefaults()
.then(() => log.info('Extension started successfully'))
.catch(error => log.error(`Failed to health-check stored config: ${error.message}`));



/* MESSAGE DISPATCHER */

function setupMessageDispatcher() {
    chrome.runtime.onMessage.addListener(messageDispatcher);
}

// returns true when needs to call talkback asynchronously
function messageDispatcher (envelope, sender, talkback) {
    if (!isObject(envelope)) {
        throw new TypeError('Type of envelope must be object')
    }
    const {name: message, payload: query} = envelope;

    switch (message) {
        case 'OpenOptionsPage':
            onOpenOptionsPage(sender)
            .then(() => talkback(null))
            .catch(error => (log.error(error.message), talkback({'error': error.message})));
            return true;
            break;
        case 'OpenOptionsPageHere':
            talkback(null);
            onOpenOptionsPageHere(sender);
            break;
        case 'QueryConfig':
            config.get(query)
            .then(items => talkback({payload: items}))
            .catch(error => (log.error(error.message), talkback({'error': error.message})));
            return true;
            break;
        case 'QueryDapiStatus':
            dapi.getUserStatus()
            .then(status => talkback({payload: Dapi.statusToString(status)}))
            .catch(error => (log.error(error.message), talkback({'error': error.message})));
            return true;
            break;
        case 'BindToApp':
            dapi.bindToApp(query.appName, query.appId, query.clientId, query.clientSecret)
            .then(() => talkback(null))
            .catch(error => (log.error(error.message), talkback({'error': error.message})));
            return true;
            break;
    }
}

// for app-settings-widget.js:setupRuntimeMonitor()
function setupFakePortListener() {
    chrome.runtime.onConnect.addListener(() => {});
}

// for Dapi::processAuthorizationRedirectUri
function setupAuthUriInterceptor() {
    const redirectUri = dapi.getRedirectUri();
    const internalRedirectUri = chrome.runtime.getURL('core/authorize.html');

    function handleTabUrl(tab, url) {
        if (url && url.startsWith(redirectUri)) {
            const finalUrl = url.replace(redirectUri, internalRedirectUri);
            chrome.tabs.update(tab.id, {url: finalUrl, active: true});
            //chrome.tabs.remove(tab.id);
            //dapi.processAuthorizationRedirectUri(url)
            //.then(() => chrome.runtime.openOptionsPage());
        }
    }

    chrome.tabs.onCreated.addListener(tab => handleTabUrl(tab, tab.url || tab.pendingUrl));
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => handleTabUrl(tab, changeInfo.url));
}



/* MESSAGE HANDLERS */

function onOpenOptionsPage(sender) {
    return openOptionsPageFromTab(sender.tab);
}

function onOpenOptionsPageHere(sender) {
    chrome.tabs.update(sender.tab.id, {url: chrome.runtime.getURL('core/options.html')});
}



/* EFFECTORS */

function fillConfigGapsWithDefaults() {
    return (
        config.get(Object.keys(DEFAULTS))
        .then(onStoredConfigRetrieved)
    );
}

function onStoredConfigRetrieved(stored) {
    const existing = Object.keys(stored);

    const overlay = Object.entries(DEFAULTS)
        .filter(pair => !existing.includes(pair[0]))
        .reduce((acc, pair) => {acc[pair[0]] = pair[1]; return acc;}, {});

    if (Object.keys(overlay).length > 0) {
        return config.set(overlay);
    }
}

function openOptionsPageFromTab(tab) {
    return new Promise((resolve, reject) =>
        chrome.runtime.openOptionsPage(
            () => !chrome.runtime.lastError ? resolve() : reject(chrome.runtime.lastError)
        )
    );
    /*
    chrome.tabs.create({
        url: chrome.runtime.getManifest().options_page,
        index: tab.index + 1,
        openerTabId: tab.id
    });
    */
}
