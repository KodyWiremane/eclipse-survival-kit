/* Add a link to user's Favourites to the user menu. */

(() => {
'use strict';

const STAB_TIMEOUT = 1000; // ms since last mutation to the menu subtree before injection
const ITEM_NAME = 'My Favourites'; // Faves link text
const SECTION_INDEX = 1; // menu section index (0-based)
const ITEM_INDEX = 0; // section item index (0-based)



const log = new Logger('ESK:MF');
waitForUserMenuAndInjectFavourites();



function waitForUserMenuAndInjectFavourites() {
    const mutationTimer = new Timer(STAB_TIMEOUT, timerCallback);
    const observer = new MutationObserver(observerCallback);
    const pageHeader = document.getElementById('da-legacy-header');
    var userMenu = getUserMenu();

    function timerCallback () {
        log.info('Consider user menu stabilized');
        observer.disconnect();
        injectFavouritesIntoUserMenu(userMenu);
    }

    function observerCallback (mutationRecords, observer) {
        let retargetMenu = getUserMenu();
        if (retargetMenu !== null && retargetMenu !== userMenu) {
            mutationTimer.reset();
            userMenu = retargetMenu;
            observer.observe(retargetMenu, observerConfig);
            log.info('User menu locked');
            return;
        }
        if (retargetMenu === null && userMenu !== null) {
            mutationTimer.cancel();
            userMenu = null;
            observer.observe(pageHeader, observerConfig);
            log.warning('User menu dropped');
            return;
        }
    }

    log.info('Waiting for user menu…');

    if (userMenu) {
        log.info('User menu locked');
        mutationTimer.launch();
    }

    const observerConfig = {childList: true, subtree: true};
    observer.observe(userMenu || pageHeader, observerConfig);
}



function injectFavouritesIntoUserMenu(userMenu) {
    const userLink = getUserLinkFromUserMenu(userMenu);
    const faveLink = buildFavouritesLinkFromUserLink(userLink);
    const sharedClassNames = getChildSharedClassesFromUserMenu(userMenu);
    const menuItem = buildMenuItemWithFaveLinkAndSharedClassNames(faveLink, sharedClassNames);
    const section = getSectionFromUserMenuByIndex(userMenu, SECTION_INDEX);
    insertMenuItemIntoSectionAtIndex(menuItem, section, ITEM_INDEX);
    log.info('Favourites injected into user menu');
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

function getUserLinkFromUserMenu (userMenu) {
    var queried = userMenu.querySelectorAll('a[data-hook="user_link"]');
    if (queried.length === 0) {
        log.error('Cannot locate user link');
        return null;
    }
    if (queried.length > 1) {
        log.warning('Multiple user links located, picking first')
    }
    return queried[0];
    // FYI: There are users named literally favourites and Favorites.
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

function buildFavouritesLinkFromUserLink(userLink) {
    const suffix = 'favourites';
    return userLink[userLink.length - 1] === '/' ? userLink + suffix : userLink + '/' + suffix;
}

function buildMenuItemWithFaveLinkAndSharedClassNames(faveLink, sharedClassNames) {
    var item = document.createElement('a');
    item.setAttribute('href', faveLink);
    if (sharedClassNames) {
        item.setAttribute('class', sharedClassNames);
    }
    item.appendChild(document.createTextNode(ITEM_NAME));
    return item;
}

function insertMenuItemIntoSectionAtIndex(newItem, section, itemIndex) {
    var items = section.childNodes;
    if (items.length < itemIndex + 1) {
        log.warning('Unexpected end of section items, picking last');
        itemIndex = items.length === 0 ? 0 : items.length;
    }

    var before = items[itemIndex];
    before ? section.insertBefore(newItem, before) : section.appendChild(newItem);
}

})()
