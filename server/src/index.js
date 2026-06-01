import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import testRoute from './routes/testRoute.js';
const app = express();
app.use(cors());
app.use(express.json());


const PORT =  process.env.PORT || 3000;


app.use('/api/test', testRoute);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


