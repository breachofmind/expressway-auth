"use strict";

var _                = require('lodash');
var Policy           = require('../Policy');
var PolicyTest       = require('../PolicyTest');
var ObjectCollection = require('expressway/src/ObjectCollection');

module.exports = function(app,debug)
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

            this.on('add', (name,value) => {
                debug('Gate add policy: %s', name);
            })
        }

        /**
         * Check if the gate allows the user to proceed given the ability and object.
         * @param user User
         * @param ability string - ie, "create" or "Object.create", where Object is the Policy name
         * @param object Model - optional
         * @returns {PolicyTest}
         */
        allows(user,ability,object)
        {
            let [policyName, method] = __getPolicyArgs(ability);

            let test = new PolicyTest(user,method,object);

            // If there isn't a policy defined for this action, don't allow.
            if (! this.has(policyName)) {
                return test.fail('auth.gate_policyNotDefined');
            }

            let policy = this.get(policyName);

            if (typeof policy[method] !== 'function') {
                return test.fail('auth.gate_policyMethodNotDefined');
            }

            // Call the before method first.
            app.call(policy, 'before', [test,user,ability,object]);

            if (test.complete) return test;

            // Call the ability method next.
            app.call(policy, method, [test,user,ability,object]);

            // Return the resulting test.
            return test;
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

/**
 * Get the arguments for gate.allows()
 * @param ability string
 * @returns {[*,*]}
 * @private
 */
function __getPolicyArgs(ability)
{
    let policyName = ability;

    if (ability.indexOf(".") > -1) {
        [policyName,ability] = ability.split(".");
    }

    return [policyName,ability];
}