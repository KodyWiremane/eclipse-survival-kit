(async () => {
'use strict';

const URL_ESK_MESSAGE_CLIENT = chrome.runtime.getURL('js/modules/esk-message-client.mjs');
const URL_NATIVE_LOGGER = chrome.runtime.getURL('js/modules/native-logger.mjs');

const EskMessageClient = (await import(URL_ESK_MESSAGE_CLIENT)).EskMessageClient;
const NativeLogger = (await import(URL_NATIVE_LOGGER)).NativeLogger;

const log = new NativeLogger('ESK:BIND');
const eskLink = new EskMessageClient();

eskLink.sendMessage('QueryDapiStatus')
.then(status => proceedWithAuthStatus(status))
.catch(error => log.error(`Failed to get auth status: ${error.message}`));

function proceedWithAuthStatus(dapiStatus) {
    log.info(`Auth status: ${dapiStatus}`);

    if (dapiStatus === 'UNBOUND') {
        const sharedPanel = document.querySelector(
            '.developers.fooview.altaltview.h .fooview-inner p:last-child'
        );

        if (!sharedPanel) {
            return log.error('Failed to get shared panel');
        }

        const startingButton = document.createElement('a');
        startingButton.className = 'smbutton smbutton-big smbutton-shadow';
        startingButton.href = 'javascript:void(0);'
        startingButton.addEventListener('click', e => (startingButton.remove(), onStart(e)));
        startingButton.insertAdjacentHTML('afterbegin', '<span>Bind ESK to app</span>');
        sharedPanel.appendChild(startingButton);
    }
}

function onStart(event) {
    event.preventDefault();

    const appFrames = Array.from(
        document.querySelectorAll('.settings_applications')
        [1].querySelectorAll('.developers.fooview.ch .fooview-inner')
    );

    var buttonRegistry = [];
    appFrames.forEach(frame => {
        let bindingButton = document.createElement('a');
        buttonRegistry.push(bindingButton);
        bindingButton.className = 'smbutton smbutton-size-large smbutton-shadow';
        bindingButton.href = 'javascript:void(0);';
        bindingButton.appendChild(document.createTextNode('Bind ESK'));
        bindingButton.addEventListener('click', e => (e.preventDefault(), bindApp(frame, buttonRegistry)));
        frame.querySelector('.buttons.ch.hh .rr').insertAdjacentElement('afterbegin', bindingButton);
    });
}

function bindApp(appFrame, buttonRegistry) {
    const appName = appFrame.querySelector(':scope > h3').innerText.trim();
    const appId = appFrame.querySelector('a.delete-app-button').getAttribute('data-deviationid');
    const clientId = appFrame.querySelector('input.clientid').value;
    const clientSecret = appFrame.querySelector('input.apikey[type="text"]').value;

    if (!confirm(`Bind ESK to ${appName}? (App ID: ${appId})`)) {
        return;
    }

    buttonRegistry.forEach(button => button.remove());
    buttonRegistry.length = 0;

    eskLink.sendMessage(
        'BindToApp',
        {
            'appName': appName,
            'appId': appId,
            'clientId': clientId,
            'clientSecret': clientSecret
        }
    )
    .catch(error => log.error(`Failed binding to app ID ${appId}`, error))
    .then(() => {
        log.info(`Successfully bound to app ${appName} (ID ${appId}, Client ID ${clientId})`);
        eskLink.sendMessage('OpenOptionsPageHere')
        .catch('Cannot navigate to the ESK configuration page. Please proceed there yourself.');
    });
}

})()
