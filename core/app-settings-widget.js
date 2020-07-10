(() => {

'use strict';

const log = new NativeLogger('ESK:ASW');
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

    document.getElementById('esk-oa2status')
        .appendChild(document.createTextNode('NOT IMPLEMENTED ATM'));

    document.getElementById('esk-options').addEventListener(
        'click', () => callIfRuntimeAlive(requestOpenOptionsPage)
    )
}

function callIfRuntimeAlive(callback) {
    isRuntimeAlive ? callback() : informUserRuntimeIsDead();
}

function requestOpenOptionsPage() {
    chrome.runtime.sendMessage("OpenOptionsPage");
}

function informUserRuntimeIsDead() {
    window.alert('ESK extension has been stopped. Please reload the page.');
}

})()
