const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
const cors = require('cors');  // Import CORS middleware
const channelRoutes = require('./routes/channelRoutes');  // Import channel routes
const socketConfig = require('./socket');  // Import socket configuration
const http = require('http');
const app = express();

const adminRoutes = require('./routes/adminRoutes');
const groupRoutes = require('./routes/groupRoutes');
const path = require('path');
const { PeerServer } = require('peer');
const fs = require('fs');

const server = http.createServer( app);


// Configure Socket.io
socketConfig(server);

app.use(cors({
  origin: 'http://localhost:4200',  // Allow requests from the front-end Angular application
  methods: ['GET', 'POST','GET', 'POST', 'PUT', 'DELETE'],  // Allowed methods
  credentials: true,  // Allow credentials (like Cookies or authorization headers)
}));

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api', userRoutes);  // User routes
app.use('/api/channels', channelRoutes);  // Add channel-related routes
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
