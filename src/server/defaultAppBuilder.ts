import App from '@dfgpublicidade/node-app-module';
import { CacheController, RootController, StatusController } from '@dfgpublicidade/node-controllers-module';
import appDebugger from 'debug';
import express from 'express';
import expressWs, { Application, Router } from 'express-ws';

/* Module */
const debug: appDebugger.IDebugger = appDebugger('module:app-builder');

abstract class AppBuilder {
    protected express: Application;
    protected app: App;

    public constructor(app: App) {
        this.app = app;
    }

    public build(): Application {
        debug('Building application');

        this.express = expressWs(express()).app;

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

            router.options('/status', StatusController.options(this.app, 'GET'));
            router.get('/status', StatusController.view(this.app));

            router.options('/cache', CacheController.options(app, 'DELETE'));
            router.delete('/cache', CacheController.clean(app));

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
}

export default AppBuilder;
