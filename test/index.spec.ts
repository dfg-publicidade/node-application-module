import App from '@dfgpublicidade/node-app-module';
import { DefaultTaskManager, Task } from '@dfgpublicidade/node-tasks-module';
import Util from '@dfgpublicidade/node-util-module';
import chai, { expect } from 'chai';
import { NextFunction, Request, Response, Router } from 'express';
import { after, before, describe, it } from 'mocha';
import * as sinon from 'sinon';
import WebSocket from 'ws';
import Application, { DefaultAppBuilder } from '../src';

import ChaiHttp = require('chai-http');

/* Tests */
class DataBase1 {
    private static connected: boolean = false;

    public static async connect(): Promise<void> {
        this.connected = true;
        return Promise.resolve();
    }

    public static async close(): Promise<void> {
        this.connected = false;
        return Promise.resolve();
    }

    public static isConnected(): boolean {
        return this.connected;
    }
}

class DataBase2 {
    private static connected: boolean = false;

    public static async connect(): Promise<void> {
        this.connected = true;
        return Promise.resolve();
    }

    public static async close(): Promise<void> {
        this.connected = false;
        return Promise.resolve();
    }

    public static isConnected(): boolean {
        return this.connected;
    }
}

class AppBuilder extends DefaultAppBuilder {
    public dependenciesLoaded: boolean = false;
    public interceptorsLoaded: boolean = false;
    public parsersLoaded: boolean = false;
    public routingLoaded: boolean = false;
    public additionalControllersLoaded: boolean = false;
    public errorHandlingLoaded: boolean = false;

    public constructor(app: App) {
        super(app);
    }

    public getExpress(): any {
        return this.express;
    }

    protected setDependencies(): void {
        this.dependenciesLoaded = true;
    }

    protected setInterceptions(): void {
        this.express.use(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            res.setHeader('intercepted', 'true');

            next();
        });

        this.interceptorsLoaded = true;
    }

    protected setParsers(): void {
        this.parsersLoaded = true;
    }

    protected setRouting(): void {
        this.express.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            res.end();
        });

        this.createRouter('sys', (app: App, router: Router): void => {
            router.get('/sys-test', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
                res.end();
            });
        });
        this.createRouter('crp', (app: App, router: Router): void => {
            router.get('/crp-test', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
                res.end();
            });
        });

        this.routingLoaded = true;
    }

    protected setAdditionalControllers(): void {
        this.express.get('/other', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            res.end();
        });

        if ((this.express as any).ws) {
            (this.express as any).ws('/ws', async (ws: WebSocket, req: Request): Promise<void> => {
                ws.on('message', (message: string): void => {
                    ws.send(message);
                });
            });
        }

        this.express.get('/error', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            next(new Error('Error'));
        });

        this.additionalControllersLoaded = true;
    }

    protected setErrorHandling(): void {
        this.express.use((error: any, req: Request, res: Response, next: NextFunction): void => {
            // eslint-disable-next-line no-magic-numbers
            res.status(500);
            res.json(error.message);
        });

        this.errorHandlingLoaded = true;
    }
}

class TaskManager extends DefaultTaskManager {
    public started: boolean = false;

    public async init(): Promise<void> {
        this.started = true;
        return Promise.resolve();
    }
    public async load(moduleName: string): Promise<any> {
        return {
            default: {
                do: async (): Promise<string> => Promise.resolve('Done!')
            }
        };
    }
    public async cancelRunningTasks(): Promise<void> {
        return Promise.resolve();
    }
    public async generateDefaultTasks(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    public async getNext(): Promise<Task> {
        throw new Error('Method not implemented.');
    }
    public async update(task: Task, data: any): Promise<Task> {
        throw new Error('Method not implemented.');
    }
    public async sendToSolved(task: Task): Promise<Task> {
        throw new Error('Method not implemented.');
    }
    public async delete(task: Task): Promise<void> {
        throw new Error('Method not implemented.');
    }
    public async cloneTask(task: Task): Promise<Task> {
        throw new Error('Method not implemented.');
    }
    public async afterTask(result?: any): Promise<void> {
        throw new Error('Method not implemented.');
    }
    public async afterCron(result?: any): Promise<void> {
        throw new Error('Method not implemented.');
    }
    public getMethod(task?: any): string {
        throw new Error('Method not implemented.');
    }
    public getStatus(task?: any): string {
        throw new Error('Method not implemented.');
    }
    public isRunning(task?: any): boolean {
        throw new Error('Method not implemented.');
    }
    public getParameters(task?: any): any {
        throw new Error('Method not implemented.');
    }
    public getInterval(task?: any): number {
        throw new Error('Method not implemented.');
    }
    public isPersistent(task?: any): boolean {
        throw new Error('Method not implemented.');
    }
}

class TestApplication extends Application {
    public flag: 'mustFail' | 'taskServer' | 'websocket' | 'development';

