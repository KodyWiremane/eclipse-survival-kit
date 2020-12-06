'use strict';

import {Logger} from './logger.mjs';

export class NativeLogger extends Logger {
    logWithLevel(levelName, message, ...extras)
    {
        const method = {
            DEBUG: 'debug',
            INFO: 'info',
            NORMAL: 'log',
            WARNING: 'warn',
            ERROR: 'error'
        }[levelName];
        const levelTag = levelName === 'DEBUG' || levelName === 'INFO' ? `:${levelName}` : '';
        console[method](`${this.scopeName}${levelTag}: ${message}`, ...extras);
    }
}
