"use strict";

var Policy = require('../Policy');
var ObjectCollection = require('expressway/src/ObjectCollection');
var _ = require('lodash');

module.exports = function(app,log,debug)
{
    /**
     * Gate class
     * @author Mike Adamczyk <mike@bom.us>
     */
    class Gate extends ObjectCollection
    {
        constructor(app)
        {
            super(app,'policy');
            this.class = Policy;
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
            }

            // If there isn't a policy defined for this action, don't allow.
            if (! this.has(policyName)) return false;

            policy = this.get(policyName);

            let passed = app.call(policy, 'before', [user, ability, object]);
            if (typeof passed === 'boolean') {
                return passed;
            }
            if (typeof policy[ability] !== 'function') {
                throw new Error(`policy method does not exist: ${policy.name}.${ability}`);
            }

            return app.call(policy, ability, [user,ability,object]);
        }

        /**
         * Add or create a new policy.
         * @param ability string
         * @param policy Policy|function|object
         * @returns {Gate}
         */
        add(ability,policy)
        {
            if (typeof ability == 'function') {
                // We're adding a policy function.
                let instance = new ability(policy);
                if (! (instance instanceof Policy)) {
                    throw new TypeError('constructor is not instance of policy');
                }
                return this.add(instance.name, instance);
            } else if (policy instanceof Policy) {
                // We're adding a policy instance.
                return super.add(ability,policy);
            }

            let name = policy.name;

            // We're building a policy with a factory.
            class CustomPolicy extends Policy {
                get name() { return name || "CustomPolicy" }
            }
            if (typeof policy == 'object') {
                delete policy.name;
                _.assign(CustomPolicy.prototype, policy);
            } else if (typeof policy == 'function') {
                CustomPolicy.prototype[ability] = policy;
            } else {
                throw new TypeError('policy should be function, object or policy instance');
            }

            return super.add(ability, new CustomPolicy);
        }

        /**
         * Alias to add()
         * @param ability
         * @param policy
         * @returns {Gate}
         */
        define(ability,policy)
        {
            return this.add(ability,policy);
        }
    }

    return new Gate;
};