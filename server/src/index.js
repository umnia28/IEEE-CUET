import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookiParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import http from "http";
import { Server } from "socket.io";

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookiParser());


const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join_sos_room", (publicToken) => {
    socket.join(publicToken);
    console.log(`Socket joined SOS room: ${publicToken}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT =  process.env.PORT || 3000;


app.use("/api/auth", authRoutes);
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


