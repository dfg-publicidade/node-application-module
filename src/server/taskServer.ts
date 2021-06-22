import App from '@dfgpublicidade/node-app-module';
import Result from '@dfgpublicidade/node-result-module';
import { DefaultTaskManager, Runner } from '@dfgpublicidade/node-tasks-module';
import Task from '@dfgpublicidade/node-tasks-module/dist/interfaces/task';
import { CronJob } from 'cron';
import appDebugger from 'debug';

/* Module */
const debug: appDebugger.IDebugger = appDebugger('module:server');

class TaskServer {
    private app: App;
    private taskManager: DefaultTaskManager;
    private cron: CronJob;
    private runner: Runner;

    public constructor(app: App, taskManager: DefaultTaskManager) {
        debug('Building task server');

        this.app = app;
        this.taskManager = taskManager;

        this.runner = new Runner();

        this.cron = new CronJob(
            app.config.tarefas.periodo,
            async (): Promise<void> => this.nextTask(),
            async (): Promise<void> => this.cronFinish(),
            false,
            process.env.TZ
        );
    }

    public async start(): Promise<void> {
        debug('Starting task server');

        try {
            debug('Creating default tasks');

            await this.taskManager.init();

            await this.taskManager.cancelRunningTasks();

            if (this.app.config.tasks.createDefaultTasks) {
                await this.taskManager.generateDefaultTasks();
            }

            try {
                debug('Starting cron service');
                this.cron.start();
                return Promise.resolve();
            }
            catch (ex) {
                debug('An error has occurred when starting cron service');
                return Promise.reject(ex);
            }
        }
        catch (error) {
            debug('An error has occurred when creating the default tasks');
            return Promise.reject(error);
        }
    }

    public async terminate(): Promise<void> {
        debug('Terminating cron service');
        this.cron.stop();
    }

    public getCron(): CronJob {
        return this.cron;
    }

    private async nextTask(): Promise<void> {
        try {
            let task: Task = await this.taskManager.getNext();

            if (!task) {
                return this.taskManager.afterTask(undefined);
            }
            else {
                let status: string;
                let result: Result;
                let taskError: any;

                try {
                    debug('Task found, running...');

                    result = await this.runner.run(this.app, task);
                    status = 'SUCCESS';

                    debug('Task performed successfully');
                }
                catch (error) {
                    debug('An error has occurred when running task');

                    status = 'ERROR';
                    taskError = error;
                }

                try {
                    task = await this.taskManager.update(task, {
                        status,
                        error: taskError,
                        termino: new Date(),
                        resultado: result
                    });

                    await this.taskManager.sendToSolved(task);

                    await this.taskManager.delete(task);
                }
                catch (error) {
                    debug('An error was occurred when updating the status of the finished task');
                    return this.taskManager.afterTask(error);
                }

                if (task.getInterval() && (status === 'SUCCESS' || task.isPersistent())) {
                    debug('The task must be replicated. Cloning...');

                    try {
                        const clonedTask: Task = await this.taskManager.cloneTask(task);
                        return this.taskManager.afterTask(clonedTask);
                    }
                    catch (error) {
                        debug('An error has occurred when replicating the task');
                        return this.taskManager.afterTask(error);
                    }
                }
                else {
                    return this.taskManager.afterTask(task);
                }
            }
        }
        catch (error) {
            debug('An error has occurred when searching for new tasks');
            this.taskManager.afterTask(error);
        }
    }

    private async cronFinish(): Promise<void> {
        debug('Task server is finished');
        return this.taskManager.afterCron();
    }
}

export default TaskServer;
