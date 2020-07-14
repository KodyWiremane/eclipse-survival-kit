// Defines basic classes for ESK-scoped errors

class EskError extends Error
{
    constructor(message = undefined, fileName = undefined, lineNumber = undefined)
    {
        super(message, fileName, lineNumber);
    }
}

class EskChainedError extends EskError
{
    constructor(previousError, message = undefined, fileName = undefined, lineNumber = undefined)
    {
        if (!previousError instanceof Error) {
            throw new TypeError('Expected instance of Error as previousError');
        }
        super(message, fileName, lineNumber);
        this.previousError = previousError;
    }
}

class EskAggregateError extends EskError
{
    constructor(errors, message = undefined)
    {
        if (!isArray(errors) || errors.some(element => (!element instanceof Error))) {
            throw new TypeError('Expected array of Error instances as errors');
        }
        if (!isString(message) && !isUndefined(message))
        {
            throw new TypeError('Type of message must be string|undefined');
        }
        super(message);
        this.errors = errors;
    }
}
