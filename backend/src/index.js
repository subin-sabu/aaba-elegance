import express from "express";
import { config } from "dotenv";
import ErrorHandler from "./middlewares/ErrorHandler.js";
import cors from 'cors';
import userRoute from "./routes/user.routes.js";
config();
const app = express();
const port = process.env.PORT;
const frontendUrl = process.env.FRONTEND_URL;
import connectDb from "./config/mongodb.js";
connectDb()

app.use(cors({
  origin: `http://localhost:${frontendUrl}`,
  optionsSuccessStatus: 200
}));




app.get('/', (req,res) => {
  res.send('api is working');
});

app.use('/user', userRoute);


app.use(ErrorHandler);

app.listen(port, () => {
  console.info(`server is running in http://localhost:${port}`);
})
