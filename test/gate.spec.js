var expressway = require('expressway');
var Policy = require('../src/Policy');
var path = require('path');
var mock = require('expressway/src/support/mock');
var app = expressway({
    config: mock.config,
    context: CXT_TEST,
    rootPath: path.resolve(__dirname, "..")
});
var gateService = require('../src/services/GateService');
var provider = require('../src/providers/GateProvider');

describe('Gate', function()
{
    it('provider and service should be functions', () => {
        expect(gateService).to.be.a('function');
        expect(provider).to.be.a('function');
    });

    it('should load the provider into the app', () => {
        expect(function() {app.use(provider)}).to.not.throw();
        expect(app.providers.get('GateProvider')).to.be.instanceOf(expressway.Provider);
    });
    it('should add the Policy class as service', () => {
        expect(app.services.get('Policy')).to.equal(Policy);
    });
    it('should load the gate service after adding the provider', () => {
        expect(app.services.has('gate')).to.equal(true);
        expect(app.services.get('gate').name).to.equal('Gate');
    });
    describe('gate.define()', function() {

        class TestPolicy extends Policy
        {
            get name() {
                return this.ref.model;
            }
            before(user,ability,object) {
                return true;
            }
            breakfast(user,ability,object) {
                return false;
            }
            lunch(user,ability,object) {
                return false;
            }
        }

        var customPolicyObject = {
            name: "Custom",
            before(user,ability,object) {
                user.beforeCalled = true;
            },
            breakfast(user,ability,object) {
                return user.beforeCalled;
            },
            lunch(user,ability,object) {
                return false;
            },
            dinner(user,ability,object,testStr) {
                return testStr;
            }
        };


        it('should be a method', () => {
            let gate = app.get('gate');
            expect(gate).to.respondTo('define');
        });
        it('simple: should define a named policy', () => {
            let gate = app.get('gate');
            let fn = function viewPolicy(user,ability,object) {
                return true;
            };
            gate.define('view', fn);
            let policy = gate.get('view');
            expect(policy).to.be.instanceOf(Policy);
            expect(policy).to.respondTo('view');
            expect(policy.view).to.equal(fn);
        });
        it('simple: should return true for gate.allows()', () => {
            let gate = app.get('gate');
            expect(gate.allows({}, 'view', false)).to.equal(true);
            expect(gate.allows({}, 'view')).to.equal(true);
        });
        it('medium: should define a named policy where user object has test role', () => {
            let gate = app.get('gate');
            let fn = function userPolicy(user,ability,object) {
                return user.role === "admin";
            };
            gate.define('admin', fn);
            expect(gate.get('admin').admin).to.equal(fn);
        });
        it('medium: should return true for user.role = admin', () => {
            let gate = app.get('gate');
            expect(gate.allows({role:"admin"}, 'admin')).to.equal(true);
        });
        it('medium: should return false for user.role = nonadmin', () => {
            let gate = app.get('gate');
            expect(gate.allows({role:"nonadmin"}, 'admin')).to.equal(false);
        });

        it('hard: should define a custom policy from an object', () => {
            let gate = app.get('gate');
            gate.define('custom', customPolicyObject);
            expect(gate.get('custom')).to.be.instanceOf(Policy);
            expect(gate.get('custom')).to.respondTo('breakfast');
            expect(gate.get('custom')).to.respondTo('lunch');
            expect(gate.get('custom').name).to.equal('Custom');
        });

        it('hard: should return true for first method where user object manipulated in before() call', () => {
            let gate = app.get('gate');
            expect(gate.allows({beforeCalled: false},'custom.breakfast',{})).to.equal(true);
        });
        it('hard: should return false for second method', () => {
            let gate = app.get('gate');
            expect(gate.allows({beforeCalled: false},'custom.lunch',{})).to.equal(false);
        });
        it('hard: should allow service injection in policy methods', () => {
            let STRING = "HELLO!";
            let gate = app.get('gate');
            app.service('testStr', STRING);
            expect(gate.allows({beforeCalled:false}, 'custom.dinner', {})).to.equal(STRING);
        });

        it('pro: should allow building extensions of Policy class with reference object', () => {
            let gate = app.get('gate');
            gate.define(TestPolicy,{model:"Test"});
            let policy = gate.get('Test');
            expect(policy).to.be.instanceOf(TestPolicy);
            expect(policy.name).to.equal('Test');
        });
        it('pro: should always return true because of before() call', () => {
            let gate = app.get('gate');
            expect(gate.allows({},'Test.breakfast')).to.equal(true);
            expect(gate.allows({},'Test.lunch')).to.equal(true);
        });
        it('pro: should allow building extensions of policy with policy instance as argument', () => {
            let gate = app.get('gate');
            gate.define('testCustom', new TestPolicy({model:'New'}));

            let policy = gate.get('testCustom');
            expect(policy).to.be.instanceOf(TestPolicy);
            expect(policy.name).to.equal('New');
        })
    })
});
