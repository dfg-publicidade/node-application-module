import App from '@dfgpublicidade/node-app-module';
import { Application, Router } from 'express';
declare abstract class DefaultAppBuilder {
    protected express: Application;
    protected app: App;
    protected router: Router;
    constructor(app: App);
    build(): Application;
    protected createRouter(endpointGroup: string, routerSetup: (app: App, router: Router) => void): void;
    protected abstract setDependences(): void;
    protected abstract setInterceptions(): void;
    protected abstract setParsers(): void;
    protected abstract setRouting(): void;
    protected abstract setErrorHandling(): void;
    protected abstract setAdditionalControllers(): void;
}
export default DefaultAppBuilder;
