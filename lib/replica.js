const http = require('http');
const https = require('https');
const { URL } = require('url');

const TRAILING_SLASH_REGEXP = /\/+$/;

/**
 * * Replicax - A lightweight, zero dependices, middleware, auto-reload support,  HTTP server framework
 * 
 * Creates a new Replica app instance.
 *
 * @example
 * const { createApp } = require('replicax');
 * const app = createApp();
 *
 * app.get('/', (req, res) => {
 *   res.json({ message: 'Hello from Replicax!' });
 * });
 *
 * app.listen(3000, () => {
 *   console.log('Server running on http://localhost:3000');
 * });
 *
 * @returns {object} An object with HTTP method handlers and middleware support
 */
function replicax() {
    const routes = [];
    const middlewares = [];

    /**
     * Converts a path like `/user/:id` into a regex.
     * @param {string} path - The route path pattern.
     * @returns {{ regex: RegExp, keys: string[] }}
     * @private
     */
    function pathToRegex(path) {
        const keys = [];
        const cleanPath = path.replace(TRAILING_SLASH_REGEXP, '') || '/';
        const regexStr = cleanPath
            .replace(/\//g, '\\/')
            .replace(/:([A-Za-z0-9_]+)/g, (_, key) => {
                keys.push(key);
                return `(?<${key}>[^\\/]+)`;
            });

        return {
            regex: new RegExp(`^${regexStr}$`),
            keys
        };
    }

    /**
     * Registers a route handler.
     * @param {string} method - HTTP method.
     * @param {string} path - Route path.
     * @param {...Function} handler - One or more middleware/handler functions.
     */
    function register(method, path, ...handler) {
        const { regex } = pathToRegex(path);
        routes.push({ method, regex, handlers: handler });
    }

    /**
     * Adds `.status()` and `.json()` helpers to the response object.
     * @param {http.ServerResponse} res
     * @returns {http.ServerResponse}
     */
    function enhanceResponse(res) {
        res.status = function (code) {
            res.statusCode = code;
            return res;
        };
        res.json = function (data) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
        };
        return res;
    }

    /**
     * Parses incoming JSON body and adds `req.body`
     * @param {http.IncomingMessage} req
     * @returns {Promise<void>}
     */
    function parseBody(req) {
        return new Promise((resolve) => {
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                let body = '';
                req.on('data', chunk => (body += chunk));
                req.on('end', () => {
                    try {
                        req.body = JSON.parse(body);
                    } catch {
                        req.body = {};
                    }
                    resolve();
                });
            } else {
                req.body = {};
                resolve();
            }
        });
    }

    /**
     * Internal request handler for incoming HTTP traffic.
     * @param {http.IncomingMessage} req
     * @param {http.ServerResponse} res
     */
    async function handleRequest(req, res) {
        try {
            const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
            const pathname = parsedUrl.pathname.replace(TRAILING_SLASH_REGEXP, '') || '/';
            const method = req.method;

            enhanceResponse(res);
            req.params = {};
            await parseBody(req);

            let i = 0;

            function runMiddlewares() {
                const middleware = middlewares[i++];
                if (!middleware) return routeHandler();
                middleware(req, res, runMiddlewares);
            }

            function routeHandler() {
                for (const route of routes) {
                    const match = pathname.match(route.regex);
                    if (match && method === route.method) {
                        req.params = match.groups || {};
                        const handlers = route.handlers;
                        let j = 0;

                        function next() {
                            const handler = handlers[j++];
                            if (handler) {
                                try {
                                    handler(req, res, next);
                                } catch {
                                    res.status(500).json({ error: 'Internal Server Error' });
                                }
                            }
                        }

                        return next();
                    }
                }
                res.status(404).json({ error: 'Route not found' });
            }

            runMiddlewares();
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Server error', message: err.message }));
        }
    }

    return {
        /**
         * Use an app-wide middleware.
         * @param {Function} middleware - Function with (req, res, next).
         */
        use: (middleware) => middlewares.push(middleware),

        /**
         * Add GET route handler.
         * @param {string} path
         * @param {...Function} handler
         */
        get: (path, ...handler) => register('GET', path, ...handler),

        /**
         * Add POST route handler.
         * @param {string} path
         * @param {...Function} handler
         */
        post: (path, ...handler) => register('POST', path, ...handler),

        /**
         * Add PUT route handler.
         * @param {string} path
         * @param {...Function} handler
         */
        put: (path, ...handler) => register('PUT', path, ...handler),

        /**
         * Add PATCH route handler.
         * @param {string} path
         * @param {...Function} handler
         */
        patch: (path, ...handler) => register('PATCH', path, ...handler),

        /**
         * Add DELETE route handler.
         * @param {string} path
         * @param {...Function} handler
         */
        delete: (path, ...handler) => register('DELETE', path, ...handler),

        /**
         * Start the server.
         * @param {number} port - Port number.
         * @param {Function} cb - Callback when server starts.
         * @param {object} options - Optional HTTPS settings.
         */
        listen: (port, cb, options = {}) => {
            const { https: useHttps = false, httpsOptions = {} } = options;
            const srv = useHttps
                ? https.createServer(httpsOptions, handleRequest)
                : http.createServer(handleRequest);
            srv.listen(port, cb);
        }
    };
}

module.exports = { replicax };
