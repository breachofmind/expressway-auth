module.exports = {
    middleware: [
        'Init',
        'ConsoleLogging',
        'Localization',
        'BodyParser',
        'Session',
        'CSRF',
        'Flash',
        'BasicAuth',
    ],
    paths: [
        {
            'GET  /login'            : 'AuthController.login',
            'GET  /logout'           : 'AuthController.logout',
            'GET  /login/reset'      : 'AuthController.forgot',
            'GET  /login/reset/:hash': 'AuthController.lookup',
            'POST /login'            : 'AuthController.authenticate',
            'POST /login/reset'      : 'AuthController.request_reset',
            'POST /login/reset/:hash': 'AuthController.perform_reset',
        }
    ]
}