/**
 * Policy class.
 * @constructor
 */
class Policy
{
    get name() {
        return this.constructor.name;
    }

    /**
     * Run this method before any other method is called.
     * @injectable
     * @param user
     * @param ability
     * @param object
     * @returns boolean|void
     */
    before(user,ability,object) {
        // Unimplemented
    }
}

module.exports = Policy;