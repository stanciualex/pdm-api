const express = require('express');
const bodyParser = require('body-parser');
const http = require('http')
const WebSocket = require('ws');
const cors = require('cors');

const { router: authRouter } = require('./auth');
const { router: carRouter } = require('./car');
const { authMiddleware } = require('./utils/auth');
const { initWss } = require('./utils/wss');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

initWss(wss);
const port = 8000;

app.use(bodyParser.json());
app.use(cors());

/*app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});*/

// Public routes
app.use('/auth', authRouter);

// Private routes
app.use('/car', authMiddleware, carRouter);

server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
});