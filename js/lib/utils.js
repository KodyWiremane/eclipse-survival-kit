'use strict';

function isUndefined(target) {
    return typeof target === 'undefined';
}

function splitStringOnce(string, separator) {
    const [left, ...rights] = string.split(separator);
    return [left, rights.join(separator)];
}

function trimTupleLeft(tuple) {
    tuple[0] = tuple[0].trim();
    return tuple;
}

function getUsernameFromCookies() {
    const cookies = document.cookie.split(';').reduce((cookies, cookieString) => {
        const [cookieName, cookieValue] = trimTupleLeft(splitStringOnce(cookieString, '='));
        cookies[cookieName] = cookieValue;
        return cookies;
    }, {});

    const rawUserinfoCookie = cookies['userinfo'];

    if (isUndefined(rawUserinfoCookie)) {
        return undefined;
    }

    const userinfoCookie = decodeURIComponent(rawUserinfoCookie);
    const [, userinfoJson] = splitStringOnce(userinfoCookie, ';');

    try {
        return JSON.parse(userinfoJson)['username'];
    } catch (e) {
        if (e instanceof SyntaxError) {
            return undefined;
        } else {
            throw e;
        }
    }
}