"use strict";

var Middleware = require('expressway').Middleware;
var Strategy = require('passport-local').Strategy;

class BasicAuth extends Middleware
{
    get description() {
        return "Set up passport and user authentication strategy"
    }

    /**
     * Constructor.
     * @injectable
     * @param app Application
     * @param utils Object
     */
    constructor(app)
    {
        super(app);

        app.on('view.render', function(view,request) {
            view.use('currentUser', request.user);
        });
    }

    /**
     * Dispatch the middleware.
     * @param extension Extension
     * @param passport passport
     * @returns {Array}
     */
    dispatch(extension,passport)
    {
        passport.use(new Strategy(this.app.call(this,'strategy')));
        passport.serializeUser(this.app.call(this,'serialize'));
        passport.deserializeUser(this.app.call(this,'deserialize'));

        let init = passport.initialize();
        let sess = passport.session();
        return [
            function PassportInitialize(request,response,next) {
                return init(...arguments);
            },
            function PassportSession(request,response,next) {
                return sess(...arguments);
            },
        ]
    }

    /**
     * Create a local strategy.
     * @injectable
     * @param User
     * @param log
     * @returns {Function}
     */
    strategy(User,log)
    {
        /**
         * The local strategy to use for authentication.
         * @param username string
         * @param password string
         * @param done Function
         */
        return function strategy(username,password,done)
        {
            log.warn("login attempt: '%s'", username);

            User.first({ email: username }).then( user =>
            {
                // If user is not found, fail with message.
                if (! user) {
                    log.warn("user does not exist: '%s'", username);
                    return done(null, false, { message: 'auth.err_userMissing' });
                }

                try {
                    user.authenicate(password);
                } catch(err) {
                    log.warn("login attempt failed: '%s' %s", username, err.type);
                    return done(null, false, { message: err.localeKey });
                }

                // If they got this far, they were successfully authenticated.
                log.warn("login successful: '%s' %s", username, user.id);

                return done(null, user);

            }, function(err) {

                // There was an error, probably database related...
                return done(err);
            });
        }
    }

    /**
     * Return the serialize function.
     * @injectable
     * @returns {serialize}
     */
    serialize()
    {
        /**
         * Serializes user from the user id.
         * @param user User model
         * @param done function
         */
        return function serialize(user,done) {
            done(null, user._id);
        }

    }

    /**
     * Return the deserialize function.
     * @injectable
     * @param User Model
     * @returns {serialize}
     */
    deserialize(User)
    {
        /**
         * Deserializes user from session.
         * @param id string
         * @param done function
         */
        return function deserialize(id,done)
        {
            User.findById(id).then(user => {
                done(null, user);
            }, err => {
                done(err,null);
            });
        }
    }
}

module.exports = BasicAuth;