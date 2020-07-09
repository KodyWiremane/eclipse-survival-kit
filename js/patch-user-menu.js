/* Add profile section links to the user menu. */
/* FYI: There are users named literally favourites and Favorites. */
(() => {

'use strict';

const CFG_FLAG = 'ui-augments.add-um-profile-links'; // controlling configuration flag
const STAB_TIMEOUT = 1000; // ms since last mutation to the menu subtree before injection
const SECTION_IN_MENU = 0; // inject the link into this menu section (0-based index),
const POSITION_IN_SECTION = 1; // this position (0-based index)



const log = new Logger('ESK:PUM');

chrome.runtime.sendMessage(
    {name: 'QueryConfig', query: CFG_FLAG},
    response => response[CFG_FLAG] && monitorUserMenuAndInjectLinks()
);



function monitorUserMenuAndInjectLinks() {
    // watch React's #root carefully, or foist <body> when on legacy pages
    const radar = new DomRadar(document.getElementById('root') || document.body);
    const mutationTimer = new Timer(STAB_TIMEOUT, timerCallback);
    var userMenu;

    radar.setEnterHandler(onRadarEnter);
    radar.setLossHandler(onRadarLoss);

    log.info('Waiting for user menu…');
    tryLockUserMenu();

    function onRadarEnter(entered) {
        if (userMenu) {
            return;
        }
        tryLockUserMenu();
    }

    function onRadarLoss(target) {
        if (target !== userMenu) {
            return;
        }
        log.info('User menu dropped');
        tryLockUserMenu();
    }

    function tryLockUserMenu() {
        userMenu = getUserMenu();
        if (userMenu) {
            radar.lockTarget(userMenu);
            mutationTimer.reset();
            log.info('User menu locked');
        }
    }

    function timerCallback () {
        log.info('Consider user menu stabilized');
        injectLinksIntoUserMenu(userMenu);
    }
}



function getUserMenu () {
    var queried = document.querySelectorAll('#site-header-user-menu');
    if (queried.length === 0) {
        return null;
    }
    if (queried.length > 1) {
        log.warning('Multiple user menus located, picking first');
    }
    return queried[0];
}

function injectLinksIntoUserMenu(userMenu) {
    try {
        const menuPanelHtml = buildMenuPanelHtmlForUserMenu(userMenu);
        const section = getSectionFromUserMenuByIndex(userMenu, SECTION_IN_MENU);
        insertHtmlIntoSectionAtPosition(menuPanelHtml, section, POSITION_IN_SECTION);
        log.info('Links injected into user menu');
    } catch (e) {
        log.error(`Cannot patch user menu: ${e}`);
    }
}

function buildMenuPanelHtmlForUserMenu(userMenu) {
    const sharedClassNames = getChildSharedClassesFromUserMenu(userMenu);
    const username = getUserNameFromUserMenu(userMenu);
    const panelChildrenHtml = buildMenuPanelChildrenHtmlWithUsername(username);
    return `<div id="esk-user-menu-panel" class="${sharedClassNames}">${panelChildrenHtml}</div>`;
}

function getChildSharedClassesFromUserMenu (userMenu) {
    var queried = userMenu.querySelectorAll(':scope > div > [class]');
    return Array.from(queried)
        .map(item => item.className)
        .filter(data => data)
        .map(names => names.split(/\s/g).filter(name => name.trim() !== ''))
        .reduce((acc, names) => names.filter(name => acc.includes(name)))
        .join(' ')
}

function getUserNameFromUserMenu(userMenu) {
    const userLink = userMenu.querySelector('a[data-hook="user_link"');
    if (!userLink) {
        log.error('Cannot read user link');
        return;
    }
    return userLink.getAttribute('data-username');
}

function buildMenuPanelChildrenHtmlWithUsername(username) {
    if (isUndefined(username) || username === '') {
        throw 'Cannot get username';
    }
    return `<a href="/${username}/about">About</a
    ><a href="/${username}/gallery">Gallery</a
    ><a href="/${username}/favourites">Favourites</a
    ><a href="/${username}/posts">Posts</a
    ><a href="/${username}/shop">Shop</a
    ><a href="/${username}/stats">Stats</a>`;
}

function getSectionFromUserMenuByIndex(userMenu, sectionIndex) {
    var queried = userMenu.querySelectorAll(':scope > div');
    if (queried.length === 0) {
        log.warning('No menu sections found');
        return;
    }
    if (queried.length < sectionIndex + 1) {
        log.warning('Unexpected end of sections, picking last');
        sectionIndex = queried.length - 1;
    }
    return queried[sectionIndex];
}

function insertHtmlIntoSectionAtPosition(html, section, position) {
    var items = section.childNodes;
    if (items.length < position + 1) {
        log.warning('Unexpected end of section items, picking last');
        position = items.length === 0 ? 0 : items.length;
    }

    var before = items[position];
    before ? before.insertAdjacentHTML('beforebegin', html) : section.insertAdjacentHTML('beforeend', html);
}

})()
