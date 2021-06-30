import chai from 'chai';
import { describe } from 'mocha';
import { default as DefaultApplication } from '../src';
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

class Application extends DefaultApplication {
    public status: 'CREATED' | 'STARTED' | 'APPINFO-OK' | 'TRANSLATION-OK' | 'DATABASES-OK' | 'DATABASES-OFF' | 'APPBUILDER-OK' | 'TASKMANAGER-OK';

    public constructor() {
        super();
        this.status = 'CREATED';
    }

    protected async runStartupScripts(): Promise<void> {
        this.status = 'STARTED';
    }

    protected async startDatabases(): Promise<any[]> {
        return Promise.all([
            DataBase1.connect(),
            DataBase2.connect()
        ]);
    }

    protected async setComplAppInfo(): Promise<void> {
        this.connectionName = 'test';
        this.db = MongoManager.getClient().db(config.mongodb.dbname);
    }

    protected async startTranslation(): Promise<void> {
        //
    }

    

    protected async stopDatabases(): Promise<any[]> {
        return Promise.resolve([
            MongoManager.close(),
            TypeOrmManager.close(config.typeorm.name)
        ]);
    }

    protected async createAppBuilder(): Promise<AppBuilder> {
        return Promise.resolve(new AppBuilder(this.app));
    }

    protected async createTaskManager(): Promise<TaskManager> {
        return Promise.resolve(new TaskManager(this.app));
    }
}

chai.use(ChaiHttp);

describe('index.ts', (): void => {
    // let exp: Express;
    // let app: App;
    // let httpServer: http.Server;

    // before(async (): Promise<void> => {
    //     exp = express();
    //     const port: number = 3000;

    //     exp.set('port', port);

    //     httpServer = http.createServer(exp);

    //     app = new App({
    //         appInfo: {
    //             name: 'test',
    //             version: 'v1'
    //         },
    //         config: {
    //             api: {
    //                 allowedHeaders: 'Content-Type, Authorization, Content-Length, X-Requested-With, Client_ID, Ensure-security, Cache-control, Pragma, Expires'
    //             },
    //             security: {
    //                 encodeKey: '123456'
    //             }
    //         },
    //         connectionName: '',
    //         db: undefined
    //     });

    //     exp.options('/', TestController.options(app, 'GET'));

    //     data = {
    //         name: 'Test A',
    //         _id: new ObjectId().toHexString(),
    //         code: Security.encodeId(app.config.security.encodeKey, 1),
    //         qtty: '1',
    //         value: '10.5',
    //         init: '01/01/2021',
    //         created_at: '01/01/2021 10:00',
    //         active: 'true'
    //     };

    //     return new Promise<void>((
    //         resolve: () => void
    //     ): void => {
    //         httpServer.listen(port, (): void => {
    //             resolve();
    //         });
    //     });
    // });

    // after(async (): Promise<void> => new Promise<void>((
    //     resolve: () => void
    // ): void => {
    //     httpServer.close((): void => {
    //         resolve();
    //     });
    // }));

    // it('1. options', async (): Promise<void> => {
    //     const res: ChaiHttp.Response = await chai.request(exp).keepOpen().options('/');

    //     // eslint-disable-next-line no-magic-numbers
    //     expect(res).to.have.status(200);
    //     expect(res.header['access-control-allow-methods']).to.be.eq('GET');
    //     expect(res.header['access-control-allow-headers']).to.be.eq(app.config.api.allowedHeaders);
    // });
});
