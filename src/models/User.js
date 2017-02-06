"use strict";

var Model = require('expressway').Model;
var _     = require('lodash');
var AuthenticationException = require('../exceptions/AuthenticationException');

const LABELS = {
    email: "Email",
    password: "Password",
    first_name: "First Name",
    last_name: "Last Name",
};

class User extends Model
{
    /**
     * Constructor.
     * @param app {Application}
     * @param md5 {Function}
     */
    constructor(app,md5)
    {
        super(app);

        this.title      = 'email';
        this.expose     = false;
        this.populate   = ['roles'];
        this.managed    = true;
        this.icon       = 'social.people';

        // Create a pre-save hook that encrypts the password.
        this.hook((schema) => {
            schema.pre('save', function(next) {
                if (this.isModified('password')) {
                    this.password = this.encrypted(this.password);
                }
                next();
            });
        });

        // Attach the full name of the person and gravatar URL.
        this.on('toJSON', function(json,model,object) {
            json.name = object.name();
            json.$preview = "https://www.gravatar.com/avatar/"+md5(object.email.toLowerCase());
        });
    }

    /**
     * Create the user schema.
     * @param fields {FieldCollection}
     * @param types {{}}
     * @returns void
     */
    schema(fields,types)
    {
        fields
            .timestamps()
            .add('email',       types.Title, types.Email, 'unique')
            .add('password',    types.Password)
            .add('first_name',  types.Text,     'required', 'fillable', 'display')
            .add('last_name',   types.Text,     'required', 'fillable', 'display')
            .add('reset_token', types.Text,     'guarded', {default:""})
            .add('failures',    types.Number,   'guarded', {default:0})
            .add('roles',       types.HasMany('Role'))
            .labels(LABELS);
    }

    /**
     * Create the model methods.
     * @param object {Object}
     * @param config {Function}
     * @param encrypt {Function}
     * @param gate {Gate}
     * @returns {*}
     */
    methods(object,config,encrypt,gate)
    {
        let allowed_failures = config('auth.allowedFailures', 0);

        let methods = {

            /**
             * Checks the hashed password and salt.
             * @param password string
             * @returns {boolean}
             */
            isValid(password)
            {
                if (! password) return false;

                return this.password === this.encrypted(password);
            },

            encrypted(password)
            {
                return encrypt(password,this.created_at.getTime().toString());
            },

            /**
             * Authenticate a user who is logging in.
             * @param password string
             * @throws AuthenticationException
             * @returns {boolean}
             */
            authenicate(password)
            {
                if (this.reset_token !== "") {
                    throw new AuthenticationException('pendingReset');
                }
                if (allowed_failures && this.failures > allowed_failures) {
                    throw new AuthenticationException('tooManyFailures');
                }
                if (! password) {
                    throw new AuthenticationException('noPassword');
                }

                var valid = this.isValid(password);

                // Increment the failure count.
                if (valid === false) {
                    this.failures ++;
                    this.save();
                    throw new AuthenticationException('badPassword');
                }

                // The user was valid after this point.
                // Reset the failure count.
                if (this.failures > 0) {
                    this.failures = 0;
                    this.save();
                }

                return valid;
            },

            /**
             * Return the user's full name.
             * @returns {string}
             */
            name()
            {
                return [this.first_name,this.last_name].join(" ");
            },

            /**
             * Check if a user has a role.
             * @param role string name
             * @returns {boolean}
             */
            is(role)
            {
                for (let i=0; i<this.roles.length; i++) {
                    if (this.roles[i].name.toLowerCase() == role) return true;
                }
                return false;
            },

            /**
             * Check if a user has a certain permission key.
             * @param key string
             * @returns {boolean}
             */
            hasPermission(key)
            {
                return this.permissions().indexOf(key) > -1;
            },

            /**
             * Return an array of this users permissions.
             * @returns {Array}
             */
            permissions()
            {
                let permissions = [];
                this.roles.map(function(role) {
                    permissions = _.union(role.permissions,permissions);
                });
                return permissions;
            },

            /**
             * Check if a user can perform an action.
             * @param ability string
             * @param object *
             * @returns {Boolean}
             */
            can(ability,object)
            {
                return this.allowed(ability,object).passed;
            },

            /**
             * Alias of can()
             * @param ability string
             * @param object *
             * @returns {Boolean}
             */
            cannot(ability,object)
            {
                return this.allowed(ability,object).failed;
            },

            /**
             * Check if a user can perform an action, but return the test results.
             * @param ability string|array
             * @param object *
             * @returns {PolicyTest}
             */
            allowed(ability,object)
            {
                if (Array.isArray(ability)) {
                    ability = ability.join(".");
                }
                return gate.allows(this,ability,object);
            }
        };

        return super.methods(methods);
    }
}

module.exports = User;