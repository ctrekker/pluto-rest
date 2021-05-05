const http = require('http');
const msgpack = require('./msgpack');

const VERSION = 'v1';
const DEFAULT_HOST = 'localhost:1234';

function evaluate(output, inputs, filename, host=DEFAULT_HOST) {
    return new Promise((resolve, reject) => {
        const requestBody = msgpack.pack({
            inputs, outputs: [output]
        });

        const req = http.request(`http://${host}/${VERSION}/notebook/${encodeURIComponent(filename)}/eval`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-msgpack',
                'Accept': 'application/x-msgpack'
            }
        }, (res) => {
            let rawResponseBody = [];
            res.on('data', (chunk) => {
                rawResponseBody.push(chunk);
            });
            res.on('end', () => {
                if(res.statusCode >= 300) {
                    reject(new Error(Buffer.concat(rawResponseBody).toString()));
                }
                else {
                    const responseBody = msgpack.unpack(new Uint8Array(Buffer.concat(rawResponseBody)));
                    resolve(responseBody[output]);
                }
            });
        });

        req.write(requestBody);
        req.end();

        req.on('error', reject);
    });
}

function call(symbol, args, kwargs, filename, host=DEFAULT_HOST) {
    return new Promise((resolve, reject) => {
        const requestBody = msgpack.pack({
            function: symbol,
            args, kwargs
        });

        const req = http.request(`http://${host}/${VERSION}/notebook/${encodeURIComponent(filename)}/call`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-msgpack',
                'Accept': 'application/x-msgpack'
            }
        }, (res) => {
            let rawResponseBody = [];
            res.on('data', (chunk) => {
                rawResponseBody.push(chunk);
            });
            res.on('end', () => {
                if(res.statusCode >= 300) {
                    reject(new Error(Buffer.concat(rawResponseBody).toString()));
                }
                else {
                    const responseBody = msgpack.unpack(new Uint8Array(Buffer.concat(rawResponseBody)));
                    resolve(responseBody);
                }
            });
        });

        req.write(requestBody);
        req.end();

        req.on('error', reject);
    });
}

function PlutoNotebook(filename, host=DEFAULT_HOST) {
    const baseHandler = (inputs={}) => ({
        get: (target, prop, receiver) => {
            return new Promise((resolve, reject) => {
                evaluate(prop, inputs, filename, host)
                    .then(result => resolve(result))
                    .catch(err => {
                        if(err.message && err.message.includes('function')) {
                            resolve(PlutoCallable(prop, filename, host));
                        }
                        else {
                            reject(err);
                        }
                    });
            });
        }
    });

    const handler = Object.assign(baseHandler(), {
        apply: (target, thisArg, argumentsList) => {
            return new Proxy({}, baseHandler(argumentsList[0]));
        }
    });

    return new Proxy(function() {}, handler);
}

function PlutoCallable(name, filename, host=DEFAULT_HOST) {
    const handler = {
        apply: (target, thisArg, argumentsList) => {
            if(argumentsList.length === 2 && (typeof argumentsList[1] === 'object')) {
                return call(name, argumentsList[0], argumentsList[1], filename, host);
            }
            else {
                return call(name, argumentsList, {}, filename, host);
            }
        }
    };

    return new Proxy(function() {}, handler);
}

module.exports = {PlutoNotebook, evaluate, call};
