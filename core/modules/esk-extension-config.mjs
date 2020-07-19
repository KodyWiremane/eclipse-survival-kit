/* A wrapper class for PromisedStorage to access ESK config values (with default prefix) */

import {PromisedStorage} from './promised-storage.mjs';

export class EskExtensionConfig extends PromisedStorage
{
    constructor(keyPrefix = 'config.', storageAreaName = 'local')
    {
        super(keyPrefix, storageAreaName);
    }
}
