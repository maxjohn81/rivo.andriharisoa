const nodemailer = require('nodemailer');

const OWNER_EMAIL = 'maxandriharisoa@gmail.com';
const MAX_NAME_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 5000;
const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const rateLimits = new Map();

function respond(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, function (character) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[character];
  });
}

module.exports = async function contact(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return respond(res, 405, { message: 'M\u00e9thode non autoris\u00e9e.' });
  }

  const origin = req.headers.origin;
  const requestHost = req.headers.host;
  if (origin && requestHost) {
    try {
      if (new URL(origin).host !== requestHost) {
        return respond(res, 403, { message: 'Origine de la requ\u00eate refus\u00e9e.' });
      }
    } catch (error) {
      return respond(res, 403, { message: 'Origine de la requ\u00eate invalide.' });
    }
  }

  let data = req.body;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (error) {
      return respond(res, 400, { message: 'Le formulaire est invalide.' });
    }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return respond(res, 400, { message: 'Le formulaire est invalide.' });
  }

  if (typeof data.website === 'string' && data.website.trim()) {
    return respond(res, 200, { message: 'Ton message a bien \u00e9t\u00e9 envoy\u00e9.' });
  }

  const forwardedFor = req.headers['x-forwarded-for'];
  const clientIp = typeof forwardedFor === 'string'
    ? forwardedFor.split(',').pop().trim()
    : 'unknown';
  const now = Date.now();
  const clientLimit = rateLimits.get(clientIp);
  if (clientLimit && clientLimit.expiresAt > now && clientLimit.count >= 5) {
    return respond(res, 429, {
      message: 'Trop de messages ont été envoyés depuis cette connexion. Réessaie dans quelques minutes.'
    });
  }
  if (!clientLimit || clientLimit.expiresAt <= now) {
    rateLimits.set(clientIp, { count: 1, expiresAt: now + 15 * 60 * 1000 });
  } else {
    clientLimit.count += 1;
  }
  if (rateLimits.size > 1000) {
    for (const [ip, limit] of rateLimits) {
      if (limit.expiresAt <= now) rateLimits.delete(ip);
    }
  }

  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  const message = typeof data.message === 'string' ? data.message.trim() : '';
  if (
    !name ||
    name.length > MAX_NAME_LENGTH ||
    /[\r\n\u0000-\u001f\u007f]/.test(name) ||
    !EMAIL_PATTERN.test(email) ||
    email.length > 254 ||
    !message ||
    message.length > MAX_MESSAGE_LENGTH
  ) {
    return respond(res, 400, {
      message: 'V\u00e9rifie les champs : nom, adresse e-mail et message (5000 caract\u00e8res maximum).'
    });
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  if (!smtpHost || !smtpUser || !smtpPass || !Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
    console.error('Contact SMTP configuration is incomplete.');
    return respond(res, 503, {
      message: 'Le formulaire est momentan\u00e9ment indisponible. R\u00e9essaie plus tard.'
    });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: process.env.SMTP_SECURE === 'true' || smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass.replace(/\s/g, '')
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });

  const sender = { name: 'Rivo Andriharisoa', address: smtpUser };
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\r?\n/g, '<br>');

  try {
    await transporter.sendMail({
      from: sender,
      to: OWNER_EMAIL,
      replyTo: { name, address: email },
      subject: 'Nouveau message depuis le portfolio',
      text: 'Nom : ' + name + '\nE-mail : ' + email + '\n\nMessage :\n' + message,
      html: '<h2>Nouveau message depuis le portfolio</h2><p><strong>Nom :</strong> ' + safeName + '</p><p><strong>E-mail :</strong> ' + safeEmail + '</p><p><strong>Message :</strong><br>' + safeMessage + '</p>'
    });
  } catch (error) {
    console.error('Contact notification email failed:', error.code || 'SMTP_ERROR');
    transporter.close();
    return respond(res, 502, {
      message: 'Ton message n\u2019a pas pu \u00eatre envoy\u00e9. R\u00e9essaie dans quelques instants.'
    });
  }

  try {
    await transporter.sendMail({
      from: sender,
      to: email,
      subject: 'Nous avons bien re\u00e7u ton message',
      text: 'Bonjour ' + name + ',\n\nTon message a bien \u00e9t\u00e9 re\u00e7u. Rivo te r\u00e9pondra d\u00e8s que possible.\n\n\u00c0 bient\u00f4t,\nRivo Andriharisoa',
      html: '<p>Bonjour ' + safeName + ',</p><p>Ton message a bien \u00e9t\u00e9 re\u00e7u. Rivo te r\u00e9pondra d\u00e8s que possible.</p><p>\u00c0 bient\u00f4t,<br>Rivo Andriharisoa</p>'
    });
    transporter.close();
    return respond(res, 200, {
      message: 'Ton message a bien \u00e9t\u00e9 envoy\u00e9. Un e-mail de confirmation vient de t\u2019\u00eatre envoy\u00e9.'
    });
  } catch (error) {
    console.error('Contact confirmation email failed:', error.code || 'SMTP_ERROR');
    transporter.close();
    return respond(res, 200, {
      message: 'Ton message a bien \u00e9t\u00e9 re\u00e7u. L\u2019e-mail de confirmation n\u2019a pas pu \u00eatre envoy\u00e9.'
    });
  }
};
