/* A wrapper class for PromisedStorage to access DAPI config values (with default prefix) */

// dapi.
//   id2name{uniqueid} = username
//   name2id{username} = uniqueid
//   oauth2ids{uniqueid} = {app_name, app_id, client_id, client_secret}
//   oauth2reqs{uniqueid}{state} = {client_id, scope}
//   id2token{uniqueid} = {access_token, timestamp, expires_in, refresh_token}

import {PromisedStorage} from './promised-storage.mjs';

export class DapiConfig extends PromisedStorage
{
    constructor(keyPrefix = 'dapi.', storageAreaName = 'local')
    {
        super(keyPrefix, storageAreaName);
    }
}
