import App, { AppInfo } from '@dfgpublicidade/node-app-module';
import Files from '@dfgpublicidade/node-files-module';
import { DefaultTaskManager } from '@dfgpublicidade/node-tasks-module';
import appRoot from 'app-root-path';
import cfg from 'config';
import AppServer from './server/appServer';
import DefaultAppBuilder from './server/defaultAppBuilder';
import TaskServer from './server/taskServer';

const config: any = { ...cfg };

/* Module */
let appServer: AppServer;
let taskServer: TaskServer;

abstract class Application {
    protected appInfo: AppInfo;
    protected app: App;

    public async start(): Promise<(AppServer | TaskServer)[]> {
        try {
            this.appInfo = await Files.getJson(`${appRoot}/app.json`);

            await this.runStartupScripts();

            await this.startDatabases();

            this.app = new App({
                appInfo: this.appInfo,
                config
            });

            await this.setComplAppInfo();

            await this.startTranslation();

            const servers: Promise<(AppServer | TaskServer)>[] = [];

            if (!this.app.info.taskServer) {
                servers.push(this.startAppServer());
            }

            if (this.app.info.taskServer) {
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

    protected async runStartupScripts(): Promise<void> {
        //
    }

    protected async setComplAppInfo(): Promise<void> {
        //
    }

    protected async startTranslation(): Promise<void> {
        //
    }

    protected async startDatabases(): Promise<any[]> {
        return Promise.resolve([]);
    }

    protected async stopDatabases(): Promise<any[]> {
        return Promise.resolve([]);
    }

    protected async createAppBuilder(): Promise<DefaultAppBuilder> {
        return Promise.reject();
    }

    protected async createTaskManager(): Promise<DefaultTaskManager> {
        return Promise.reject();
    }

    private async startAppServer(): Promise<AppServer> {
        if (appServer) {
            return Promise.resolve(appServer);
        }

        const appBuilder: DefaultAppBuilder = await this.createAppBuilder();
        appServer = new AppServer(appBuilder);

        await appServer.start(config);

        return Promise.resolve(appServer);
    }

    private async startTaskServer(): Promise<TaskServer> {
        if (taskServer) {
            return Promise.resolve(taskServer);
        }

        taskServer = new TaskServer(this.app, await this.createTaskManager());

        await taskServer.start();

        return Promise.resolve(taskServer);
    }
}

export default Application;
export { DefaultAppBuilder, AppServer, TaskServer };
