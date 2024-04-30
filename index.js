const express = require('express')
const bodyParser = require('body-parser')
const router = require('./Router/auth')
const app = express()
const productRouter = require('./Router/products')


app.use(bodyParser.json())

app.use('/' , productRouter)
app.use('/' , router)
app.listen(3000, (req,res) => {
    console.log('Server Online on port 3000')
})
