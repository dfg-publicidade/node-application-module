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

        this.setRouting(this.app);

        this.setErrorHandling(this.app);

        debug('Application started');

        return this.express;
    }

    protected createRouter(app: App, endpointGroup: string, routerSetup: (app: App, router: Router) => void): void {
        debug('Enabling routing');

        if (app.info.name === 'base' || app.info.name === endpointGroup) {
            const router: Router = express.Router();

            router.options('/', RootController.options(this.app, 'GET'));
            router.get('/', RootController.main());

            router.options('/cache', CacheController.options(app, 'DELETE'));
            router.delete('/cache', CacheController.clean(app));

            this.setAdditionalControllers(app, router);

            routerSetup(app, router);

            this.express.use(
                process.env.NODE_ENV !== 'development'
                    ? '/'
                    : `/${endpointGroup}/${app.info.version}`
                , router
            );
        }
    }

    protected abstract setDependences(): void;

    protected abstract setInterceptions(): void;

    protected abstract setParsers(): void;

    protected abstract setRouting(app: App): void;

    protected abstract setErrorHandling(app: App): void;

    protected abstract setAdditionalControllers(app: App, router: Router): void;
}

export default DefaultAppBuilder;
