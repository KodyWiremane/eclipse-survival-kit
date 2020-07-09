// A temporary module incapsulating the old BG script flow

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
const log = new Logger('ESK:MAIN');
const config = new Config();

setupMessageDispatcher();
setupFakePortListener();

fillConfigGapsWithDefaults(() => log.info('Extension started successfully'));



/* MESSAGE DISPATCHER */

function setupMessageDispatcher() {
    chrome.runtime.onMessage.addListener(messageDispatcher);
}

function messageDispatcher (message, sender, talkback) {
    switch (typeof message) {
        case 'string':
            switch (message) {
                case 'OpenOptionsPage':
                    onOpenOptionsPage(sender);
                    break;
            }
            break;
        case 'object':
            switch (message.name) {
                case 'QueryConfig':
                    config.get(message.query, response => talkback(response));
                    return true; // to keep talkback valid until called
                    break;
            }
            break;
    }
}

// for app-settings-widget.js:setupRuntimeMonitor()
function setupFakePortListener() {
    chrome.runtime.onConnect.addListener(() => {});
}



/* MESSAGE HANDLERS */

function onOpenOptionsPage(sender) {
    openOptionsPageFromTab(sender.tab);
}



/* EFFECTORS */

function fillConfigGapsWithDefaults(callback) {
    config.get(
        Object.keys(DEFAULTS),
        stored => onStoredConfigRetrieved(stored, callback)
    );
}

function onStoredConfigRetrieved(stored, callback) {
    if (config.lastError) {
        log.error(`Failed to retrieve config values: ${config.lastError}`);
    }

    const existing = Object.keys(stored);

    const overlay = Object.entries(DEFAULTS)
        .filter(pair => !existing.includes(pair[0]))
        .reduce((acc, pair) => {acc[pair[0]] = pair[1]; return acc;}, {});

    if (Object.keys(overlay).length > 0) {
        config.set(overlay, () => onDefaultsWrittenCallOrReport(callback));
    } else {
        callback();
    }
}

function onDefaultsWrittenCallOrReport(callback) {
    if (!config.lastError) {
        log.info('Succesfully recreated missing config values from defaults');
        callback();
    } else {
        log.error(`Failed to recreate missing config values from defaults: ${config.lastError}`);
    }
}

function openOptionsPageFromTab(tab) {
    chrome.runtime.openOptionsPage();
    /*
    chrome.tabs.create({
        url: chrome.runtime.getManifest().options_page,
        index: tab.index + 1,
        openerTabId: tab.id
    });
    */
}
