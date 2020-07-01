(() => {
    'use strict';

    const config = new Config();
    const log = new Logger('ESK:CFG')
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
    }, spawnUi)

    function spawnUi(configuration) {

        const container = document.getElementById('container');
        container.addEventListener("change", onControlChange);

        const gNote = createOptionGroup('Note');
        gNote.appendChild(createOptionText(
            'New configuration is read on page load. Refresh your DA tabs to apply new settings.')
        );
        const gUiAugments = createOptionGroup('UI Augments');
        const gUiPatches = createOptionGroup('UI Patches');

        [
            gNote,
            gUiAugments,
            gUiPatches
        ]
        .forEach(group => container.appendChild(group));

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
    }



    function createOptionGroup(label) {
        const group = document.createElement('section');
        group.className = 'option-group';
        group.setAttribute('data-label', label);
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
        config.set(request, () => config.lastError
            ? log.error(`Failed to store ${controlName} setting`)
            : log.info(`Successfully stored ${controlName} setting`)
        );
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

})()
