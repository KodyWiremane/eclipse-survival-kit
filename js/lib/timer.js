'use strict';

class Timer
{
    constructor(timeout, callback, ...callbackArguments)
    {
        if (!Number.isInteger(timeout)) {
            throw 'timeout must be integer';
        }
        if (typeof callback !== 'function') {
            throw 'callback must be function';
        }

        this.timeout = timeout;
        this.callback = callback;
        this.callbackArguments = callbackArguments;
        this.timer = undefined;
    }

    launch()
    {
        this.cancel();
        this.timer = setTimeout(this.callback, this.timeout, ...this.callbackArguments);
    }

    cancel()
    {
        if (this.timer !== undefined) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    }

    reset()
    {
        this.launch();
    }

    fire()
    {
        this.cancel();
        this.callback(...this.callbackArguments);
    }
}
