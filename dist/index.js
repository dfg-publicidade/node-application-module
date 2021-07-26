"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppServer = exports.DefaultAppBuilder = void 0;
const node_app_module_1 = __importDefault(require("@dfgpublicidade/node-app-module"));
const node_tasks_module_1 = require("@dfgpublicidade/node-tasks-module");
const config_1 = __importDefault(require("config"));
const debug_1 = __importDefault(require("debug"));
const lodash_1 = __importDefault(require("lodash"));
const appServer_1 = __importDefault(require("./server/appServer"));
exports.AppServer = appServer_1.default;
const defaultAppBuilder_1 = __importDefault(require("./server/defaultAppBuilder"));
exports.DefaultAppBuilder = defaultAppBuilder_1.default;
/* Module */
let appServer;
let taskServer;
const debug = debug_1.default('module:app');
class Application {
    async start() {
        try {
            debug('Starting application');
            this.appInfo = {
                name: process.env.APP_NAME,
                version: process.env.APP_VERSION,
                taskServer: process.env.APP_TASKSERVER === 'true'
            };
            debug('Running startup scripts...');
            await this.runStartupScripts();
            this.config = Object.assign({}, config_1.default);
            debug('Starting databases...');
            await this.startDatabases();
            let config = lodash_1.default.merge(this.config, await this.loadDynamicConfig());
            config = JSON.stringify(config);
            for (const key of Object.keys(process.env)) {
                config = config.replace(new RegExp('\\$' + key, 'ig'), process.env[key]);
            }
            this.config = JSON.parse(config);
            this.app = new node_app_module_1.default({
                appInfo: this.appInfo,
                config: this.config
            });
            debug('Setting complementar app info.');
            await this.setComplAppInfo();
            debug('Starting translation...');
            await this.startTranslation();
            const servers = [];
            if (!this.app.info.taskServer) {
                debug('Starting app server...');
                servers.push(this.startAppServer());
            }
            if (this.app.info.taskServer) {
                debug('Starting task server...');
                servers.push(this.startTaskServer());
            }
            return Promise.all(servers);
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error(error.message);
            await this.stopDatabases();
        }
    }
    async startAppServer() {
        const appBuilder = await this.createAppBuilder();
        appServer = new appServer_1.default(appBuilder);
        await appServer.start(this.config);
        debug('App server started');
        return Promise.resolve(appServer);
    }
    async startTaskServer() {
        taskServer = new node_tasks_module_1.TaskServer(this.app, await this.createTaskManager());
        await taskServer.start();
        debug('Task server started');
        return Promise.resolve(taskServer);
    }
}
exports.default = Application;
