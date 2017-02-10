"use strict";

var Extension = require('expressway').Extension;
var path = require('path');

class AuthExtension extends Extension
{
    /**
     * Constructor.
     * @param app {Application}
     * @param config {Function}
     */
    constructor(app,config)
    {
        super(app);

        app.use([
            require('./middlewares/AuthRequired'),
            require('./middlewares/BasicAuth'),
            require('./middlewares/RedirectIfLoggedIn'),
            require('./controllers/AuthController'),
            require('./providers/GateProvider'),
        ]);

        this.package = require('../package.json');

        this.base           = config('auth.base', "/auth");
        this.successUri     = config('auth.redirect', "/");
        this.loginUri       = this.base + "/login";
        this.forgotUri      = this.base + "/login/reset";
        this.loginView      = "auth/login";
        this.forgotView     = "auth/forgot";
        this.resetView      = "auth/reset";
        this.resetEmailView = "email/reset";

        let routes = require('./config/routes');
        this.routes.middleware(routes.middleware);
        if (config('auth.useRoutes', true)) {
            this.routes.add(routes.paths);
        }
    }

    /**
     * Get the alias for this extension.
     * @returns {string}
     */
    get alias() {
        return 'auth';
    }
}

module.exports = AuthExtension;