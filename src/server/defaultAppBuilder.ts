import App from '@dfgpublicidade/node-app-module';
import { CacheController, RootController } from '@dfgpublicidade/node-controllers-module';
import appDebugger from 'debug';
import express, { Application, Router } from 'express';
import expressWs from 'express-ws';

/* Module */
const debug: appDebugger.IDebugger = appDebugger('module:app-builder');

abstract class DefaultAppBuilder {
    protected express: Application;
    protected app: App;
    protected router: Router;

    public constructor(app: App) {
        this.app = app;
    }

    public build(): Application {
        debug('Building application');

        this.express = this.app.config.websocket.enabled
            ? expressWs(express()).app
            : express();

        this.setDependences();
        this.setInterceptions();
        this.setParsers();

        this.setRouting();

        this.setErrorHandling();

        debug('Application started');

        return this.express;
    }

    protected createRouter(endpointGroup: string, routerSetup: (app: App, router: Router) => void): void {
        debug('Enabling routing');

        if (this.app.info.name === 'base' || this.app.info.name === endpointGroup) {
            this.router = express.Router();

            this.router.options('/', RootController.options(this.app, 'GET'));
            this.router.get('/', RootController.main());

            this.router.options('/cache', CacheController.options(this.app, 'DELETE'));
            this.router.delete('/cache', CacheController.clean(this.app));

            this.setAdditionalControllers();

            routerSetup(this.app, this.router);

            this.express.use(
                process.env.NODE_ENV !== 'development'
                    ? '/'
                    : `/${endpointGroup}/${this.app.info.version}`
                , this.router
            );
        }
    }

    protected abstract setDependences(): void;

    protected abstract setInterceptions(): void;

    protected abstract setParsers(): void;

    protected abstract setRouting(): void;

    protected abstract setAdditionalControllers(): void;

    protected abstract setErrorHandling(): void;
}

export default DefaultAppBuilder;
