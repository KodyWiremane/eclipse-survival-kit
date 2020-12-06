import {EskExtensionConfig} from './esk-extension-config.mjs';
import {UserInfo} from './userinfo.mjs';
import {Dapi} from './dapi.mjs';
import {DapiConfig} from './dapi-config.mjs';
import {NativeLogger} from '../../js/modules/native-logger.mjs';

const config = new EskExtensionConfig();
const log = new NativeLogger('ESK:CFG')
const dapi = new Dapi();
const ESK_DAPI_SCOPE = ['basic', 'browse'];

config.get({
    'ui-augments.add-thumbs-with-ordinal-indices': true,
    'ui-augments.add-um-profile-links': true,
    'ui-augments.disable-side-dva-zoom': true,
    'ui-augments.disable-watch-feed-zoom': true,
    'ui-augments.enable-better-watch-indi': true,
    'ui-patches.enable-dva-img-pe': true,
    'ui-patches.fix-blocking-tooltips': true,
    'ui-patches.fix-comment-avatar-ghost-link': true,
    'ui-patches.fix-um-fallout': true
})
.catch(error => log.error('Failed to get config', error))
.then(data => { return spawnUi(data); })
.catch(error => log.error('Failed to spawn UI', error));

async function spawnUi(configuration) {

    const container = document.getElementById('container');
    container.addEventListener("change", onControlChange);

    const gNote = createOptionGroup('Note');
    const gDapiStatus = createOptionGroup('Auth Status');
    const gUiAugments = createOptionGroup('UI Augments');
    const gUiPatches = createOptionGroup('UI Patches');
    const gUiDangerous = createDangerousOptionGroup('Reset');

    [
        gNote,
        gDapiStatus,
        gUiAugments,
        gUiPatches,
        gUiDangerous
    ]
    .forEach(group => container.appendChild(group));

    gNote.appendChild(createOptionText(
        'New configuration is read on page load. Refresh your DA tabs to apply new settings.')
    );

    const userInfo = await UserInfo.get();
    const uniqueId = userInfo.getUniqueId();

    dapi.getUserStatus(userInfo)
    .catch(error => log.error(`Failed to get auth status:`, error))
    .then(async function(status) {
        log.info(`Auth status: ${Dapi.statusToString(status)}`);
        switch (status) {
            case Dapi.STATUS_AMBIGUOUS:
                gDapiStatus.appendChild(createOptionText(
                    'The status is ambigous, but not handled by the current implementation yet'
                ));
                break;

            case Dapi.STATUS_ANONYMOUS:
                gDapiStatus.appendChild(createOptionText(
                    'You do not appear logged in. Log in to DA to access ESK integration functionality.'
                ));
                break;

            case Dapi.STATUS_UNBOUND:
                gDapiStatus.appendChild(createOptionText(
                    'ESK is not bound to any of your applications. '
                    + 'You must register a dummy DA application so ESK can use its identity '
                    + 'to access DA API on your behalf.'
                ));
                gDapiStatus.appendChild(createOptionText(
                    'Edit the application and set Grant Type to Authorization Code, '
                    + `and Redirect URI Whitelist to ${dapi.getRedirectUri()}, `
                    + 'and uncheck everything in the Gallery and Group options.'
                ));
                gDapiStatus.appendChild(createOptionText(
                    'Then use the Bind ESK to app button in DA application list.'
                ));
                gDapiStatus.appendChild(createButton(
                    'Bind to app',
                    e => (e.target.disabled = true, onClick_Bind())
                ));
                break;

            case Dapi.STATUS_BOUND:
                const boundAppData = await dapi.getBoundAppData(uniqueId);
                gDapiStatus.appendChild(createOptionText(
                    `ESK is bound to your application ID:${boundAppData.appId}.`
                ));
                gDapiStatus.appendChild(createOptionText(
                    'You can rebind to another application, or activate the binding '
                    + 'so ESK can actually access DA API on your behalf.'
                ));
                gDapiStatus.appendChild(createOptionText(
                    `(Remember, your application must have ${dapi.getRedirectUri()} in its Redirect URI Whitelist); `
                    + 'edit it if it does not.'
                ));
                gDapiStatus.appendChild(createButton(
                    'Activate',
                    e => (e.target.disabled = true, onClick_Activate())
                ));
                gDapiStatus.appendChild(createButton(
                    'Edit App',
                    e => (e.target.disabled = true, onClick_Edit(boundAppData.appId))
                ))
                gDapiStatus.appendChild(createButton(
                    'Unbind',
                    e => (e.target.disabled = true, onClick_Unbind())
                ));
                break;
            case Dapi.STATUS_UNAUTHORIZED:
                gDapiStatus.appendChild(createOptionText(
                    'STATUS_UNAUTHORIZED (handling yet to be implemented).'
                ));
                break;
            case Dapi.STATUS_AUTHORIZED:
                gDapiStatus.appendChild(createOptionText(
                    'STATUS_AUTHORIZED (handling yet to be implemented).'
                ));
                gDapiStatus.appendChild(createButton(
                    'Test',
                    e => {
                        dapi.query('https://www.deviantart.com/api/v1/oauth2/placebo')
                        .then(r => (window.alert(`RESPONSE: ${JSON.stringify(r)}`)))
                        .catch(e=> (console.log(e), window.alert(`ERROR: ${e.message}`)))
                    }
                ));
                gDapiStatus.appendChild(createButton(
                    'Test Get Folders',
                    e => {
                        dapi.query('https://www.deviantart.com/api/v1/oauth2/collections/folders')
                        .then(r => (window.alert(`RESPONSE: ${JSON.stringify(r)}`)))
                        .catch(e=> (console.log(e), window.alert(`ERROR: ${e.message}`)))
                    }
                ))
                break;
            default:
                gDapiStatus.appendChild(createOptionText(
                    `Unknown status ${status}, ask the developer.`
                ))
    }});

    function onClick_Bind() {
        window.location.href = dapi.getBindingUri();
    }

    function onClick_Activate() {
        dapi.requestAuthorizationUri(uniqueId, ESK_DAPI_SCOPE)
        .catch(e => {
            log.error('Failed to activate API binding:', e);
            window.alert(`Failed to activate API binding: ${e.message}`);
            window.location.reload();
        })
        .then(authUri => window.location.href = authUri);
    }

    function onClick_Edit(appId) {
        window.location.href = dapi.getEditUriForAppId(appId);
    }

    function onClick_Unbind() {
        dapi.unbind()
        .catch(e => {
            log.error('Failed to unbind ESK', e);
            window.alert(`Failed to unbind ESK: ${e.message}`);
            window.location.reload();
        })
        .then(() => (window.alert('ESK unbound successfully'), window.location.reload()));
    }

    [
        createConfigCheckbox(
            'ui-augments.add-um-profile-links',
            'Add profile section links to the user menu',
            configuration['ui-augments.add-um-profile-links']
        ),
        createConfigCheckbox(
            'ui-augments.enable-better-watch-indi',
            'Make watch update mark more prominent',
            configuration['ui-augments.enable-better-watch-indi']
        ),
        createConfigCheckbox(
            'ui-augments.disable-watch-feed-zoom',
            'Disable thumbnail zoom in watch feeds',
            configuration['ui-augments.disable-watch-feed-zoom']
        ),
        createConfigCheckbox(
            'ui-augments.disable-side-dva-zoom',
            'Disable thumbnail zoom on the deviation sidepanel',
            configuration['ui-augments.disable-side-dva-zoom']
        ),
        createConfigCheckbox(
            'ui-augments.add-thumbs-with-ordinal-indices',
            'Add ordinal numbers to collection/gallery thumbnails',
            configuration['ui-augments.add-thumbs-with-ordinal-indices']
        )
    ]
    .forEach(item => gUiAugments.appendChild(item));

    [
        createConfigCheckbox(
            'ui-patches.fix-um-fallout',
            'Prevent invisible buttons from triggering the user menu fallout',
            configuration['ui-patches.fix-um-fallout']
        ),
        createConfigCheckbox(
            'ui-patches.enable-dva-img-pe',
            'Enable mouse interaction for zoomed-in images (allow right-click saving)',
            configuration['ui-patches.enable-dva-img-pe']
        ),
        createConfigCheckbox(
            'ui-patches.fix-blocking-tooltips',
            'Prevent tooltips from blocking underlying things',
            configuration['ui-patches.fix-blocking-tooltips']
        ),
        createConfigCheckbox(
            'ui-patches.fix-comment-avatar-ghost-link',
            'Remove the invisible link under comments\' userpic',
            configuration['ui-patches.fix-comment-avatar-ghost-link']
        )
    ]
    .forEach(item => gUiPatches.appendChild(item));

    [
        createOptionText(
            'Resetting settings will set all customizable options to their default values '
            + 'and reload ESK so they come into effect.'
        ),
        createButton(
            'Reset Settings',
            resetSettings
        ),
        createOptionHtmlText(
            'Wiping authentication data will delete all access tokens and related data ESK has stored '
            + 'in this browser, and reload ESK. Note that this is a fallback procedure that should not '
            + 'be used normally or without understanding of its consequences. Also note that this '
            + 'will not revoke access tokens on DA side; you will have to take care of that yourself,'
            + 'on <a href="https://www.deviantart.com/settings/apps">DA Applications Settings</a> page.'
        ),
        createButton(
            'Wipe Auth Data',
            wipeAuthData
        )
    ]
    .forEach(item => gUiDangerous.appendChild(item));

    function resetSettings() {
        if (!window.confirm('Do you want to reset ESK settings?')) {
            return;
        }
        config.clear()
        .then(
            () => chrome.runtime.reload(),
        //.else()
            error => window.alert(`Failed to reset settings: ${error.message}`)
        );
    }

    function wipeAuthData() {
        if (!window.confirm('Do you want to wipe ESK authentication data?')) {
            return;
        }
        const dapiConfig = new DapiConfig();
        dapiConfig.clear()
        .then(
            () => chrome.runtime.reload(),
        //.else()
            error => window.alert(`Failed to wipe authentication data: ${error.message}`)
        );
    }
}