    public scriptsLoaded: boolean = false;
    public translationLoaded: boolean = false;

    public appBuilder: AppBuilder;
    public taskManager: TaskManager;

    public constructor(flag?: 'mustFail' | 'taskServer' | 'websocket' | 'development') {
        super();
        this.flag = flag;
    }

    public getApp(): App {
        return this.app;
    }

    protected async runStartupScripts(): Promise<void> {
        process.env.APP_NAME = 'sys';
        process.env.APP_VERSION = 'v1';

        if (this.flag === 'mustFail') {
            throw new Error('Error');
        }

        if (this.flag === 'taskServer') {
            this.appInfo.taskServer = true;
        }

        if (this.flag === 'development') {
            process.env.NODE_ENV = 'development';
        }

        this.scriptsLoaded = true;

        return Promise.resolve();
    }

    protected async startDatabases(): Promise<any[]> {
        return Promise.all([
            DataBase1.connect(),
            DataBase2.connect()
        ]);
    }

    protected async setComplAppInfo(): Promise<void> {
        this.app.add('connectionName', 'test');

        if (this.flag === 'websocket') {
            this.app.config.websocket = {
                enabled: true
            };
        }

        return Promise.resolve();
    }

    protected async startTranslation(): Promise<void> {
        this.translationLoaded = true;

        return Promise.resolve();
    }

    protected async stopDatabases(): Promise<any[]> {
        return Promise.all([
            DataBase1.close(),
            DataBase2.close()
        ]);
    }

    protected async createAppBuilder(): Promise<AppBuilder> {
        this.appBuilder = new AppBuilder(this.app);
        return Promise.resolve(this.appBuilder);
    }

