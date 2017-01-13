/**
 * Policy class.
 * @constructor
 */
class Policy
{
    constructor(ref=null)
    {
        this.ref = ref;
    }

    /**
     * Get the policy name.
     * @returns String
     */
    get name()
    {
        return this.constructor.name;
    }

    /**
     * Run this method before any other method is called.
     * @injectable
     * @param test {PolicyTest}
     * @param user {Object}
     * @param ability {String}
     * @param object {*}
     * @returns boolean|void
     */
    before(test,user,ability,object) {
        // Unimplemented
    }
}

module.exports = Policy;