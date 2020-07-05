'use strict';

class Config
{
    constructor(configKeyPrefix = 'config.')
    {
        const STORAGE_AREA = 'local';
        this.storage = chrome.storage[STORAGE_AREA];
        this.configKeyPrefix = configKeyPrefix;
        this.lastError = undefined;
        var listeners = [];

        this.onChanged = Object.freeze({
            addListener: (listener) => (listeners.push(listener), this),
            removeListener: (listener) => (
                this.listeners = listeners.filter((registered) => registered !== listener), this
            ),
            hasListener: (listener) => listeners.includes(listener)
        });

        this.storage.onChanged.addListener(changes => {
            const configChanges = Object.freeze(deprefixObjectKeys(changes, this.configKeyPrefix));
            if (Object.keys(configChanges).length === 0) {
                return;
            }
            listeners.forEach((listener) => listener(configChanges));
        });
    }

    get(query, callback)
    {
        const nullQuery = isNull(query);

        switch (phpType(query)) {
            case 'null':
                break;
            case 'string':
                query = [query];
                // fall through to prefix a single key
            case 'array':
                query = prefixArrayValues(query, this.configKeyPrefix);
                break;
            case 'object':
                query = prefixObjectKeys(query, this.configKeyPrefix);
                break;
            default:
                throw 'query must be string|array|null';
        }

        if (!isFunction(callback)) {
            throw 'callback must be function'
        }

        this.storage.get(
            query,
            (response) => (
                this.lastError = chrome.runtime.lastError,
                callback(
                    nullQuery
                    ? filterAndDeprefixObjectKeys(response, this.configKeyPrefix)
                    : deprefixObjectKeys(response, this.configKeyPrefix)
                )
            )
        )
    }

    set(request, callback)
    {
        if (!isObject(request)) {
            throw 'request must be object';
        }

        const noCallback = isUndefined(callback);
        if (!noCallback && !isFunction(callback)) {
            throw 'callback must be function|undefined'
        }

        this.storage.set(
            prefixObjectKeys(request, this.configKeyPrefix),
            () => (this.lastError = chrome.runtime.lastError, noCallback || callback())
        );
    }

    remove(request, callback)
    {
        switch (phpType(request)) {
            case 'string':
                request = [request];
                // fall through to prefix a single key
            case 'array':
                request = prefixArrayValues(request, this.configKeyPrefix);
                break;
            default:
                throw 'request must be string|array'
        }

        const noCallback = isUndefined(callback);
        if (!noCallback && !isFunction(callback)) {
            throw 'callback must be function|undefined'
        }

        this.storage.remove(
            request,
            () => (this.lastError = chrome.runtime.lastError, noCallback || callback())
        )
    }

    clear(callback)
    {
        const noCallback = isUndefined(callback);
        if (!noCallback && !isFunction(callback)) {
            throw 'callback must be function|undefined'
        }

        this.storage.get(
            null,
            all => this.storage.remove(
                Object.keys(all).filter(key => key.startsWith(this.configKeyPrefix)),
                () => (this.lastError = chrome.runtime.lastError, noCallback || callback())
            )
        );
    }
}
