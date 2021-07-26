import App, { AppInfo } from '@dfgpublicidade/node-app-module';
import { DefaultTaskManager, TaskServer } from '@dfgpublicidade/node-tasks-module';
import AppServer from './server/appServer';
import DefaultAppBuilder from './server/defaultAppBuilder';
declare abstract class Application {
    protected config: any;
    protected appInfo: AppInfo;
    protected app: App;
    start(): Promise<(AppServer | TaskServer)[]>;
    private startAppServer;
    private startTaskServer;
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
