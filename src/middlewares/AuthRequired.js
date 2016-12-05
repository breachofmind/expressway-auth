"use strict";

var Expressway = require('expressway');

class AuthRequired extends Expressway.Middleware
{
    get type() {
        return "AuthModule";
    }

    get description() {
        return "If not logged in, redirects to the login page while remembering requested URL";
    }

    method(request,response,next,$auth)
    {
        if (request.user) return next();

        // Get the auth page url.
        let referer = request.originalUrl || "";
        let loginUrl = $auth.loginUri;
        let url = loginUrl + (referer? "?forward="+encodeURI(referer) : "");

        return response.redirectWithFlash(url, 'message', {
            text: request.lang('auth.err_login_required'),
            type: 'alert'
        });
    }
}

module.exports = AuthRequired;

