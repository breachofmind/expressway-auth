"use strict";

var Expressway = require('expressway');
var app = Expressway.app;
var $auth = app.get('$auth');

class AuthController extends Expressway.Controller
{
    get description() {
        return "Controls the login views, processing of user authentication, and password resets"
    }

    constructor(app)
    {
        super(app);

        this.middleware('login', 'RedirectIfLoggedIn');
    }

    /**
     * GET /login
     *
     * Display the login form.
     */
    login(request,response,next,view)
    {
        var flash = request.flash('message');

        return view($auth.loginView).use({
                title: "Login",
                message: flash[0] || "",
                username:request.query.username || ""
            });
    }

    /**
     * GET /login/reset
     *
     * For when user forgets their password.
     */
    forgot(request,response,next,view)
    {
        var flash = request.flash('message');

        return view($auth.forgotView).use({
                title: "Reset Password",
                message: flash[0] || ""
            });
    }

    /**
     * GET /login/reset/:hash
     *
     * Look up a user's reset token.
     */
    lookup(request,response,next,User,view)
    {
        return User.findOne({reset_token: request.params.hash}).exec().then(user => {
            if (! user) {
                return next();
            }
            return view($auth.resetView, {requester: user});
        })
    }

    /**
     * POST /login/reset
     *
     * Allows the user to securely reset their password.
     */
    request_reset(request,response,next,User,encrypt,url,log,mail,domain,config)
    {
        return User.findOne({email: request.body.username}).exec().then(user =>
        {
            // If no user found,
            // return to the login screen with a message.
            if (! user) {
                return response.redirectWithFlash($auth.loginUri, 'message', {
                    text: request.lang('auth.err_user_missing'),
                    type: 'alert'
                });
            }

            // Generate a reset link.
            var hash = encrypt(user.email, Date.now().toString());
            user.reset_token = hash;
            user.save();

            var resetLink = url(`${$auth.forgotUri}/${hash}`);

            mail({
                from:    `Administrator <${config('admin_email', 'info@'+domain)}>`,
                to:      user.email,
                subject: 'Password Reset',
                view:    $auth.resetEmailView,
                data:    {resetLink: resetLink}

            }).then(info => {
                log.warn('Mail sent: User requested reset: %s %s', user.id, app.config.debug ? resetLink : "");
                if (app.config.debug) {
                    console.log(info);
                }
            });

            request.flash('message', {
                text: request.lang('auth.login_reset'),
                type: 'success'
            });

            return response.redirect($auth.forgotUri)
        });
    }

    /**
     * POST /login/reset/:hash
     *
     * Given the reset token, change the user's password.
     */
    perform_reset(request,response,next,User,encrypt,log)
    {
        var newPassword = request.body.password;

        if (! newPassword || newPassword == "") {
            return response.redirectWithFlash($auth.loginUri, 'message', {
                success: false,
                text: request.lang('auth.err_no_password'),
                type: 'alert'
            });
        }
        return User.findOne({reset_token: request.params.hash}).exec().then(user =>
        {
            // If no user found,
            // return to the login screen with a message.
            if (! user) {
                return response.redirectWithFlash($auth.loginUri, 'message', {
                    success: false,
                    text: request.lang('auth.err_user_missing'),
                    type: 'alert'
                });
            }

            return user.update({password: user.encrypted(newPassword)}).exec().then(result => {
                user.reset_token = "";
                user.save();
                log.warn('User "%s" reset password', user.email);
                return response.redirectWithFlash($auth.loginUri+"?username="+user.email, 'message', {
                    text: request.lang('auth.password_reset'),
                    type: 'success'
                });
            }, err => {
                return response.redirectWithFlash($auth.loginUri, 'message', {
                    success: false,
                    text: request.lang('auth.'+err.message),
                    type: 'alert'
                });
            });
        })
    }

    /**
     * GET /logout
     *
     * Logs a user out and redirects to the login page.
     */
    logout(request,response,next,log)
    {
        if (request.user) {
            log.warn('User logging out: %s', request.user.id);
        }
        request.logout();

        return response.redirectWithFlash($auth.loginUri, 'message', {
            text: request.lang('auth.logged_out'),
            type:'success'
        });
    }

    /**
     * POST /login
     *
     * Authenticates a username and password.
     * POSTing as ajax will return a response in JSON format.
     */
    authenticate(request,response,next,passport)
    {
        var opts = {badRequestMessage: 'auth.err_missing_credentials'};
        var redirectTo = request.query.r || $auth.successUri;

        // Fires if there was an error...
        var kill = info =>
        {
            return response.redirectWithFlash($auth.loginUri, 'message', {
                success: false,
                text:    request.lang(info.message),
                type:    'alert'
            });
        };

        // Use passport to authenticate.
        // Messages are returned in locale format.
        passport.authenticate('local', opts, (err,user,info) =>
        {
            if (err) return next(err);

            if (! user) return kill(info);

            request.logIn(user, err =>
            {
                if (err) return kill(info);

                return request.ajax
                    ? response.smart({success:true, user:user, redirect:$auth.successUri}, 200)
                    : response.redirect(redirectTo);
            });

        })(request,response,next);

        return true;
    }
}

module.exports = AuthController;