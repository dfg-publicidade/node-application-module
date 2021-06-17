import { serverErrorHandle } from '@dfgpublicidade/node-handler-module';
import Util from '@dfgpublicidade/node-util-module';
import appDebugger from 'debug';
import { Application } from 'express';
import expressWs from 'express-ws';
import http from 'http';
import AppBuilder from './defaultAppBuilder';

/* Module */
const debug: appDebugger.IDebugger = appDebugger('module:server');

class AppServer {
    private appBuilder: AppBuilder;
    private httpServer: http.Server;

    public constructor(appBuilder: AppBuilder) {
        this.appBuilder = appBuilder;
    }

    public async start(config: any): Promise<void> {
        debug('Starting server');

        const port: number | string = Util.normalizePort(process.env.HTTP_PORT || config.api.port || '3000');

        const express: Application = this.appBuilder.build();

        express.set('port', port);

        this.httpServer = http.createServer(express);

        this.httpServer.on('error', (error: any): void => {
            serverErrorHandle(error, port);
        });

        this.httpServer.on('listening', (): void => {
            const addr: any = this.httpServer.address();
            debug(`Listening ${Util.parsePort(addr.port)}`);
        });

        expressWs(express, this.httpServer, config.websocket);

        this.httpServer.listen(port);

        return Promise.resolve();
    }

    public async close(): Promise<void> {
        debug('Terminating server');

        return new Promise((resolve: () => void, reject: () => void): void => {
            this.httpServer.close(resolve);
        });
    }

    public getHttpServer(): http.Server {
        return this.httpServer;
    }
}

export default AppServer;
