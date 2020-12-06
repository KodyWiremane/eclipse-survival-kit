'use strict';

/* TYPE CHECKS */

export function isUndefined(target) {
    return typeof target === 'undefined';
}

export function isString(target) {
    return typeof target === 'string';
}

export function isFunction(target) {
    return typeof target === 'function';
}

export function isNull(target) {
    return target === null;
}

export function isArray(target) {
    return Array.isArray(target);
}

export function isObject (target) {
    return typeof target === 'object'
    && !isNull(target)
    && !isArray(target);
}

export function phpType(target) {
    const nativeType = typeof target;
    switch (nativeType) {
        case 'undefined':
        case 'boolean':
        case 'number':
        case 'bigint':
        case 'string':
        case 'symbol':
        case 'function':
            return nativeType;
            break;
        case 'object':
            if (target === null) {
                return 'null';
            }
            if (Array.isArray(target)) {
                return 'array';
            }
            return 'object';
            break;
        default:
            throw 'unknown type';
    }
}

/* STRING OPERATIONS */

export function splitStringOnce(string, separator) {
    const [left, ...rights] = string.split(separator);
    return [left, rights.join(separator)];
}

export function trimTupleLeft(tuple) {
    tuple[0] = tuple[0].trim();
    return tuple;
}

/* CONTAINER OPERATIONS */

export function prefixArrayValues(target, valuePrefix) {
    if (!isArray(target)) {
        throw 'target must be array';
    }
    if (!isString(valuePrefix)) {
        throw 'valuePrefix must be string'
    }
    return target.map((value) => `${valuePrefix}${value}`);
}

export function prefixObjectKeys(target, keyPrefix) {
    if (!isObject(target)) {
        throw 'target must be object';
    }
    if (!isString(keyPrefix)) {
        throw 'keyPrefix must be string'
    }
    return Object.entries(target).reduce((mapped, keyValuePair) => {
        let [key, value] = keyValuePair;
        mapped[`${keyPrefix}${key}`] = value;
        return mapped;
    }, {});
}

export function deprefixObjectKeys(target, keyPrefix) {
    if (!isObject(target)) {
        throw 'target must be object';
    }
    if (!isString(keyPrefix)) {
        throw 'keyPrefix must be string'
    }
    return Object.entries(target).reduce((mapped, keyValuePair) => {
        let [key, value] = keyValuePair;
        mapped[key.startsWith(keyPrefix) ? key.slice(keyPrefix.length) : key] = value;
        return mapped;
    }, {});
}

export function filterObjectKeyPrefix(target, keyPrefix) {
    if (!isObject(target)) {
        throw 'target must be object';
    }
    if (!isString(keyPrefix)) {
        throw 'keyPrefix must be string'
    }
    return Object.entries(target).reduce((mapped, keyValuePair) => {
        let [key, value] = keyValuePair;
        if (key.startsWith(keyPrefix)) {
            mapped[key] = value;
        }
        return mapped;
    }, {});
}

export function filterAndDeprefixObjectKeys(target, keyPrefix) {
    return deprefixObjectKeys(filterObjectKeyPrefix(target, keyPrefix), keyPrefix);
}

/* DOM OPERATIONS */

export function isNodeDescendant(node, descendant) {
    while (descendant.parentNode) {
        descendant = descendant.parentNode;
        if (descendant === node) {
            return true;
        }
    }

    return false;
}

/* DA INTERFACE */

export function getUsernameFromCookies() {
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
