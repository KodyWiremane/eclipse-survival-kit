/* Gear to access data in DA userinfo cookie */

async function getUserInfo() {
    const raw = await getUserInfoCookie();
    return getUserInfoFromRaw(raw);
}

function getUserInfoCookie() {
    return new Promise((resolve, reject) => {
        chrome.cookies.get(
            {url: 'https://deviantart.com', name: 'userinfo'},
            cookie => cookie !== null
            ? resolve(cookie.value)
            : reject(new EskUserinfoNoCookieError('Missing userinfo cookie')));
    });
}

function getUserInfoFromRaw(raw) {
    const decoded = decodeURIComponent(raw);

    const splitPoint = decoded.indexOf(';');
    if (splitPoint === -1) {
        throw new EskError('Missing userinfo cookie separator');
    }

    const json = decoded.slice(splitPoint + 1);
    if (json === '') {
        throw new EskError('Missing userinfo cookie data part');
    }

    try {
        return JSON.parse(json);
    } catch (e) {
        if (e instanceof SyntaxError) {
            throw new EskChainedError(e, `Failed parsing userinfo cookie data part: ${e.message}`);
        } else {
            throw e;
        }
    }
}

export class UserInfo
{
    constructor(userinfo)
    {
        this.userinfo = userinfo;
    }

    getUserName()
    {
        return this.userinfo['username'];
    }

    getUniqueId()
    {
        return this.userinfo['uniqueid'];
    }

    static async get()
    {
        try {
            const userinfo = await getUserInfo();
            return new this(userinfo);
        } catch (e) {
            if (e instanceof EskUserinfoNoCookieError) {
                return null;
            } else {
                throw e;
            }
        }
    }
}

class EskUserinfoNoCookieError extends EskError {}
