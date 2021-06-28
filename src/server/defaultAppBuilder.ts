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

    protected createRouter(endpointGroup: string, routerSetup: (router: Router) => void): void {
        debug('Enabling routing');

        if (this.app.info.name === 'base' || this.app.info.name === endpointGroup) {
            const router: Router = express.Router();

            router.options('/', RootController.options(this.app, 'GET'));
            router.get('/', RootController.main());

            router.options('/cache', CacheController.options(this.app, 'DELETE'));
            router.delete('/cache', CacheController.clean(this.app));

            this.setAdditionalControllers();

            routerSetup(router);

            this.express.use(
                process.env.NODE_ENV !== 'development'
                    ? '/'
                    : `/${endpointGroup}/${this.app.info.version}`
                , router
            );
        }
    }

    protected abstract setDependences(): void;

    protected abstract setInterceptions(): void;

    protected abstract setParsers(): void;

    protected abstract setRouting(): void;

    protected abstract setErrorHandling(): void;

    protected abstract setAdditionalControllers(): void;
}

export default DefaultAppBuilder;
