import App, { AppInfo } from '@dfgpublicidade/node-app-module';
import { DefaultTaskManager, TaskServer } from '@dfgpublicidade/node-tasks-module';
import cfg from 'config';
import appDebugger from 'debug';
import AppServer from './server/appServer';
import DefaultAppBuilder from './server/defaultAppBuilder';

const config: any = { ...cfg };

/* Module */
let appServer: AppServer;
let taskServer: TaskServer;

const debug: appDebugger.IDebugger = appDebugger('module:app');

abstract class Application {
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

            debug('Starting databases...');
            await this.startDatabases();

            this.app = new App({
                appInfo: this.appInfo,
                config
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

        await appServer.start(config);

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

    protected abstract stopDatabases(): Promise<any[]>;

    protected abstract createAppBuilder(): Promise<DefaultAppBuilder>;

    protected abstract createTaskManager(): Promise<DefaultTaskManager>;
}

export default Application;
export { DefaultAppBuilder, AppServer };
