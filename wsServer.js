const { WebSocketServer } = require('ws');

const clients = {};
const wss = new WebSocketServer({ port: 8080 });
wss.on('connection', (ws, request) => {
    const urlParams = new URLSearchParams(request.url.split('?')[1]);
    const username = urlParams.get('username');
    if (username) {
        clients[username] = ws;
        ws.on('message', (message) => {
            const parsedMessage = JSON.parse(message);
            const { sendTo, text, file, filename } = parsedMessage;
            if (sendTo && clients[sendTo]) {
                const datetimeFrom = new Date().toLocaleString();
                clients[sendTo].send(
                    JSON.stringify({
                        sent_by: username,
                        send_to: sendTo,
                        text,
                        file,
                        filename,
                        datetime_from: datetimeFrom,
                    })
                );
            }
        });
    }
});
console.log('WebSocket server started on ws://localhost:8080');
