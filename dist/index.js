"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskServer = exports.AppServer = exports.DefaultAppBuilder = void 0;
const node_app_module_1 = __importDefault(require("@dfgpublicidade/node-app-module"));
const node_files_module_1 = __importDefault(require("@dfgpublicidade/node-files-module"));
const app_root_path_1 = __importDefault(require("app-root-path"));
const config_1 = __importDefault(require("config"));
const appServer_1 = __importDefault(require("./server/appServer"));
exports.AppServer = appServer_1.default;
const defaultAppBuilder_1 = __importDefault(require("./server/defaultAppBuilder"));
exports.DefaultAppBuilder = defaultAppBuilder_1.default;
const taskServer_1 = __importDefault(require("./server/taskServer"));
exports.TaskServer = taskServer_1.default;
const config = Object.assign({}, config_1.default);
/* Module */
let appServer;
let taskServer;
class Application {
    async start() {
        try {
            const appInfo = await node_files_module_1.default.getJson(`${app_root_path_1.default}/app.json`);
            await this.runStartupScripts();
            await this.startDatabases();
            const app = new node_app_module_1.default({
                appInfo,
                config
            });
            await this.setComplAppInfo();
            await this.startTranslation();
            const servers = [];
            if (!app.info.taskServer) {
                servers.push(this.startAppServer(app));
            }
            if (app.info.taskServer) {
                servers.push(this.startTaskServer(app));
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
    async startAppServer(app) {
        if (appServer) {
            return Promise.resolve(appServer);
        }
        const appBuilder = await this.createAppBuilder();
        appServer = new appServer_1.default(appBuilder);
        await appServer.start(config);
        return Promise.resolve(appServer);
    }
    async startTaskServer(app) {
        if (taskServer) {
            return Promise.resolve(taskServer);
        }
        taskServer = new taskServer_1.default(app, await this.createTaskManager());
        await taskServer.start();
        return Promise.resolve(taskServer);
    }
}
exports.default = Application;
