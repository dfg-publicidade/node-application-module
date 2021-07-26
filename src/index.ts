import App, { AppInfo } from '@dfgpublicidade/node-app-module';
import { DefaultTaskManager, TaskServer } from '@dfgpublicidade/node-tasks-module';
import cfg from 'config';
import appDebugger from 'debug';
import _ from 'lodash';
import AppServer from './server/appServer';
import DefaultAppBuilder from './server/defaultAppBuilder';

/* Module */
let appServer: AppServer;
let taskServer: TaskServer;

const debug: appDebugger.IDebugger = appDebugger('module:app');

abstract class Application {
    protected config: any;
    protected appInfo: AppInfo;
    protected app: App;

    public async start(): Promise<(AppServer | TaskServer)[]> {
        try {
            debug('Starting application');

            this.appInfo = {
                name: process.env.APP_NAME,
                version: process.env.APP_VERSION,
                taskServer: process.env.APP_TASKSERVER === 'true'
            };

            debug('Running startup scripts...');
            await this.runStartupScripts();

            this.config = { ...cfg };

            debug('Starting databases...');
            await this.startDatabases();

            let config: any = _.merge(this.config, await this.loadDynamicConfig());

            config = JSON.stringify(config);

            for (const key of Object.keys(process.env)) {
                config = config.replace(new RegExp('\\$' + key, 'ig'), process.env[key]);
            }

            this.config = JSON.parse(config);

            this.app = new App({
                appInfo: this.appInfo,
                config: this.config
            });

            debug('Setting complementar app info.');
            await this.setComplAppInfo();

            debug('Starting translation...');
            await this.startTranslation();

            const servers: Promise<(AppServer | TaskServer)>[] = [];

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

    private async startAppServer(): Promise<AppServer> {
        const appBuilder: DefaultAppBuilder = await this.createAppBuilder();
        appServer = new AppServer(appBuilder);

        await appServer.start(this.config);

        debug('App server started');

        return Promise.resolve(appServer);
    }

    private async startTaskServer(): Promise<TaskServer> {
        taskServer = new TaskServer(this.app, await this.createTaskManager());

        await taskServer.start();

        debug('Task server started');

        return Promise.resolve(taskServer);
    }

    protected abstract runStartupScripts(): Promise<void>;

    protected abstract setComplAppInfo(): Promise<void>;

    protected abstract startTranslation(): Promise<void>;

    protected abstract startDatabases(): Promise<any[]>;

    protected abstract loadDynamicConfig(): Promise<any>;

    protected abstract stopDatabases(): Promise<any[]>;

    protected abstract createAppBuilder(): Promise<DefaultAppBuilder>;

    protected abstract createTaskManager(): Promise<DefaultTaskManager>;
}

export default Application;
export { DefaultAppBuilder, AppServer };
