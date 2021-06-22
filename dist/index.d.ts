import App, { AppInfo } from '@dfgpublicidade/node-app-module';
import { DefaultTaskManager } from '@dfgpublicidade/node-tasks-module';
import { Db } from 'mongodb';
import AppServer from './server/appServer';
import DefaultAppBuilder from './server/defaultAppBuilder';
import TaskServer from './server/taskServer';
declare abstract class Application {
    protected appInfo: AppInfo;
    protected connectionName: string;
    protected db: Db;
    protected app: App;
    start(): Promise<(AppServer | TaskServer)[]>;
    protected runStartupScripts(): Promise<void>;
    protected setComplAppInfo(): Promise<void>;
    protected startTranslation(): Promise<void>;
    protected startDatabases(): Promise<any[]>;
    protected stopDatabases(): Promise<any[]>;
    protected createAppBuilder(): Promise<DefaultAppBuilder>;
    protected createTaskManager(): Promise<DefaultTaskManager>;
    private startAppServer;
    private startTaskServer;
}
export default Application;
export { DefaultAppBuilder, AppServer, TaskServer };
