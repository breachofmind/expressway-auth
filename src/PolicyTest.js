/**
 * A class created for gate.allows().
 * Allows for better gate control instead of relying on true/false.
 * Also allows for return of a pass or fail message.
 * @author Mike Adamczyk <mike@bom.us>
 */
class PolicyTest
{
    constructor(user,ability,object)
    {
        this.user    = user;
        this.ability = ability;
        this.object  = object;

        /**
         * Is the test complete?
         * If true, will not allow changing the test results.
         * @type {boolean}
         * @private
         */
        this._complete = false;

        /**
         * Did the test pass? False by default.
         * @type {boolean}
         * @private
         */
        this._passed   = false;

        /**
         * The message localized key or string.
         * @type {string}
         * @private
         */
        this._message  = "auth.gate_notAuthed";

        /**
         * Parameters to pass with the message.
         * @type {Array}
         * @private
         */
        this._params   = [];
    }

    /**
     * Check if the test was complete.
     * @returns {boolean}
     */
    get complete() { return this._complete; }

    /**
     * Get the pass or fail message.
     * @returns {*|string}
     */
    get message() { return this._message; }

    /**
     * Did the user pass the test?
     * @returns {boolean}
     */
    get passed() { return this._passed; }

    /**
     * Did the user fail the test?
     * @returns {boolean}
     */
    get failed() { return ! this._passed; }

    /**
     * Return the localized message.
     * @param request {IncomingMessage}
     * @returns {String}
     */
    localize(request)
    {
        return request.lang(this.message,[].concat(this._params));
    }

    /**
     * Mark the test as complete.
     * @param passed boolean pass/fail
     * @param message string, optional
     * @param params Array|string
     * @returns {PolicyTest}
     */
    done(passed,message,params=[])
    {
        if (! this.complete) {
            this._passed = passed;
            this._complete = true;

            if (message) {
                this._message = message;
                this._params = params;
            }
        }

        return this;
    }

    /**
     * Fail the test.
     * @param message string
     * @param params Array|string
     * @returns {PolicyTest}
     */
    fail(message,params)
    {
        return this.done(false,message,params);
    }

    /**
     * Pass the test.
     * @param message string
     * @param params Array|string
     * @returns {PolicyTest}
     */
    pass(message,params)
    {
        // Use a default authed message if none given.
        if (! message) message = "auth.gate_authed";

        return this.done(true,message,params);
    }

}

module.exports = PolicyTest;