function createOptionGroup(label) {
    const group = document.createElement('section');
    group.className = 'option-group';
    group.setAttribute('data-label', label);
    return group;
}

function createDangerousOptionGroup(label) {
    const group = createOptionGroup(label);
    group.className = [group.className, 'dangerous'].join(' ');
    return group;
}

function createOptionSeparator() {
    const separator = document.createElement('hr');
    separator.className = 'option-separator';
    return separator;
}

function createOptionText(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'option-text';
    wrapper.appendChild(document.createTextNode(text));
    return wrapper;
}

function createOptionHtmlText(html) {
    const wrapper = document.createElement('div');
    wrapper.className = 'option-text';
    wrapper.innerHTML = html;
    return wrapper;
}

function createButton(label, onClick) {
    const control = document.createElement('button');
    control.appendChild(document.createTextNode(label));
    control.className = 'control-button';
    control.addEventListener('click', onClick);
    return control;
}

function createConfigCheckbox(name, label, checked = false) {
    const control = document.createElement('label');
    control.className = 'control-wrapper';
    control.insertAdjacentHTML(
        'afterbegin',
        `<input type="checkbox" class='control-control' data-config-control="${name}"
        ${checked ? 'checked' : ''}><span class="control-label">${label}</span>`
    );
    return control;
}

