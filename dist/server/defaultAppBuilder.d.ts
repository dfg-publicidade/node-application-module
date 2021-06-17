import App from '@dfgpublicidade/node-app-module';
import { Application, Router } from 'express-ws';
declare abstract class AppBuilder {
    protected express: Application;
    protected app: App;
    constructor(app: App);
    build(): Application;
    protected createRouter(app: App, endpointGroup: string, routerSetup: (app: App, router: Router) => void): void;
    protected abstract setDependences(): void;
    protected abstract setInterceptions(): void;
    protected abstract setParsers(): void;
    protected abstract setRouting(app: App): void;
    protected abstract setErrorHandling(app: App): void;
}
export default AppBuilder;
