import { DefaultTaskManager } from '@dfgpublicidade/node-tasks-module';
import AppServer from './server/appServer';
import DefaultAppBuilder from './server/defaultAppBuilder';
import TaskServer from './server/taskServer';
declare abstract class Application {
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
