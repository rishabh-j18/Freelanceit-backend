const express = require("express");
const cors = require("cors");
const http = require("http");
const connectDB=require('./db/db');
const authRouter=require('./router/auth')

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


app.get('/',()=>{
  console.log("runnning server")
})



//Here goes routing tranfer codes.
app.use('/authuser',authRouter); 




const server = http.createServer(app);

server.listen(5000,()=>{
    console.log('Server is running on port 5000');
})