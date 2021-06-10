const express = require('express')
const app = express() 
const port = process.env.PORT || 3000

const bodyParser = require('body-parser')
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({     
  extended: true
})); 

const fs = require('fs')

let lists = {
    ids: [],
    tokens: []
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + `/frontend/index.html`)
})

app.post('/api/login', (req, res) => {

    let username = req.body.username
    let password = req.body.password

    if(!username || !password) return res.json({
        status: false,
        msg: 'missing argument'
    })

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

app.post('/api/register', (req, res) => {

    let user = {}
    const users = require('./data/users.json')

    user.username = req.body.username

    if(users[user.username]) return res.json({
        status: false,
        msg: 'username already exists'
    })

    user.password = req.body.password
    user.createdTimestamp = new Date().getTime()
    user.id = genID()
    user.token = genToken()
    while(lists.ids.includes(user.id)) user.id = genID()
    while(lists.tokens.includes(user.token)) user.token = genToken()
    lists.ids.push(user.id); lists.tokens.push(user.token)
    user.fiches = []
    user.friends = []
    user.followers = []
    user.following = []

    users[user.username] = user

    fs.writeFile('./data/users.json', JSON.stringify(users, null, 4), (err) => {
        if(err) console.log(err)  
        res.json({
            status: true,
            msg: "ok",
            user: user
        })
    })

})

app.get('/api/test', (req, res) => {
    res.send(genID() + " ----------------------------------------------------- " + genToken())
})


app.get('*', (req, res) => {
    res.redirect('/')
})

app.listen(port, () => {
    console.log(`App listening at port ${port}`)
    const users = require('./data/users.json')
    Object.keys(users).forEach(u => {
        u = users[u]
        lists.ids.push(u.id)
        lists.tokens.push(u.token)
    })
})

function genID() {
    let letters = "abcdefghijklmnopqrstuvwxyz"
    let id = "#"
    for (let index = 0; index < 4; index++) {
        id += letters[Math.floor(Math.random() * letters.length)]
    }
    for (let index = 0; index < 2; index++) {
        id += Math.floor(Math.random() * 10).toString()
    }
    id += "$"
    id += new Date().getDate() + new Date().getMonth() + new Date().getYear() - 100
    return id
}


function genToken() {
    let letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-.123456789*"
    let token = ""
    let length = 64
    for (let index = 0; index < length; index++) {
        token += letters[Math.floor(Math.random() * letters.length)]
    }
    return token
}
