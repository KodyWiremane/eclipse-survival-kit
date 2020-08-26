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

    async getUserStatus(knownUserInfo = undefined, configSnapshot = undefined)
    {
        const userInfo = knownUserInfo || await UserInfo.get();

        if (!userInfo || !userInfo.getUserName()) {
            return Dapi.STATUS_ANONYMOUS;
        }

        const sessionUserName = userInfo.getUserName();
        const sessionUniqueId = userInfo.getUniqueId();

        const config = configSnapshot || await this.config.get(null);

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
        if (oauth2reqs && Object.keys((id2token || {})[sessionUniqueId] || {}).length) {
            return Dapi.STATUS_UNAUTHORIZED;
        }

        const oauth2ids = config['oauth2ids'];
        if (oauth2ids && oauth2ids[sessionUniqueId]) {
            return Dapi.STATUS_BOUND;
        }

        return Dapi.STATUS_UNBOUND;
    }

    async bindToApp(appName, appId, clientId, clientSecret)
    {
        const userInfo = await UserInfo.get();
        const config = await this.config.get(null);

        var status = await this.getUserStatus(userInfo, config);
        if (status === Dapi.STATUS_ANONYMOUS) {
            throw new EskDapiNoIdentityError();
        }
        if (status === Dapi.STATUS_AMBIGUOUS) {
            throw new EskDapiAmbiguousIdentityError();
        }
        if (status !== Dapi.STATUS_UNBOUND) {
            throw new Error('ESK is already bound, and auto-unbinding not implemented');
        }

        const sessionUserName = userInfo.getUserName();
        const sessionUniqueId = userInfo.getUniqueId();

        var id2name = config['id2name'] || {};
        var name2id = config['name2id'] || {};

        id2name[sessionUniqueId] = sessionUserName;
        name2id[sessionUserName] = sessionUniqueId;

        var oauth2ids = config['oauth2ids'] || {};
        oauth2ids[sessionUniqueId] = {
            'appName': appName,
            'appId': appId,
            'clientId': clientId,
            'clientSecret': clientSecret
        };

        await this.config.set({'id2name': id2name, 'name2id': name2id, 'oauth2ids': oauth2ids});
    }

    async unbind()
    {
        const userInfo = await UserInfo.get();
        const config = await this.config.get(null);

        var status = await this.getUserStatus(userInfo, config);
        if (status === Dapi.STATUS_ANONYMOUS) {
            throw new EskDapiNoIdentityError();
        }
        if (status === Dapi.STATUS_AMBIGUOUS) {
            throw new EskDapiAmbiguousIdentityError();
        }
        if (status === Dapi.STATUS_UNBOUND) {
            throw new Error('ESK is already unbound');
        }
        if (status !== Dapi.STATUS_BOUND) {
            throw new Error('ESK has been authorized (or tried), and auto-deauthorizing not implemented');
        }

        var oauth2ids = config['oauth2ids'];
        delete oauth2ids[userInfo.getUniqueId()];

        await this.config.set({'oauth2ids': oauth2ids});
    }

    async getBoundAppData(knownUniqueId = undefined)
    {
        const oauth2ids = (await this.config.get('oauth2ids'))['oauth2ids'] || {};
        const uniqueId = knownUniqueId || (await UserInfo.get()).getUniqueId();
        return oauth2ids[uniqueId] || null;
    }

    getBindingUri()
    {
        return 'https://www.deviantart.com/developers/apps';
    }

    getRedirectUri()
    {
        //return chrome.identity.getRedirectURL('/ESK/');
        return chrome.runtime.getURL('core/authorize.html');
    }

    getEditUriForAppId(appId)
    {
        return `https://www.deviantart.com/submit/?deviationids=${encodeURIComponent(appId)}`;
    }

    async requestAuthorizationUri(uniqueId, scope)
    {
        const ids = await this.getBoundAppData(uniqueId);
        const clientId = ids.clientId;

        const requestUrl = await this.prepareWebAuthFlowUrl(uniqueId, clientId, scope);

        return requestUrl;
    }

    async launchWebAuthFlow(uniqueId, scope)
    {
        const ids = await this.getBoundAppData(uniqueId);
        const clientId = ids.clientId;
        const clientSecret = ids.clientSecret;

        const requestUrl = await this.prepareWebAuthFlowUrl(uniqueId, clientId, scope);
        return await this.launchWebAuthFlowInternal(requestUrl, clientId, clientSecret);
    }

    async processAuthorizationRedirectUri(responseUrl) {
        const blob = new URL(responseUrl);
        const state = blob.searchParams.get('state');
        const code = blob.searchParams.get('code');
        if (state === null || code === null) {
            throw new DapiError('Incomplete redirect url');
        }

        const uniqueId = (await UserInfo.get()).getUniqueId();

        let {oauth2reqs} = await this.config.get('oauth2reqs');
        let reqs = oauth2reqs[uniqueId];
        if (!reqs[state]) {
            throw new EskError(`OAuth2 state [${state}] not exists`);
        }

        const ids = await this.getBoundAppData(uniqueId);
        // FIXME! must make sure clientId and clientSecret are consistent with the request... later
        const clientId = ids.clientId;
        const clientSecret = ids.clientSecret;

        let redirectUrl = encodeURIComponent(this.getRedirectUri());
        let tokenUrl = `https://www.deviantart.com/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=authorization_code&code=${code}&redirect_uri=${redirectUrl}`;

        const tokenResponse = await fetch(tokenUrl, {redirect: 'follow'});
        const responseTimestamp = Date.now();
        if (!tokenResponse.ok) {
            throw new SomethingBadWithTokenError('Token request failed');
        }

        const parsedTokenResponse = await tokenResponse.json();
        if (parsedTokenResponse.error) {
            throw new SomethingBadWithTokenError(`Token retrieval error: ${parsedTokenResponse.error_description}`);
        }
        if (parsedTokenResponse.status !== 'success') {
            throw new SomethingBadWithTokenError('Token response is not successful');
        }
        if (parsedTokenResponse.token_type !== 'Bearer') {
            throw new SomethingBadWithTokenError(`Unsupported token type ${parsedTokenResponse.token_type}`);
        }

        const tokenData = {timestamp: responseTimestamp};
        ['access_token', 'scope', 'expires_in', 'refresh_token'].forEach(
            key => {tokenData[key] = parsedTokenResponse[key]}
        );

        reqs = {};
        oauth2reqs[uniqueId] = reqs;

        let {id2token = {}} = await this.config.get('id2token');
        id2token[uniqueId] = tokenData;

        await this.config.set({'id2token': id2token, 'oauth2reqs': oauth2reqs});
    }

    async prepareWebAuthFlowUrl(uniqueId, clientId, scope)
    {
        const clientIdString = encodeURIComponent(clientId);
        const redirectUrlString = encodeURIComponent(this.getRedirectUri());
        const scopeString = encodeURIComponent(scope.join(' '));
        const timestamp = Date.now();
        const seed = btoa(Array.from(window.crypto.getRandomValues(new Uint8Array(32))).map(i => String.fromCharCode(i)).join(''));
        const state = `${timestamp}-${seed}`;
        const stateString = encodeURIComponent(state);
        const requestUrl =  `https://www.deviantart.com/oauth2/authorize?response_type=code&client_id=${clientIdString}&redirect_uri=${redirectUrlString}&scope=${scopeString}&state=${stateString}&view=login`;

        let {oauth2reqs = {}} = await this.config.get(null);
        let storedRequests = oauth2reqs[uniqueId] || {};
        storedRequests[state] = {'clientId': clientId, 'scope': scope};
        oauth2reqs[uniqueId] = storedRequests;
        await this.config.set({'oauth2reqs': oauth2reqs});

        return requestUrl;
    }

    async getTokenBlob(uniqueId)
    {
        let {id2token = {}} = await this.config.get();

        let tokenData = id2token[uniqueId];
        if (!tokenData) {
            return null;
        }

        return tokenData;
    }

    async fetch(resource, init)
    {
        const uniqueId = (await UserInfo.get()).getUniqueId();

        return new Promise((resolve, reject) => {
            this.fetchWithAuth(uniqueId, resource, init)
            .then(response => {
                if (response.status !== 401) {
                    resolve(response)
                } else {
                    this.refreshToken(uniqueId)
                    .then(() => {
                        this.fetchWithAuth(uniqueId, resource, init)
                        .then(response => {
                            if (response.status !== 401) {
                                resolve(response);
                            } else {
                                throw new DapiError('Cannot refresh auth token');
                            }
                        })
                        .catch(error => reject(error));
                    });
                }
            })
            .catch(error => reject(error));
        });
    }

    async fetchWithAuth(uniqueId, resource, init)
    {
        const tokenData = await this.getTokenBlob(uniqueId);
        if (!tokenData) {
            throw new DapiError('Cannot retrieve auth token');
        }

        const accessToken = tokenData['access_token'];

        const url = new URL(typeof resource === 'string' ? resource : resource.url);
        url.searchParams.append('access_token', accessToken);

        const request = new Request(url, typeof resource === 'object' ? resource : undefined);
        return fetch(request, init);
    }

    async refreshToken(uniqueId)
    {
        const tokenData = await this.getTokenBlob(uniqueId);
        if (!tokenData) {
            throw new DapiError('Cannot retrieve auth token');
        }

        const refreshToken = tokenData['refresh_token'];

        const ids = await this.getBoundAppData(uniqueId);
        // FIXME! must make sure clientId and clientSecret are consistent with the request... later
        const clientId = ids.clientId;
        const clientSecret = ids.clientSecret;

        const url = new URL ('https://www.deviantart.com/oauth2/token');
        const sp = url.searchParams;
        sp.append('grant_type', 'refresh_token');
        sp.append('client_id', clientId);
        sp.append('client_secret', clientSecret);
        sp.append('refresh_token', refreshToken);

        return new Promise((resolve, reject) => {
            fetch(url)
            .then(async tokenResponse => {
                const responseTimestamp = Date.now();
                const parsedTokenResponse = await tokenResponse.json();
                if (parsedTokenResponse.error) {
                    throw new SomethingBadWithTokenError(`Token retrieval error: ${parsedTokenResponse.error_description}`);
                }
                if (parsedTokenResponse.status !== 'success') {
                    throw new SomethingBadWithTokenError('Token response is not successful');
                }
                if (parsedTokenResponse.token_type !== 'Bearer') {
                    throw new SomethingBadWithTokenError(`Unsupported token type ${parsedTokenResponse.token_type}`);
                }

                const newTokenData = {timestamp: responseTimestamp};
                ['access_token', 'scope', 'expires_in', 'refresh_token'].forEach(
                    key => {newTokenData[key] = parsedTokenResponse[key]}
                );

                let {id2token = {}} = await this.config.get('id2token');
                id2token[uniqueId] = newTokenData;

                await this.config.set({'id2token': id2token});
                resolve();
            })
            .catch(error => reject(error));
        })
    }

    async deauthorize()
    {
        const uniqueId = (await UserInfo.get()).getUniqueId();
        let {id2token = {}} = await this.config.get();

        let tokenData = id2token[uniqueId];
        if (!tokenData) {
            return;
        }

        let data = new FormData();
        data.append('revoke_refresh_only', 'true');
        data.append('token', tokenData['refreshToken']);
        const revokeUrl = `https://www.deviantart.com/oauth2/revoke`;
        fetch(revokeUrl, {method: 'POST', body: data, redirect: 'follow'})
        .then(() => {
            delete id2token[uniqueId];
            return this.config.set({'id2token': id2token});
        });
    }
}

export class DapiError extends EskError {}

export class EskDapiBadIdentity extends DapiError {}

export class EskDapiNoIdentityError extends EskDapiBadIdentity
{
    constructor(message = undefined, fileName = undefined, lineNumber = undefined)
    {
        super(message || 'Missing user identity (anonymous user)', fileName, lineNumber);
    }
}

export class EskDapiAmbiguousIdentityError extends EskDapiBadIdentity
{
    constructor(message = undefined, fileName = undefined, lineNumber = undefined)
    {
        super(message || 'Ambiguous user identity (name/id mismatch)', fileName, lineNumber);
    }
}

export class SomethingBadWithTokenError extends DapiError {}
