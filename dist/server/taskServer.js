"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_tasks_module_1 = require("@dfgpublicidade/node-tasks-module");
const cron_1 = require("cron");
const debug_1 = __importDefault(require("debug"));
/* Module */
const debug = debug_1.default('module:task-server');
class TaskServer {
    constructor(app, taskManager) {
        debug('Building task server');
        this.app = app;
        this.taskManager = taskManager;
        this.runner = new node_tasks_module_1.Runner();
        this.cron = new cron_1.CronJob(app.config.tasks.period, async () => this.nextTask(), async () => this.cronFinish(), false, process.env.TZ);
    }
    async start() {
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
    async terminate() {
        debug('Terminating cron service');
        this.cron.stop();
    }
    getCron() {
        return this.cron;
    }
    async nextTask() {
        try {
            let task = await this.taskManager.getNext();
            if (!task) {
                return this.taskManager.afterTask(undefined);
            }
            else {
                let status;
                let result;
                let taskError;
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
                        const clonedTask = await this.taskManager.cloneTask(task);
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
    async cronFinish() {
        debug('Task server is finished');
        return this.taskManager.afterCron();
    }
}
exports.default = TaskServer;
