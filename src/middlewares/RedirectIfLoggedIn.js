"use strict";

var Expressway = require('expressway');

class RedirectIfLoggedIn extends Expressway.Middleware
{
    get type() {
        return "AuthModule"
    }

    get description() {
        return "Redirects to AuthController.successURI if user is logged in";
    }

    method(request,response,next,controller)
    {
        if (request.user) {
            let uri = controller.AuthController.successUri;
            return response.redirect(uri);
        }
        next();
    }
}

module.exports = RedirectIfLoggedIn;

