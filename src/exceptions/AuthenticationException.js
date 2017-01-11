/**
 * An exception for when a user has an authentication problem.
 * @constructor
 */
class AuthenticationException extends Error
{
    constructor(type)
    {
        super('could not authenticate user');

        this.type = type;
        this.localeKey = "auth.err_"+type;
    }
}

module.exports = AuthenticationException;