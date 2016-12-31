"use strict";

var Provider = require('expressway').Provider;
var Policy = require('../Policy');
var passport = require('passport');
var crypto = require('crypto');

class GateProvider extends Provider
{
    constructor(app)
    {
        super(app);

        app.service(encrypt);
        app.service('passport', passport);
        app.service('gate', app.load(require('../services/GateService')));
        app.service('Policy', Policy);
        app.service(currentUser.callable());
    }
}

/**
 * Encrypt a password with a salt.
 * @param password string
 * @param salt string
 * @returns {string}
 */
function encrypt(password, salt)
{
    return crypto.createHmac("md5",salt).update(password).digest('hex');
}

/**
 * Return the current user.
 * @injectable
 * @param request
 * @param response
 * @param next
 * @returns {*|null}
 */
function currentUser(request,response,next)
{
    return request.user;
}

module.exports = GateProvider;