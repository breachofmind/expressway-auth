"use strict";

var Policy = require('../Policy');

module.exports = function(app,log,debug)
{
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
         * @param object Model - optional
         * @returns {boolean}
         */
        allows(user, ability, object)
        {
            let policy,
                policyName = ability;

            if (ability.indexOf(".") > -1) {
                [policyName,ability] = ability.split(".");

                // If no object is given, lets assume the
                // object could be a model blueprint.
                if (! object && app.models.has(policyName)) {
                    object = app.models.get(policyName);
                }
            }
            try {
                policy = this.policy(policyName);
            } catch (err) {
                // If there isn't a policy defined for this action, don't allow.
                return false;
            }

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
            } else {
                policy.$constructor = false;
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
            return new CustomPolicy;
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