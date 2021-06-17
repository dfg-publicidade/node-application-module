"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_handler_module_1 = require("@dfgpublicidade/node-handler-module");
const node_util_module_1 = __importDefault(require("@dfgpublicidade/node-util-module"));
const debug_1 = __importDefault(require("debug"));
const express_ws_1 = __importDefault(require("express-ws"));
const http_1 = __importDefault(require("http"));
/* Module */
const debug = debug_1.default('module:server');
class AppServer {
    constructor(appBuilder) {
        this.appBuilder = appBuilder;
    }
    async start(config) {
        debug('Starting server');
        const port = node_util_module_1.default.normalizePort(process.env.HTTP_PORT || config.api.port || '3000');
        const express = this.appBuilder.build();
        express.set('port', port);
        this.httpServer = http_1.default.createServer(express);
        this.httpServer.on('error', (error) => {
            node_handler_module_1.serverErrorHandle(error, port);
        });
        this.httpServer.on('listening', () => {
            const addr = this.httpServer.address();
            debug(`Listening ${node_util_module_1.default.parsePort(addr.port)}`);
        });
        express_ws_1.default(express, this.httpServer, config.websocket);
        this.httpServer.listen(port);
        return Promise.resolve();
    }
    async close() {
        debug('Terminating server');
        return new Promise((resolve, reject) => {
            this.httpServer.close(resolve);
        });
    }
    getHttpServer() {
        return this.httpServer;
    }
}
exports.default = AppServer;
