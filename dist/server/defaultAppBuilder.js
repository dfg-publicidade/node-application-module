"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_controllers_module_1 = require("@dfgpublicidade/node-controllers-module");
const debug_1 = __importDefault(require("debug"));
const express_1 = __importDefault(require("express"));
const express_ws_1 = __importDefault(require("express-ws"));
/* Module */
const debug = debug_1.default('module:app-builder');
class DefaultAppBuilder {
    constructor(app) {
        this.app = app;
    }
    build() {
        var _a;
        debug('Building application');
        this.express = ((_a = this.app.config.websocket) === null || _a === void 0 ? void 0 : _a.enabled)
            ? express_ws_1.default(express_1.default()).app
            : express_1.default();
        this.setDependencies();
        this.setParsers();
        this.setInterceptions();
        this.setRouting();
        this.setErrorHandling();
        debug('Application started');
        return this.express;
    }
    createRouter(endpointGroup, routerSetup) {
        debug('Enabling routing');
        if (this.app.info.name === 'base' || this.app.info.name === endpointGroup) {
            this.router = express_1.default.Router();
            this.router.options('/', node_controllers_module_1.RootController.options(this.app, 'GET'));
            this.router.get('/', node_controllers_module_1.RootController.main());
            this.setAdditionalControllers();
            routerSetup(this.app, this.router);
            this.express.use(process.env.NODE_ENV !== 'development'
                ? '/'
                : `/${endpointGroup}/${this.app.info.version}`, this.router);
        }
    }
}
exports.default = DefaultAppBuilder;
