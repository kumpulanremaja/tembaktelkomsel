const request = require('request-promise');
const moment = require('moment');
const config = require('../../config');

const md5 = require('md5');
const sha256 = require('js-sha256');

function buildHeader(bearer, hash = null, transactionId, signtrans = null) {
  const header = {
    Accept: 'application/json',
    TRANSACTIONID: transactionId,
    CHANNELID: config.CHANNELID,
    'MYTELKOMSEL-MOBILE-APP-VERSION': config.APP_VERSION,
    'X-REQUESTED-WITH': 'com.telkomsel.mytelkomsel',
    Authorization: bearer,
    HASH: hash,
    SIGNTRANS: signtrans
  };

  return header;
}

const getRoute = async (token, route, query = false) => {
  const tId = 'A3011' + moment().format('YYMMDDHHmmssSSS') + '0000000';
  const hash = `${tId}${route}4.5.0t5elas914adlad00131415`;
  const options = {
    uri: `${config.API}/api/${route}${query ? query : ''}`,
    method: 'GET',
    headers: buildHeader(token, sha256(hash), tId),
    json: true,
    resolveWithFullResponse: true
  };

  try {
    const response = await request(options);
    return response;
  } catch (e) {
    return e;
  }
};
const getMagicLink = async msisdn => {
  const options = {
    uri: `${config.AUTH}/passwordless/start`,
    form: {
      client_id: config.CLIENT_ID,
      phone_number: msisdn,
      connection: 'sms'
    },
    headers: {
      Accept: 'application/json',
      'auth0-client': config.AUTH_CLIENT,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    json: true
  };
  try {
    return await request(options);
  } catch (e) {
    return { error: 'Unknown Error' };
  }
};
const getPasscode = async (msisdn, code) => {
  const buildMsisdn = msisdn.replace('+', '');
  const options = {
    uri: `${config.API}/api/auth/passcode/${buildMsisdn}`,
    method: 'POST',
    form: {
      linkcode: code
    },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
  try {
    return await request(options);
  } catch (e) {
    return false;
  }
};
const getApiUser = async (msisdn, token) => {
  const newMsisdn = msisdn.replace('+', '');
  let data = {
    msisdn: newMsisdn,
    fingerPrint: md5(newMsisdn)
  };
  const tId = 'A3011' + moment().format('YYMMDDHHmmssSSS') + '0000000';
  const hash = `${tId}user/4.5.0t5elas914adlad00131415`;

  const options = {
    uri: `${config.API}/api/user/`,
    method: 'PUT',
    headers: buildHeader('Bearer ' + token, sha256(hash), tId),
    body: data,
    json: true,
    resolveWithFullResponse: true
  };

  try {
    const { headers } = await request(options);
    // return await getFilteredOffersV3(headers.authorization, sha256(hash), tId);
    return buildHeader(headers.authorization, sha256(hash), tId);
  } catch (e) {
    return e;
  }
};
const getJwtToken = async (msisdn, code) => {
  try {
    const newCode = await getPasscode(msisdn, code);

    if (!newCode) {
      return { error: 'Code invalid' };
    }

    const options = {
      uri: `${config.AUTH}/oauth/ro`,
      form: {
        scope: 'openid offline_access',
        response_type: 'token',
        sso: 'false',
        device:
          md5(msisdn) +
          ':Mozilla/5.0 (Linux; Android 10; Android SDK built for x86 Build/QPP4.190502.018; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.149 Mobile Safari/537.36',
        connection: 'sms',
        username: msisdn,
        password: newCode,
        client_id: config.CLIENT_ID,
        grant_type: 'password'
      },
      headers: {
        Accept: 'application/json',
        'auth0-client': config.AUTH_CLIENT,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      json: true
    };
    try {
      const token = await request(options);
      //return await getFilteredOffersV3(token.id_token);

      return await getApiUser(msisdn, token.id_token);
    } catch (e) {
      return { ...e.error };
    }
  } catch (e) {
    return { error: 'ER' };
  }
};
const buyPackage = async (signtrans, token, offerid) => {
  //const newMsisdn = msisdn.replace('+', '');
  let data = { toBeSubscribedTo: false, paymentMethod: 'AIRTIME' };
  const tId = 'A3011' + moment().format('YYMMDDHHmmssSSS') + '0000000';
  const hash = `${tId}offers/v2/${offerid}4.5.0t5elas914adlad00131415`;

  const options = {
    uri: `${config.API}/api/offers/v2/${offerid}`,
    method: 'PUT',
    headers: buildHeader(token, sha256(hash), tId, signtrans),
    body: data,
    json: true,
    resolveWithFullResponse: false
  };

  try {
    return await request(options);
    // const { headers } = await request(options);
    // return await getFilteredOffersV3(headers.authorization, sha256(hash), tId);
    //return buildHeader(headers.authorization, sha256(hash), tId);
  } catch (e) {
    return e.error;
  }
};
module.exports = {
  getMagicLink,
  getJwtToken,
  getRoute,
  buyPackage
};
