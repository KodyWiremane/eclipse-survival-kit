'use strict'

import {isNull, isObject, isString} from './utils.js';

export class EskMessageClient
{
    sendMessage(messageName, messagePayload = undefined)
    {
        if (!isString(messageName)) {
            throw new TypeError('Type of messageName must be string');
        }

        return new Promise((resolve, reject) =>
            chrome.runtime.sendMessage(
                {name: messageName, payload: messagePayload},
                response => isNull(response)
                ? resolve()
                : !isObject(response)
                    ? reject(new TypeError('Type of response must be object|null'))
                    : response.hasOwnProperty('payload')
                        ? resolve(response.payload)
                        : response.hasOwnProperty('error')
                            ? reject(new Error(response.error))
                            : reject(new Error('Either payload or error property expected in response'))
            )
        );
    }
}
