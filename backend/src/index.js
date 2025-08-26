import express from "express";
import { config } from "dotenv";
import ErrorHandler from "./middlewares/ErrorHandler.js";
import cors from "cors";
import userRoute from "./routes/userRoutes.js";
import morgan from "morgan";

config();

const app = express();
const port = process.env.PORT;
const frontendUrl = process.env.FRONTEND_URL;
import connectDb from "./config/mongodb.js";

app.use(morgan('tiny'))

app.use(
  cors({
    origin: frontendUrl,
    optionsSuccessStatus: 200,
    methods: ['GET', 'PUT', 'POST'],
    credentials: true
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("api is working");
});

app.use("/api/user", userRoute);


// global error caching middleware which collects errors thrown from App error
app.use(ErrorHandler);

connectDb().then(() => {
  app.listen(port, () => {
    console.info(`server is running in http://localhost:${port}`);
  });
});
