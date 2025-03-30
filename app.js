const express = require("express");
const cors = require("cors");
const http = require("http");
const connectDB = require("./db/db");
const authRouter = require("./router/auth");
const gigRouter = require("./router/gig");
const paymentroute=require('./router/paymentroute')
const contractrouter=require('./router/contractroute')
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ dest: 'uploads/' });

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
connectDB();

app.get("/", () => {
  console.log("runnning server");
});

//Here goes routing tranfer codes.
app.use("/auth",upload.single('photo'), authRouter);
app.use("/gigs", gigRouter);
app.use("/contracts",contractrouter);
app.use("/payments",paymentroute);


const server = http.createServer(app);

server.listen(5000, () => {
  console.log("Server is running on port 5000");
});
