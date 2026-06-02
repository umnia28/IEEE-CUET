import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookiParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
const app = express();
app.use(cors());
app.use(express.json());
app.use(cookiParser());

const PORT =  process.env.PORT || 3000;


app.use("/api/auth", authRoutes);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


