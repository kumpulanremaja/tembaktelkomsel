const tselDao = require('../dao/tselDAO');
const config = require('../../config');

const getMagicLink = async (req, res) => {
  try {
    const msisdnFromQuery = req.query;

    let errors = {};

    if (msisdnFromQuery && msisdnFromQuery.msisdn.length < 11) {
      errors.msisdn = 'Invalid number Telephone.';
    }

    if (msisdnFromQuery && msisdnFromQuery.msisdn.charAt(0) !== '0') {
      errors.number = 'Nomor telephone harus diawali dengan 0.';
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json(errors);
      return;
    }

    const finalMsisdn = msisdnFromQuery.msisdn.replace('0', '+62');

    const response = await tselDao.getMagicLink(finalMsisdn);

    if (response && response._id) {
      res.cookie('tsel', response, { maxAge: 900000, httpOnly: true });
    }
    res.json(response);
  } catch (e) {
    res.status(404).json({
      error: 'Parameter salah...',
      example: `${config.BASE_URL}/magic-link?msisdn=0813xx`
    });
  }
};

const loginCode = async (req, res) => {
  const codeSplit = req.url.split('code=');

  const cookies = req.cookies;

  const codeFromBody = codeSplit[1];

  let errors = {};

  if (cookies.tsel === undefined) {
    errors.cookie = 'Cookie tsel not Exist. Please use browser!!';
  }
  if (cookies.tsel && cookies.tsel.phone_number.length < 11) {
    errors.msisdn = 'Invalid number Telephone.';
  }

  if (codeFromBody && codeFromBody.length < 6) {
    errors.code = 'Invalid Magic Link Code.';
  }
  if (Object.keys(errors).length > 0) {
    res.status(400).json(errors);
    return;
  }
  try {
    const { phone_number } = cookies.tsel;

    const response = await tselDao.getJwtToken(phone_number, codeFromBody);
    if (response.Authorization !== undefined) {
      await res.cookie('auth', response, { maxAge: 900000, httpOnly: true });
      const offers = await tselDao.getRoute(
        response.Authorization,
        'user/offers/'
      );
      return res.json(offers);

      //return;
    }

    res.json(response);
  } catch (e) {
    res.status(404).json({
      error: 'Invalid Parameter!!. msisdn , code is required' + req.url,

      example: `${config.BASE_URL}/app/login?code=OkasnaGTAsasabsasgas0999NsYg`
    });
  }
};
const apiOffersV3 = async (req, res) => {
  if (req.cookies.auth !== undefined) {
    const { Authorization } = req.cookies.auth;
    const response = await tselDao.getRoute(
      Authorization,
      `offers/filtered-offers/v2`,
      `${req._parsedUrl.search ? req._parsedUrl.search : false}`
    );

    res.send({ headers: response.headers, body: response.body });

    return;
  }
  res.json({
    error: 'Please Loged in',
    route: {
      requestMagicLink: `${config.BASE_URL}/magic-link?msisdn=08128xxxx`,
      appLogin: `${config.BASE_URL}/app/login?code=9BnahanabGssdsdsdsbTRafasxx`
    }
  });
};
const buyFunction = async (filteredBy, offerid, auth) => {
  const response = await tselDao.getRoute(
    auth,
    `offers/filtered-offers/v2?filteredby=${filteredBy}&html=true`,
    null
  );
  if (response.headers) {
    const { signtrans, authorization } = response.headers;

    try {
      const response = await tselDao.buyPackage(
        signtrans,
        authorization,
        offerid
      );
      return response;
    } catch (e) {
      return false;
    }
  }
  return false;

  //return;
};
const buy = async (req, res) => {
  try {
    const { Authorization } = req.cookies.auth;

    const offerid = req.query.offerid;
    if (offerid === undefined) {
      res.json({ error: 'Invalid Parameter offerid!!' });
      return;
    }

    let response = await buyFunction('featured', offerid, Authorization);

    if (response.message === 'Bad Request') {
      response = await buyFunction('boid|ML2_BP_11', offerid, Authorization);
      if (response.message === 'Bad Request') {
        response = await buyFunction('boid|ML2_BP_14', offerid, Authorization);
        if (response.message === 'Bad Request') {
          response = await buyFunction(
            'boid|ML2_BP_15',
            offerid,
            Authorization
          );
        }
      }
    }
    res.json(response);
  } catch (error) {
    res.send({
      error: 'Please Loged In!! ',
      link: {
        'magic-link': `${config.BASE_URL}/magic-link?msisdn=08136xxx`,
        'app-login': `${config.BASE_URL}/app/login?code=XhsjsbTysfxxx`
      }
    });
  }
};
module.exports = {
  getMagicLink,
  loginCode,
  apiOffersV3,
  buy
};
