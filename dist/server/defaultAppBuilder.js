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
        debug('Building application');
        this.express = this.app.config.websocket.enabled
            ? express_ws_1.default(express_1.default()).app
            : express_1.default();
        this.setDependences();
        this.setInterceptions();
        this.setParsers();
        this.setRouting();
        this.setErrorHandling();
        debug('Application started');
        return this.express;
    }
    createRouter(endpointGroup, routerSetup) {
        debug('Enabling routing');
        if (this.app.info.name === 'base' || this.app.info.name === endpointGroup) {
            const router = express_1.default.Router();
            router.options('/', node_controllers_module_1.RootController.options(this.app, 'GET'));
            router.get('/', node_controllers_module_1.RootController.main());
            router.options('/cache', node_controllers_module_1.CacheController.options(this.app, 'DELETE'));
            router.delete('/cache', node_controllers_module_1.CacheController.clean(this.app));
            this.setAdditionalControllers();
            routerSetup(this.app, router);
            this.express.use(process.env.NODE_ENV !== 'development'
                ? '/'
                : `/${endpointGroup}/${this.app.info.version}`, router);
        }
    }
}
exports.default = DefaultAppBuilder;