function createConfigRadio(name, label, value = null, selected = false) {
    const control = document.createElement('label');
    control.className = 'control-wrapper';
    control.insertAdjacentHTML(
        'afterbegin',
        `<input type="radio" name="${name}" class="control-control" data-config-control="${name}"
        ${value !== null ? `value="${value}"` : ''} ${selected ? 'checked' : ''}
        ><span class="control-label">${label}</span>`
    );
    return control;
}

function createConfigRadioGroup(caption, name, radios, selected = null) {
    const wrapper = document.createElement('div');
    wrapper.className = 'radio-group';
    wrapper.appendChild(createOptionText(caption));
    radios.forEach(
        radio => wrapper.appendChild(
            createConfigRadio(name, radio.label, radio.value, radio.value && radio.value === selected)
        )
    );
    return wrapper;
}



function onControlChange(event) {
    const target = event.target;
    const controlName = getControlName(target)
    const controlValue = getControlValue(target);
    const request = {};
    request[controlName] = controlValue;
    config.set(request)
    .then(() => log.info(`Successfully stored ${controlName} setting`))
    .catch(error => log.error(`Failed to store ${controlName} setting`, error));
}

function getControlName(control) {
    return control.hasAttribute('data-config-control') ?
        control.getAttribute('data-config-control') : undefined;
}

function getControlValue(control) {
    switch (control.tagName.toLowerCase()) {
        case 'input':
            switch (control.type) {
                case 'checkbox':
                    return control.checked;
                    break;
                case 'radio':
                    return control.value;
                    break;
                default:
                    return undefined;
            }
            break;
        default:
            return undefined;
    }
}
