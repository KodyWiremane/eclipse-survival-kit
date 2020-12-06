(async () => {

'use strict';

const NativeLogger = (await import('../js/lib/native-logger.js')).NativeLogger;
const EskMessageClient = (await import('../js/lib/esk-message-client.js')).EskMessageClient;

const log = new NativeLogger('ESK:ASW');
const eskLink = new EskMessageClient();
var isRuntimeAlive = true;

setupRuntimeMonitor();
injectWidget();

function setupRuntimeMonitor() {
    const port = chrome.runtime.connect();
    port.onDisconnect.addListener(() => isRuntimeAlive = false);
}

function injectWidget() {
    const apps = document.getElementById('applications');
    if (!apps) {
        log.error('Cannot locate main application panel');
        return;
    }

    apps.insertAdjacentHTML(
        'beforebegin',
        `<section id="esk-widget"
            ><header>Eclipse Survival Kit</header
            ><div id="esk-main"
                ><div>OAuth Status: <span id="esk-oa2status"></span></div
            ></div
            ><footer
                ><span class="esk-footer-buttons"><button id="esk-options">Options</button></span
                ><span class="esk-footer-text">ESK is not a part of or in anyway approved by DA</span
            ></footer
        ></section>`
    );

    eskLink.sendMessage("QueryDapiStatus")
    .then(status => document.getElementById('esk-oa2status').appendChild(document.createTextNode(status)))
    .catch(error => {
        log.error(`Failed to retrieve OAuth status: ${error.message}`);
        document.getElementById('esk-oa2status').appendChild(document.createTextNode('<ERROR>'));
    });

    document.getElementById('esk-options').addEventListener(
        'click', () => callIfRuntimeAlive(requestOpenOptionsPage)
    )
}

function callIfRuntimeAlive(callback) {
    isRuntimeAlive ? callback() : informUserRuntimeIsDead();
}

function requestOpenOptionsPage() {
    eskLink.sendMessage("OpenOptionsPage")
    .catch(error => log.error(`Open options page failed: ${error.message}`));
}

function informUserRuntimeIsDead() {
    window.alert('ESK extension has been stopped. Please reload the page.');
}

})()
