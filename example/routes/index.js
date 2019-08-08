const express = require('express');
const { Client } = require('@endpass/endpass-node');

const router = express.Router();

const ENDPASS_ACCESS_TOKEN = 'endpass-access-token';
const ENDPASS_REFRESH_TOKEN = 'endpass-refresh-token';

const c = new Client({
  clientId: '593f4c87-a819-45e4-9f9a-218f8650de63',
  clientSecret: 'b1a53004-38ad-49f7-875b-1b5629a0a2d9',
  scopes: ['user:email:read', 'user:phone:read'],
  state: '1fae1dbc-2141-4c14-a7da-126123e25154',
  redirectUrl: 'http://localhost:3000/handler',
});

/* eslint-disable-next-line */
router.get('/', async (req, res, next) => {
  const accessToken = req.cookies[ENDPASS_ACCESS_TOKEN];
  const refreshToken = req.cookies[ENDPASS_REFRESH_TOKEN];

  if (!accessToken && !refreshToken) {
    res.render('index', { title: 'Oauth test app' });
    return;
  }

  try {
    const { email } = await c.request({
      origin: req.headers.host,
      path: '/user',
      accessToken,
    });
    const refreshedToken = await c.refresh(refreshToken);

    res.cookie(ENDPASS_ACCESS_TOKEN, refreshedToken.accessToken, {
      httpOnly: true,
    });
    res.cookie(ENDPASS_REFRESH_TOKEN, refreshedToken.refreshToken, {
      httpOnly: true,
    });
    res.render('account', {
      email,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/auth', (req, res) => {
  res.redirect(c.getAuthUrl());
});

router.get('/logout', (req, res) => {
  res.clearCookie(ENDPASS_ACCESS_TOKEN);
  res.clearCookie(ENDPASS_REFRESH_TOKEN);
  res.redirect('/');
});

router.get('/handler', async (req, res, next) => {
  const { code } = req.query;

  try {
    const { accessToken, refreshToken } = await c.exchange(code);

    res.cookie(ENDPASS_ACCESS_TOKEN, accessToken, {
      httpOnly: true,
    });
    res.cookie(ENDPASS_REFRESH_TOKEN, refreshToken, {
      httpOnly: true,
    });
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
