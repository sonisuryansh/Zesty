// Server Creation
const express = require('express')
const connectDB = require('./db/db')
const cookieParser = require('cookie-parser')
const authRouter = require('./routes/auth.routes')


const app = express()
app.use(cookieParser())
app.use(express.json());


app.get('/',(rea,res)=>{
    res.send("Hello World");
})

app.use('/api/auth', authRouter);
module.exports=app;
