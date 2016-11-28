"use strict";

var Expressway = require('expressway');
var app = Expressway.app;
var passport = require('passport');
var Strategy = require('passport-local').Strategy;

class BasicAuth extends Expressway.Middleware
{
    get type() {
        return 'AuthModule'
    }

    get description() {
        return "Set up passport and user authentication strategy"
    }


    constructor()
    {
        super();

        passport.use(new Strategy(this.strategy));
        passport.serializeUser(this.serialize);
        passport.deserializeUser(this.deserialize);

        app.register('passport', passport, "The passport instance");
    }

    dispatch()
    {
        let init = passport.initialize();
        let sess = passport.session();
        return [
            function PassportInitialize(...args) {
                return init(...args);
            },
            function PassportSession(...args) {
                return sess(...args);
            }
        ]
    }

    /**
     * The local strategy to use for authentication.
     * @param username string
     * @param password string
     * @param done Function
     */
    strategy(username,password,done)
    {
        let [User,log] = app.get('User','log');

        log.warn("Login attempt: '%s'", username);

        User.findOne({ email: username }).populate(User.populate).exec().then( user =>
        {
            // If user is not found, fail with message.
            if (! user) {
                log.warn("User does not exist: '%s'", username);
                return done(null, false, { message: 'auth.err_user_missing' });
            }

            try {
                user.authenicate(password);
            } catch(err) {
                log.warn("Login attempt failed: '%s'", username);
                return done(null, false, { message: 'auth.err_'+err });
            }

            // If they got this far, they were successfully authenticated.
            log.warn("Login successful: '%s' %s", username, user.id);

            return done(null, user);

        }, function(err) {

            // There was an error, probably database related...
            return done(err);
        });
    }

    /**
     * Serializes user from the user id.
     * @param user User model
     * @param done function
     */
    serialize(user,done)
    {
        done(null, user._id);
    }

    /**
     * Deserializes user from session.
     * @param id string
     * @param done function
     */
    deserialize(id,done)
    {
        let User = app.get('User');

        User.findById(id).populate(User.populate).exec().then(user => {
            done(null, user);
        }, err => {
            done(err,null);
        });
    }
}

module.exports = BasicAuth;