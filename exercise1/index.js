const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

let users = {}; // Store connected users

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle nickname assignment
    socket.on('set_nickname', (nickname) => {
        users[socket.id] = nickname;
        io.emit('user_list', Object.values(users)); // Update all users
        socket.broadcast.emit('user connected', `${nickname} has joined`);
    });

    // Handle chat messages
    socket.on('chat_message', (message) => {
        socket.broadcast.emit('chat_message', { nickname: users[socket.id], message });
    });

    // Handle "user is typing" notification
    socket.on('typing', () => {
        socket.broadcast.emit('user_typing', users[socket.id]);
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        if (users[socket.id]) {
            io.emit('user disconnected', `${users[socket.id]} has left`);
            delete users[socket.id]; // Remove from user list
            io.emit('user_list', Object.values(users)); // Update all users
        }
        console.log('A user disconnected');
    });
});

server.listen(3000, () => {
  console.log('listening on http://localhost:3000');
});