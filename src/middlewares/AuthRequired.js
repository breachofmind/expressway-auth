"use strict";

var Middleware = require('expressway').Middleware;

class AuthRequired extends Middleware
{
    get description() {
        return "If not logged in, redirects to the login page while remembering requested URL";
    }

    method(request,response,next,auth)
    {
        if (request.user) return next();

        // Get the auth page url.
        let referer = request.originalUrl || "";
        let loginUrl = auth.loginUri;
        let url = loginUrl + (referer? "?forward="+encodeURI(referer) : "");

        return response.redirectWithFlash(url, 'message', {
            text: request.lang('auth.err_loginRequired'),
            type: 'alert'
        });
    }
}

module.exports = AuthRequired;