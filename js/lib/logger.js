'use strict';

export class Logger {
    constructor(scopeName)
    {
        this.scopeName = `[${scopeName}]`;
    }

    logWithLevel(levelName, message, ...extras)
    {
        const levelTag = levelName === 'NORMAL' ? '' : `:${levelName}`;
        console.log(`${this.scopeName}${levelTag}: ${message}`, ...extras);
    }

    debug(message, ...extras)
    {
        this.logWithLevel('DEBUG', message, ...extras);
    }

    info(message, ...extras)
    {
        this.logWithLevel('INFO', message, ...extras);
    }

    log(message, ...extras)
    {
        this.logWithLevel('NORMAL', message, ...extras);
    }

    warning(message, ...extras)
    {
        this.logWithLevel('WARNING', message, ...extras);
    }

    error(message, ...extras)
    {
        this.logWithLevel('ERROR', message, ...extras);
    }
}
