"use strict";

var crypto   = require('crypto');
var Expressway = require('expressway');

/**
 * Provides basic authentication with passport.
 * @author Mike Adamczyk <mike@bom.us>
 */
class AuthModule extends Expressway.Module
{
    get alias() { return "$auth" }

    /**
     * Constructor
     * @param app Application
     */
    constructor(app)
    {
        super(app);

        this.requires(
            'AppModule',
            'ModelProvider',
            'ControllerProvider',
            'LocaleProvider'
        );

        this.package = require('../../package.json');

        this.baseUri        = "/auth";
        this.successUri     = "/";
        this.loginUri       = this.baseUri + "/login";
        this.forgotUri      = this.baseUri + "/login/reset";
        this.loginView      = "auth/login";
        this.forgotView     = "auth/forgot";
        this.resetView      = "auth/reset";
        this.resetEmailView = "email/reset";
    }


    /**
     * Register with the application.
     * @param app Application
     * @param controllerService ControllerService
     * @param $app Module
     */
    register(app,controllerService,$app)
    {
        this.parent('AppModule');

        controllerService.addDirectory(__dirname+'/../middlewares/');
        controllerService.addDirectory(__dirname+'/../controllers/');

        app.register('encrypt', this.encrypt, "Function for encrypting passwords securely");

        // The app needs the BasicAuth middleware to get the user.
        $app.middleware.push('BasicAuth');

        // Attach the authenticated user to the view for use in templates.
        app.on('view.created', (view,request) => {
            view.use('currentUser', request.user);
        });
    }


    /**
     * Boot after all providers have been loaded.
     * @param modelService ModelService
     */
    boot(modelService)
    {
        if (! modelService.has('User')) {
            throw ('AuthModule: User model is required to use basic Auth functionality');
        }

        // Assign global middleware.
        this.add([
            'Init',
            'ConsoleLogging',
            'Localization',
            'BodyParser',
            'Session',
            'CSRF',
            'Flash',
            'BasicAuth',
        ]);

        // Assign routes.
        this.add({
            'GET  /login'                : 'AuthController.login',
            'GET  /logout'               : 'AuthController.logout',
            'GET  /login/reset'          : 'AuthController.forgot',
            'GET  /login/reset/:hash'    : 'AuthController.lookup',
            'POST /login'                : 'AuthController.authenticate',
            'POST /login/reset'          : 'AuthController.request_reset',
            'POST /login/reset/:hash'    : 'AuthController.perform_reset',
        });

        this.add('NotFound');
    }

    /**
     * Encrypt a password with a salt.
     * @param password string
     * @param salt string
     * @returns {string}
     */
    encrypt(password, salt)
    {
        return crypto.createHmac("md5",salt).update(password).digest('hex');
    };
}

module.exports = AuthModule;