    protected async createTaskManager(): Promise<TaskManager> {
        this.taskManager = new TaskManager();
        return Promise.resolve(this.taskManager);
    }
}

chai.use(ChaiHttp);

describe('index.ts', (): void => {
    let logMsg: string = '';
    // eslint-disable-next-line no-console
    const err: (msg: string) => void = console.error;

    before(async (): Promise<void> => {
        // eslint-disable-next-line no-console
        console.error = (msg: string): void => {
            logMsg = msg;
        };

        sinon.stub(process, 'exit');
    });

    after(async (): Promise<void> => {
        // eslint-disable-next-line no-console
        console.error = err;
        sinon.restore();
    });

    it('1. start', async (): Promise<void> => {
        const app: TestApplication = new TestApplication('mustFail');

        try {
            await app.start();
        }
        catch (error: any) {
            //
        }

        expect(app.scriptsLoaded).to.be.eq(false);
        expect(DataBase1.isConnected()).to.be.eq(false);
        expect(DataBase2.isConnected()).to.be.eq(false);
        expect(app.getApp()).to.be.undefined;
        expect(app.translationLoaded).to.be.eq(false);
        expect(app.appBuilder).to.be.undefined;
        expect(app.taskManager).to.be.undefined;
        expect(logMsg).to.be.eq('Error');

        logMsg = undefined;
    });

    it('2. start', async (): Promise<void> => {
        const app: TestApplication = new TestApplication();
        const servers: any[] = await app.start();

        expect(app.scriptsLoaded).to.be.eq(true);
        expect(DataBase1.isConnected()).to.be.eq(true);
        expect(DataBase2.isConnected()).to.be.eq(true);
        expect(app.getApp().get('connectionName')).to.be.eq('test');
        expect(app.translationLoaded).to.be.eq(true);
        expect(app.taskManager).to.be.undefined;
        expect(logMsg).to.be.undefined;

        expect(app.appBuilder).to.have.property('dependenciesLoaded').eq(true);
        expect(app.appBuilder).to.have.property('interceptorsLoaded').eq(true);
        expect(app.appBuilder).to.have.property('parsersLoaded').eq(true);
        expect(app.appBuilder).to.have.property('routingLoaded').eq(true);
        expect(app.appBuilder).to.have.property('additionalControllersLoaded').eq(true);
        expect(app.appBuilder).to.have.property('errorHandlingLoaded').eq(true);

        let res: ChaiHttp.Response = await chai.request(servers[0].getHttpServer()).keepOpen().get('/');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res).header('intercepted', 'true');

        res = await chai.request(servers[0].getHttpServer()).keepOpen().get('/sys-test');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res).header('intercepted', 'true');

        res = await chai.request(servers[0].getHttpServer()).keepOpen().get('/crp-test');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(404);

        res = await chai.request(servers[0].getHttpServer()).keepOpen().get('/other');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res).header('intercepted', 'true');

        res = await chai.request(servers[0].getHttpServer()).keepOpen().get('/error');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(500);
        expect(res.body).to.be.eq('Error');

        try {
            await app.start();
        }
        catch (error: any) {
            //
        }

        // eslint-disable-next-line no-magic-numbers
        await Util.delay(500);

        expect(logMsg).to.have.property('code').eq('EADDRINUSE');

        logMsg = undefined;

        for (const server of servers) {
            server.close();
        }
    });

    it('3. start', async (): Promise<void> => {
        const app: TestApplication = new TestApplication('websocket');
        const servers: any[] = await app.start();

        expect(app.scriptsLoaded).to.be.eq(true);
        expect(DataBase1.isConnected()).to.be.eq(true);
        expect(DataBase2.isConnected()).to.be.eq(true);
        expect(app.getApp().get('connectionName')).to.be.eq('test');
        expect(app.translationLoaded).to.be.eq(true);
        expect(app.taskManager).to.be.undefined;
        expect(logMsg).to.be.undefined;

        expect(app.appBuilder).to.have.property('dependenciesLoaded').eq(true);
        expect(app.appBuilder).to.have.property('interceptorsLoaded').eq(true);
        expect(app.appBuilder).to.have.property('parsersLoaded').eq(true);
        expect(app.appBuilder).to.have.property('routingLoaded').eq(true);
        expect(app.appBuilder).to.have.property('additionalControllersLoaded').eq(true);
        expect(app.appBuilder).to.have.property('errorHandlingLoaded').eq(true);

        let res: ChaiHttp.Response = await chai.request(servers[0].getHttpServer()).keepOpen().get('/');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res).header('intercepted', 'true');

        res = await chai.request(servers[0].getHttpServer()).keepOpen().get('/sys-test');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res).header('intercepted', 'true');

        res = await chai.request(servers[0].getHttpServer()).keepOpen().get('/crp-test');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(404);

        res = await chai.request(servers[0].getHttpServer()).keepOpen().get('/other');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res).header('intercepted', 'true');

        res = await chai.request(servers[0].getHttpServer()).keepOpen().get('/error');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(500);
        expect(res.body).to.be.eq('Error');

        const socket: WebSocket = new WebSocket('ws://localhost:3000/ws');

        let socketMessage: string;
        socket.once('message', (message: string): void => {
            socketMessage = JSON.parse(message);
        });

        await new Promise((resolve: (value?: any) => void): WebSocket => socket.once('open', (): void => {
            socket.send(JSON.stringify('test'));
            resolve();
        }));

        // eslint-disable-next-line no-magic-numbers
        await Util.delay(500);

        expect(socketMessage).to.be.eq('test');

        socket.close();

        for (const server of servers) {
            server.close();
        }
    });

    it('4. start', async (): Promise<void> => {
        const app: TestApplication = new TestApplication('development');
        const servers: any[] = await app.start();

        expect(app.scriptsLoaded).to.be.eq(true);
        expect(DataBase1.isConnected()).to.be.eq(true);
        expect(DataBase2.isConnected()).to.be.eq(true);
        expect(app.getApp().get('connectionName')).to.be.eq('test');
        expect(app.translationLoaded).to.be.eq(true);
        expect(app.taskManager).to.be.undefined;
        expect(logMsg).to.be.undefined;

        expect(app.appBuilder).to.have.property('dependenciesLoaded').eq(true);
        expect(app.appBuilder).to.have.property('interceptorsLoaded').eq(true);
        expect(app.appBuilder).to.have.property('parsersLoaded').eq(true);
        expect(app.appBuilder).to.have.property('routingLoaded').eq(true);
        expect(app.appBuilder).to.have.property('additionalControllersLoaded').eq(true);
        expect(app.appBuilder).to.have.property('errorHandlingLoaded').eq(true);

        let res: ChaiHttp.Response = await chai.request(servers[0].getHttpServer()).keepOpen().get('/sys/v1/');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res).header('intercepted', 'true');

        res = await chai.request(servers[0].getHttpServer()).keepOpen().get('/sys/v1/sys-test');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res).header('intercepted', 'true');

        res = await chai.request(servers[0].getHttpServer()).keepOpen().get('/sys/v1/crp-test');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(404);

        res = await chai.request(servers[0].getHttpServer()).keepOpen().get('/other');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res).header('intercepted', 'true');

        res = await chai.request(servers[0].getHttpServer()).keepOpen().get('/error');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(500);
        expect(res.body).to.be.eq('Error');

        for (const server of servers) {
            server.close();
        }

        process.env.NODE_ENV = 'test';
    });

    it('5. start', async (): Promise<void> => {
        const app: TestApplication = new TestApplication('taskServer');
        const servers: any[] = await app.start();

        expect(app.scriptsLoaded).to.be.eq(true);
        expect(DataBase1.isConnected()).to.be.eq(true);
        expect(DataBase2.isConnected()).to.be.eq(true);
        expect(app.getApp().get('connectionName')).to.be.eq('test');
        expect(app.translationLoaded).to.be.eq(true);
        expect(app.appBuilder).to.be.undefined;
        expect(logMsg).to.be.undefined;

        expect(app.taskManager).to.have.property('started').eq(true);

        for (const server of servers) {
            server.terminate();
        }
    });
});
