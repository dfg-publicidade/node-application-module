"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskServer = exports.AppServer = exports.DefaultAppBuilder = void 0;
const node_app_module_1 = __importDefault(require("@dfgpublicidade/node-app-module"));
const node_files_module_1 = __importDefault(require("@dfgpublicidade/node-files-module"));
const node_tasks_module_1 = require("@dfgpublicidade/node-tasks-module");
Object.defineProperty(exports, "TaskServer", { enumerable: true, get: function () { return node_tasks_module_1.TaskServer; } });
const app_root_path_1 = __importDefault(require("app-root-path"));
const config_1 = __importDefault(require("config"));
const debug_1 = __importDefault(require("debug"));
const appServer_1 = __importDefault(require("./server/appServer"));
exports.AppServer = appServer_1.default;
const defaultAppBuilder_1 = __importDefault(require("./server/defaultAppBuilder"));
exports.DefaultAppBuilder = defaultAppBuilder_1.default;
const config = Object.assign({}, config_1.default);
/* Module */
let appServer;
let taskServer;
const debug = debug_1.default('module:app');
class Application {
    async start() {
        try {
            debug('Starting application');
            this.appInfo = await node_files_module_1.default.getJson(`${app_root_path_1.default}/app.json`);
            debug('App info. loaded');
            debug('Running startup scripts...');
            await this.runStartupScripts();
            debug('Starting databases...');
            await this.startDatabases();
            this.app = new node_app_module_1.default({
                appInfo: this.appInfo,
                config
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
    async runStartupScripts() {
        //
    }
    async setComplAppInfo() {
        //
    }
    async startTranslation() {
        //
    }
    async startDatabases() {
        return Promise.resolve([]);
    }
    async stopDatabases() {
        return Promise.resolve([]);
    }
    async createAppBuilder() {
        return Promise.reject();
    }
    async createTaskManager() {
        return Promise.reject();
    }
    async startAppServer() {
        if (appServer) {
            return Promise.resolve(appServer);
        }
        const appBuilder = await this.createAppBuilder();
        appServer = new appServer_1.default(appBuilder);
        await appServer.start(config);
        debug('App server started');
        return Promise.resolve(appServer);
    }
    async startTaskServer() {
        if (taskServer) {
            return Promise.resolve(taskServer);
        }
        taskServer = new node_tasks_module_1.TaskServer(this.app, await this.createTaskManager());
        await taskServer.start();
        debug('Task server started');
        return Promise.resolve(taskServer);
    }
}
exports.default = Application;
