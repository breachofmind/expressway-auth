var expressway = require('expressway');
var Policy = require('../src/Policy');
var PolicyTest = require('../src/PolicyTest');
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
            before(test,user,ability,object) {
                test.pass("good");
            }
            breakfast(test,user,ability,object) {
                test.fail("bad");
            }
            lunch(test,user,ability,object) {
                test.fail("bad");
            }
        }

        var customPolicyObject = {
            name: "Custom",
            before(test,user,ability,object) {
                user.beforeCalled = true;
            },
            breakfast(test,user,ability,object) {
                if (user.beforeCalled) test.pass('before called');
            },
            lunch(test,user,ability,object) {
                test.fail('lunch failed');
            },
            dinner(test,user,ability,object,testStr) {
                test.pass(testStr);
            }
        };


        it('should be a method', () => {
            let gate = app.get('gate');
            expect(gate).to.respondTo('define');
        });
        it('simple: should define a named policy', () => {
            let gate = app.get('gate');
            let fn = function viewPolicy(test,user,ability,object) {
                return test.pass("good");
            };
            gate.define('view', fn);
            let policy = gate.get('view');
            expect(policy).to.be.instanceOf(Policy);
            expect(policy).to.respondTo('view');
            expect(policy.view).to.equal(fn);
        });
        it('simple: should pass PolicyTest for gate.allows()', () => {
            let gate = app.get('gate');
            let test = gate.allows({},'view',false);

            expect(test).to.be.instanceOf(PolicyTest);
            expect(test.complete).to.equal(true);
            expect(test.passed).to.equal(true);
        });
        it('medium: should define a named policy where user object has test role', () => {
            let gate = app.get('gate');
            let fn = function userPolicy(test,user,ability,object) {
                // Note - the first pass or fail should be the one used.
                if (user.role === "admin") {
                    test.pass('is admin!');
                }
                test.fail('not admin...');
            };
            gate.define('admin', fn);
            expect(gate.get('admin').admin).to.equal(fn);
        });
        it('medium: should return true for user.role = admin', () => {
            let gate = app.get('gate');
            let test = gate.allows({role:"admin"}, 'admin');
            expect(test).to.be.instanceOf(PolicyTest);
            expect(test.complete).to.equal(true);
            expect(test.passed).to.equal(true);
            expect(test.message).to.equal('is admin!');
        });
        it('medium: should return false for user.role = nonadmin', () => {
            let gate = app.get('gate');
            let test = gate.allows({role:"nonadmin"}, 'admin');
            expect(test).to.be.instanceOf(PolicyTest);
            expect(test.complete).to.equal(true);
            expect(test.passed).to.equal(false);
            expect(test.message).to.equal('not admin...');
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
            let test = gate.allows({beforeCalled: false},'custom.breakfast',{});
            expect(test).to.be.instanceOf(PolicyTest);
            expect(test.complete).to.equal(true);
            expect(test.passed).to.equal(true);
            expect(test.message).to.equal('before called');

        });
        it('hard: should return failing test for second method', () => {
            let gate = app.get('gate');
            let test = gate.allows({beforeCalled: false},'custom.lunch',{});
            expect(test.complete).to.equal(true);
            expect(test.passed).to.equal(false);
            expect(test.message).to.equal('lunch failed');
        });
        it('hard: should allow service injection in policy methods', () => {
            let STRING = "HELLO!";
            let gate = app.get('gate');
            app.service('testStr', STRING);
            let test = gate.allows({beforeCalled:false}, 'custom.dinner', {});
            expect(test.complete).to.equal(true);
            expect(test.passed).to.equal(true);
            expect(test.message).to.equal(STRING);
        });

        it('pro: should allow building extensions of Policy class with reference object', () => {
            let gate = app.get('gate');
            gate.define(TestPolicy,{model:"Test"});
            let policy = gate.get('Test');
            expect(policy).to.be.instanceOf(TestPolicy);
            expect(policy.name).to.equal('Test');
        });
        it('pro: should always return passing tests because of before() call', () => {
            let gate = app.get('gate');
            let test0 = gate.allows({},'Test.breakfast');
            let test1 = gate.allows({},'Test.lunch');
            expect(test0.complete).to.equal(true);
            expect(test1.complete).to.equal(true);
            expect(test0.passed).to.equal(true);
            expect(test1.passed).to.equal(true);
            expect(test0.message).to.equal('good');
            expect(test1.message).to.equal('good');
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
