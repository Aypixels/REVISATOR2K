const express = require('express')
const app = express() 
const port = process.env.PORT || 3000

var bodyParser = require('body-parser')
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({     
  extended: true
})); 

app.get('/', (req, res) => {
    res.sendFile(__dirname + `/frontend/index.html`)
})

app.post('/api/login', (req, res) => {

    let username = req.body.username
    let password = req.body.password

    const users = require('./data/users.json')
    
    if(!users[username]) return res.json({
        status: false,
        msg: 'bad username'
    })

    if(users[username].password != password) return res.json({
        status: false,
        msg: 'bad password'
    })

    res.json({
        status: true,
        msg: 'ok',
        user: users[username]
    })

})




app.get('*', (req, res) => {
    res.sendFile(__dirname + `/frontend/404.html`)
})

app.listen(port, () => {
    console.log(`App listening at port ${port}`)
})