'use strict';

const configKeyPrefix = 'config.';
const configStorageAreaName = 'local';
const configStorage = chrome.storage[configStorageAreaName];

class Config
{
    constructor () {
        var listeners = [];
        this.lastError = undefined;

        this.onChanged = Object.freeze({
            addListener: (listener) => (listeners.push(listener), this),
            removeListener: (listener) => (
                this.listeners = listeners.filter((registered) => registered !== listener), this
            ),
            hasListener: (listener) => listeners.includes(listener)
        });

        configStorage.onChanged.addListener((changes, changedAreaName) => {
            if (changedAreaName !== configStorageAreaName) {
                return;
            }
            const configChanges = Object.freeze(deprefixObjectKeys(cnahges, configKeyPrefix));
            if (configChanges.keys().length === 0) {
                return;
            }
            listeners.forEach((listener) => listener(configChanges));
        });
    }

    get (query, callback) {
        const nullQuery = isNull(query);

        switch (phpType(query)) {
            case 'null':
                break;
            case 'string':
                query = [query];
                // fall through to prefix a single key
            case 'array':
                query = prefixArrayValues(query, configKeyPrefix);
                break;
            case 'object':
                query = prefixObjectKeys(query, configKeyPrefix);
                break;
            default:
                throw 'query must be string|array|null';
        }

        if (!isFunction(callback)) {
            throw 'callback must be function'
        }

        configStorage.get(
            query,
            (response) => (
                this.lastError = chrome.runtime.lastError,
                callback(
                    nullQuery
                    ? filterAndDeprefixObjectKeys(response, configKeyPrefix)
                    : deprefixObjectKeys(response, configKeyPrefix)
                )
            )
        )
    }

    set (request, callback) {
        if (!isObject(request)) {
            throw 'request must be object';
        }

        const noCallback = isUndefined(callback);
        if (!noCallback && !isFunction(callback)) {
            throw 'callback must be function|undefined'
        }

        configStorage.set(
            prefixObjectKeys(request, configKeyPrefix),
            () => (this.lastError = chrome.runtime.lastError, noCallback || callback())
        );
    }

    remove (request, callback) {
        switch (phpType(request)) {
            case 'string':
                request = [request];
                // fall through to prefix a single key
            case 'array':
                request = prefixArrayValues(request, configKeyPrefix);
                break;
            default:
                throw 'request must be string|array'
        }

        const noCallback = isUndefined(callback);
        if (!noCallback && !isFunction(callback)) {
            throw 'callback must be function|undefined'
        }

        configStorage.remove(
            request,
            () => (this.lastError = chrome.runtime.lastError, noCallback || callback())
        )
    }

    clear (callback) {
        const noCallback = isUndefined(callback);
        if (!noCallback && !isFunction(callback)) {
            throw 'callback must be function|undefined'
        }

        configStorage.get(
            null,
            all => configStorage.remove(
                Object.keys(all).filter(key => key.startsWith(configKeyPrefix)),
                () => (this.lastError = chrome.runtime.lastError, noCallback || callback())
            )
        );
    }
}
