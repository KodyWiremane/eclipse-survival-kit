/* A wrapper class for chrome.storage for working with sets of keys sharing a common prefix. */

import {
    deprefixObjectKeys,
    filterAndDeprefixObjectKeys,
    isFunction,
    isNull,
    isObject,
    isString,
    isUndefined,
    phpType,
    prefixArrayValues,
    prefixObjectKeys
} from '../../js/modules/utils.mjs';

export class PrefixedStorage
{
    constructor(keyPrefix = '', storageAreaName = 'local')
    {
        if (!isString(keyPrefix)) {
            throw new TypeError('Type of keyPrefix must be string|undefined');
        }
        if (!isString(storageAreaName)) {
            throw new TypeError('Type of storageAreaName must be string|undefined');
        }

        this.storage = chrome.storage[storageAreaName];
        this.keyPrefix = keyPrefix;
        this.lastError = undefined;
        const listeners = [];

        this.onChanged = Object.freeze({
            addListener: listener => {
                if (!isFunction(listener)) {
                    throw new TypeError('Type of listener must be function');
                }
                listeners.push(listener);
            },
            removeListener: listener => {
                if (!isFunction(listener)) {
                    throw new TypeError('Type of listener must be function');
                }
                this.listeners = listeners.filter(registered => registered !== listener);
            },
            hasListener: listener => {
                if (!isFunction(listener)) {
                    throw new TypeError('Type of listener must be function');
                }
                listeners.includes(listener);
            }
        });

        this.storage.onChanged.addListener(changes => {
            const deprefixedChanges = Object.freeze(deprefixObjectKeys(changes, this.keyPrefix));
            if (Object.keys(deprefixedChanges).length === 0) {
                return;
            }
            listeners.forEach(listener => listener(deprefixedChanges));
        });
    }

    get(query = null, callback)
    {
        if (isFunction(query)) {
            callback = query;
            query = null;
        }
        const nullQuery = isNull(query);

        switch (phpType(query)) {
            case 'null':
                break;
            case 'string':
                query = [query];
                // fall through to prefix a single key
            case 'array':
                query = prefixArrayValues(query, this.keyPrefix);
                break;
            case 'object':
                query = prefixObjectKeys(query, this.keyPrefix);
                break;
            default:
                throw new TypeError('Type of query must be string|array|object|null');
        }

        if (!isFunction(callback)) {
            throw new TypeError('Type of callback must be function');
        }

        this.storage.get(
            query,
            items => (
                this.lastError = chrome.runtime.lastError,
                callback(
                    nullQuery
                    ? filterAndDeprefixObjectKeys(items, this.keyPrefix)
                    : deprefixObjectKeys(items, this.keyPrefix)
                )
            )
        )
    }

    set(request, callback = undefined)
    {
        if (!isObject(request)) {
            throw new TypeError('Type of request must be object');
        }

        const noCallback = isUndefined(callback);
        if (!noCallback && !isFunction(callback)) {
            throw new TypeError('Type of callback must be function|undefined');
        }

        this.storage.set(
            prefixObjectKeys(request, this.keyPrefix),
            () => (this.lastError = chrome.runtime.lastError, noCallback || callback())
        );
    }

    remove(request, callback = undefined)
    {
        switch (phpType(request)) {
            case 'string':
                request = [request];
                // fall through to prefix a single key
            case 'array':
                request = prefixArrayValues(request, this.keyPrefix);
                break;
            default:
                throw new TypeError('Type of request must be string|array');
        }

        const noCallback = isUndefined(callback);
        if (!noCallback && !isFunction(callback)) {
            throw new TypeError('Type of callback must be function|undefined');
        }

        this.storage.remove(
            request,
            () => (this.lastError = chrome.runtime.lastError, noCallback || callback())
        )
    }

    clear(callback = undefined)
    {
        const noCallback = isUndefined(callback);
        if (!noCallback && !isFunction(callback)) {
            throw new TypeError('Type of callback must be function|undefined');
        }

        this.storage.get(
            null,
            all => this.storage.remove(
                Object.keys(all).filter(key => key.startsWith(this.keyPrefix)),
                () => (this.lastError = chrome.runtime.lastError, noCallback || callback())
            )
        );
    }
}
