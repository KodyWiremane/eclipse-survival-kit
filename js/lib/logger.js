class Logger {
    constructor (scopeName) {
        this.scopeName = `[${scopeName}]`;
    }

    log (levelName, message, ...extras) {
        console.log(`${this.scopeName}:${levelName}: ${message}`, ...extras);
    }

    debug (message, ...extras) {
        this.log('DEBUG', message, ...extras);
    }

    info (message, ...extras) {
        this.log('INFO', message, ...extras);
    }

    warning (message, ...extras) {
        this.log('WARNING', message, ...extras);
    }

    error (message, ...extras) {
        this.log('ERROR', message, ...extras);
    }
}
