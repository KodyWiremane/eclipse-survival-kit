/* A wrapper class for PrefixedStorage using promises instead of callbacks */

import {PrefixedStorage} from './prefixed-storage.mjs';

export class PromisedStorage
{
    constructor(keyPrefix = '', storageAreaName = 'local')
    {
        this.storage = new PrefixedStorage(keyPrefix, storageAreaName);
        this.onChanged = this.storage.onChanged;
    }

    get(query = null)
    {
        if (isFunction(query)) {
            throw new TypeError('PromisedStorage does not accept callbacks');
        }

        return new Promise((resolve, reject) =>
            this.storage.get(
                query,
                items => !this.storage.lastError
                ? resolve(items)
                : reject(new StorageError(this.storage.lastError))
            )
        );
    }

    set(request)
    {
        return new Promise((resolve, reject) =>
            this.storage.set(
                request,
                () => !this.storage.lastError
                ? resolve()
                : reject(new StorageError(this.storage.lastError))
            )
        );
    }

    remove(request)
    {
        return new Promise((resolve, reject) =>
            this.storage.remove(
                request,
                () => !this.storage.lastError
                ? resolve()
                : reject(new StorageError(this.storage.lastError))
            )
        );
    }

    clear()
    {
        return new Promise((resolve, reject) =>
            this.storage.clear(
                () => !this.storage.lastError
                ? resolve()
                : reject(new StorageError(this.storage.lastError))
            )
        )
    }
}

export class StorageError extends EskChainedError
{
    constructor(previousError, message = undefined, fileName = undefined, lineNumber = undefined)
    {
        super(
            previousError,
            message || previousError.message,
            fileName,
            lineNumber
        );
    }
}
