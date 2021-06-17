/// <reference types="node" />
import http from 'http';
import AppBuilder from './defaultAppBuilder';
declare class AppServer {
    private appBuilder;
    private httpServer;
    constructor(appBuilder: AppBuilder);
    start(config: any): Promise<void>;
    close(): Promise<void>;
    getHttpServer(): http.Server;
}
export default AppServer;
