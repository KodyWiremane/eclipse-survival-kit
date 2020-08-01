/* An almighty class to work with DA API */

import {UserInfo} from './userinfo.mjs';
import {DapiConfig} from './dapi-config.mjs';


export class Dapi
{
    static get STATUS_AMBIGUOUS() { return -1; }
    static get STATUS_ANONYMOUS() { return 0; }
    static get STATUS_UNBOUND() { return 1; }
    static get STATUS_BOUND() { return 2; }
    static get STATUS_UNAUTHORIZED() { return 3; }
    static get STATUS_AUTHORIZED() { return 4; }

    static statusToString(status)
    {
        switch (status) {
            case Dapi.STATUS_AMBIGUOUS: return 'AMBIGUOUS'; break;
            case Dapi.STATUS_ANONYMOUS: return 'ANONYMOUS'; break;
            case Dapi.STATUS_UNBOUND: return 'UNBOUND'; break;
            case Dapi.STATUS_BOUND: return 'BOUND'; break;
            case Dapi.STATUS_UNAUTHORIZED: return 'UNAUTHORIZED'; break;
            case Dapi.STATUS_AUTHORIZED: return 'AUTHORIZED'; break;
            default:
                throw new EskError('Unknown DAPI auth status');
        }
    }

    constructor()
    {
        this.config = new DapiConfig();
    }

    async getUserStatus()
    {
        const userInfo = await UserInfo.get();

        if (!userInfo || !userInfo.getUserName()) {
            return Dapi.STATUS_ANONYMOUS;
        }

        const sessionUserName = userInfo.getUserName();
        const sessionUniqueId = userInfo.getUniqueId();

        const config = await this.config.get(null);

        const id2name = config['id2name'];
        const name2id = config['name2id'];
        if (
            (id2name && id2name[sessionUniqueId] && id2name[sessionUniqueId] !== sessionUserName)
            || (name2id && name2id[sessionUserName] && name2id[sessionUserName] !== sessionUniqueId)
        ) {
            return Dapi.STATUS_AMBIGUOUS;
        }

        const id2token = config['id2token'];
        if (id2token && id2token[sessionUniqueId]) {
            return Dapi.STATUS_AUTHORIZED
        }

        const oauth2reqs = config['oauth2reqs'];
        if (oauth2reqs && Object.keys(id2token[sessionUniqueId] || {}).length) {
            return Dapi.STATUS_UNAUTHORIZED;
        }

        const oauth2ids = config['oauth2ids'];
        if (oauth2ids && oauth2ids[sessionUniqueId]) {
            return Dapi.STATUS_BOUND;
        }

        return Dapi.STATUS_UNBOUND;
    }
}
