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

        it('should be a method', () => {
            let gate = app.get('gate');
            expect(gate).to.respondTo('define');
        });
        it('simple: should define a named policy', () => {
            let gate = app.get('gate');
            let fn = function viewPolicy(user,object) {
                return true;
            };
            gate.define('view', fn);
            expect(gate.policy('view')).to.equal(fn);
        });
        it('simple: should return true for gate.allows()', () => {
            let gate = app.get('gate');
            expect(gate.allows({}, 'view', false)).to.equal(true);
            expect(gate.allows({}, 'view')).to.equal(true);
        });
        it('medium: should define a named policy where user object has test role', () => {
            let gate = app.get('gate');
            let fn = function userPolicy(user,object) {
                return user.role === "admin";
            };
            gate.define('admin', fn);
            expect(gate.policy('admin')).to.equal(fn);
        });
        it('medium: should return true for user.role = admin', () => {
            let gate = app.get('gate');
            expect(gate.allows({role:"admin"}, 'admin')).to.equal(true);
        });
        it('medium: should return false for user.role = nonadmin', () => {
            let gate = app.get('gate');
            expect(gate.allows({role:"nonadmin"}, 'admin')).to.equal(false);
        })

    })
});
