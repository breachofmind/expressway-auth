"use strict";

module.exports = function(app,log,debug)
{
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

    /**
     * Gate class
     * @author Mike Adamczyk <mike@bom.us>
     */
    class Gate
    {
        /**
         * Constructor.
         */
        constructor()
        {
            this.policies = {};
        }

        /**
         * Get the name.
         * @returns {String}
         */
        get name()
        {
            return this.constructor.name;
        }

        /**
         * Check if the gate allows the user to proceed given the ability and object.
         * @param user User
         * @param ability string - ie, "create" or "Object.create", where Object is the Policy name
         * @returns {boolean}
         */
        allows(user, ability, object)
        {
            let policyName = ability, policy;
            if (ability.indexOF(".") > -1) {
                [policyName,ability] = ability.split(".");
                if (! object && app.models.has(policyName)) {
                    object = app.models.get(policyName);
                }
            }
            policy = this.policy(policyName);

            // If there isn't a policy defined for this action, don't allow.
            if (! policy) return false;

            if (policy instanceof Policy)
            {
                let passed = app.call(policy, 'before', [user, ability, object]);
                if (typeof passed === 'boolean') {
                    return passed;
                }
                if (typeof policy[ability] !== 'function') {
                    throw new Error(`policy method does not exist: ${policy.name}.${ability}`);
                }
                return app.call(policy, ability, [user,object]);
            }

            return app.call(policy,null,[user,object]);
        }

        /**
         * Define a custom policy.
         * Ability can be a Model name
         * @param ability string
         * @param policy function|Policy|object
         * @returns {Gate}
         */
        define(ability, policy)
        {
            if (typeof policy == 'object') {
                policy = this.create(policy);
            }
            this.policies[ability] = policy;
            debug("GateService policy defined: %s.%s", policy.name, ability);
            return this;
        }

        /**
         * Policy factory function.
         * @param object Object
         * @returns {CustomPolicy}
         */
        create(object)
        {
            if (object instanceof Policy) {
                return object;
            }
            class CustomPolicy extends Policy
            {
                get name() {
                    return object.name || 'CustomPolicy';
                }
            }
            _.each(object, (value,key) => {
                if (key == 'name') return;
                CustomPolicy.prototype[key] = value;
            });
            return CustomPolicy;
        }

        /**
         * Check if a policy ability is provided.
         * @param ability string
         * @returns {boolean}
         */
        has(ability)
        {
            return this.policies.hasOwnProperty(ability);
        }

        /**
         * Get a policy.
         * @param ability string
         * @returns {Policy|Function}
         */
        policy(ability)
        {
            if (! this.has(ability)) {
                throw new Error(`policy does not exist: ${ability}`);
            }
            return this.policies[ability];
        }
    }

    return new Gate;
};