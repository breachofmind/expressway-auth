"use strict";

var Extension = require('expressway').Extension;
var path = require('path');

class AuthExtension extends Extension
{
    constructor(app)
    {
        super(app);

        this.alias = "auth";

        app.use([
            require('./middlewares/AuthRequired'),
            require('./middlewares/BasicAuth'),
            require('./middlewares/RedirectIfLoggedIn'),
            require('./controllers/AuthController'),
            require('./providers/GateProvider'),
        ]);

        this.package = require('../package.json');

        this.base = "/auth";
        this.successUri = "/";
        this.loginUri = this.base + "/login";
        this.forgotUri = this.base + "/login/reset";
        this.loginView = "auth/login";
        this.forgotView = "auth/forgot";
        this.resetView = "auth/reset";
        this.resetEmailView = "email/reset";

        this.middleware = [
            'Init',
            'ConsoleLogging',
            'Localization',
            'BodyParser',
            'Session',
            'CSRF',
            'Flash',
            'BasicAuth',
        ];

        this.routes = {
            'GET  /login'            : 'AuthController.login',
            'GET  /logout'           : 'AuthController.logout',
            'GET  /login/reset'      : 'AuthController.forgot',
            'GET  /login/reset/:hash': 'AuthController.lookup',
            'POST /login'            : 'AuthController.authenticate',
            'POST /login/reset'      : 'AuthController.request_reset',
            'POST /login/reset/:hash': 'AuthController.perform_reset',
        };
    }
}

module.exports = AuthExtension;