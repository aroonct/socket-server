const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "public")));

let waitingUser = null;

wss.on("connection", (socket) => {
    console.log("Nuevo usuario conectado");

    socket.on("message", (message) => {
        const data = JSON.parse(message);

        if (data.type === "find_partner") {
            if (waitingUser) {
                socket.partner = waitingUser;
                waitingUser.partner = socket;

                socket.send(JSON.stringify({ type: "partner_found" }));
                waitingUser.send(JSON.stringify({ type: "partner_found" }));

                waitingUser = null;
            } else {
                waitingUser = socket;
            }
        } 
        else if (data.type === "offer" && socket.partner) {
            socket.partner.send(JSON.stringify({ type: "offer", offer: data.offer }));
        } 
        else if (data.type === "answer" && socket.partner) {
            socket.partner.send(JSON.stringify({ type: "answer", answer: data.answer }));
        } 
        else if (data.type === "ice-candidate" && socket.partner) {
            socket.partner.send(JSON.stringify({ type: "ice-candidate", candidate: data.candidate }));
        } 
        else if (data.type === "chat" && socket.partner) {
            socket.partner.send(JSON.stringify({ type: "chat", message: data.message }));
        }
    });

    socket.on("close", () => {
        if (waitingUser === socket) waitingUser = null;
        if (socket.partner) {
            socket.partner.send(JSON.stringify({ type: "partner_disconnected" }));
            socket.partner.partner = null;
        }
    });
});

const PORT = process.env.PORT || 3000;  // Usa el puerto de Railway
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});

