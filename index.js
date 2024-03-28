const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended : true}))




const port = 5000

app.listen(port,()=>{
	console.log('Server is running!')
})

module.exports = app 

require('./routes')




