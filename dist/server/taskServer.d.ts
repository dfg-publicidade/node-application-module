import App from '@dfgpublicidade/node-app-module';
import { DefaultTaskManager } from '@dfgpublicidade/node-tasks-module';
import { CronJob } from 'cron';
declare class TaskServer {
    private app;
    private taskManager;
    private afterTask;
    private afterCron;
    private cron;
    private runner;
    constructor(app: App, taskManager: DefaultTaskManager, afterTask?: (result?: any) => Promise<any>, afterCron?: (result?: any) => Promise<any>);
    start(): Promise<void>;
    terminate(): Promise<void>;
    getCron(): CronJob;
    private nextTask;
    private cronFinish;
}
export default TaskServer;
