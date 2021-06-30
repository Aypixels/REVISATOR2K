'use strict';

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
    tokens: [],
    sheets: []
}
let getList = () => {
    const users = require('./data/users.json')
    Object.keys(users).forEach(u => {
        u = users[u]
        lists.ids.push(u.id)
        lists.tokens.push(u.token)
    })
    const sheets = require('./data/sheets.json')
    Object.keys(sheets).forEach(sheet => {
        sheet = sheets[sheet]
        lists.sheets.push(sheet.id)
    })
}
getList()

app.get('/', (req, res) => {
    res.sendFile(__dirname + `/frontend/index.html`)
})
app.get('/login', (req, res) => {
    res.sendFile(__dirname + `/frontend/login.html`)
})
app.get('/register', (req, res) => {
    res.sendFile(__dirname + `/frontend/register.html`)
})
/*app.get('/sheet', (req, res) => {
    res.sendFile(__dirname + `/frontend/sheet.html`)
})
app.get('/search', (req, res) => {
    res.sendFile(__dirname + `/frontend/search.html`)
})
app.get('/user', (req, res) => {
    res.sendFile(__dirname + `/frontend/user.html`)
})*/

app.post('/api/login', (req, res) => {

    let username = req.body.username
    let password = req.body.password

    if(!getUserByUsername(username)) return res.json({
        status: false,
        msg: 'bad username'
    })

    if(getUserByUsername(username).password != password) return res.json({
        status: false,
        msg: 'bad password'
    })

    res.json({
        status: true,
        msg: 'ok',
        user: getUserByUsername(username)
    })

})
app.post('/api/register', (req, res) => {

    let user = {}
    const users = require('./data/users.json')

    user.username = req.body.username

    if(getUserByUsername(user.username)) return res.json({
        status: false,
        msg: 'username already exists'
    })

    user.password = req.body.password
    user.email = req.body.email

    user.createdTimestamp = new Date().getTime()
    user.id = genID()
    user.token = genToken()
    while(lists.ids.includes(user.id)) user.id = genID()
    while(lists.tokens.includes(user.token)) user.token = genToken()
    lists.ids.push(user.id); lists.tokens.push(user.token)
    user.sheets = []
    user.friends = []
    user.followers = []
    user.followings = []
    user.favorites = []

    users[user.id] = user

    fs.writeFile('./data/users.json', JSON.stringify(users, null, 4), (err) => {
        if(err) console.log(err)  
        res.json({
            status: true,
            msg: "ok",
            user: user
        })
        sendMail(user)
    })

})
app.post('/api/addSheet', (req, res) => {

    let sheet = req.body.sheet // object
    let author = req.body.author // author token
    author = getUserByToken(author)

    if(!author) return res.json({
        status: false,
        msg: 'bad token'
    })

    //add sheet

    const sheets = require('./data/sheets.json')
    const users = require('./data/users.json')
    
    let id = genID()
    while(lists.sheets.includes(id)) id = genID()

    sheet.id = id
    sheet.favorites = []
    sheet.likes = []
    sheet.dislikes = []
    sheet.comments = []
    sheet.author = author

    sheets[sheet.id] = sheet

    //add sheet on user 
    author.sheets.push(sheet.id)    

    users[author.id] = author

    fs.writeFile('./data/users.json', JSON.stringify(users, null, 4), (err) => {
        fs.writeFile('./data/sheets.json', JSON.stringify(sheets, null, 4), (err) => {
            if(err) console.log(err)  
            res.json({
                status: true,
                msg: "ok",
                sheet: sheet
            })
        })
    })


})
app.post('/api/searchSheet', (req, res) => {

    let search = req.body.search.toLowerCase()
    let tags = []

    let result = []

    let sheets = require('./data/sheets.json')

    Object.keys(sheets).forEach(sheet => {
        sheet = sheets[sheet]
        sheet.title = sheet.title.toLowerCase()
        if(sheet.title.includes(search)) result.push(sheet)
    })

    res.json({
        status: true,
        msg: 'ok',
        result: result
    })

})
app.post('/api/getUserSheets', (req, res) => {

    let user = req.body.author //token

    const users = require('./data/users.json')
    const sheets = require('./data/sheets.json')

    user = users[user]

    if(!user) res.json({
        status: false,
        msg: 'bad token'
    })

    let result = []

    users[user.id].sheets.forEach(sheet => {

        sheet = sheets[sheet]
        result.push(sheet)

    })

    res.json({
        status: true,
        msg: 'ok',
        sheets: result
    })


})
app.post('/api/addFavorite', (req, res) => {

    let user = req.body.user //token
    let sheet = req.body.sheet //sheet id

    const users = require('./data/users.json')
    const sheets = require('./data/sheets.json')

    user = getUserByToken(user)
    sheet = sheets[sheet]

    if(!user) res.json({
        status: false,
        msg: 'bad token'
    })

    if(sheet.favorites.includes(user.id)) return res.json({
        status: false,
        msg: 'already in favorite'
    })    

    sheet.favorites.push(user.id)
    user.favorites.push(sheet.id)
    users[user.id] = user
    sheets[sheet.id] = sheet


    fs.writeFile('./data/users.json', JSON.stringify(users, null, 4), (err) => {
        fs.writeFile('./data/sheets.json', JSON.stringify(sheets, null, 4), (err) => {
            if(err) console.log(err)  
            res.json({
                status: true,
                msg: "ok"
            })
        })
    })

})
app.post('/api/like', (req, res) => {

    let user = req.body.user
    let sheet = req.body.sheet

    let sheets = require('./data/sheets.json')

    user = getUserByToken(user)
    sheet = sheets[sheet]

    if(!user) res.json({
        status: false,
        msg: 'bad token'
    })

    if(sheet.likes.includes(user.id)) return res.json({
        status: false,
        msg: 'already like'
    })

    if(sheet.dislikes.includes(user.id)) {
        sheet.dislikes.splice(sheet.dislikes.indexOf(user.id), 1)
    }

    sheet.likes.push(user.id)
    sheets[sheet.id] = sheet

    fs.writeFile('./data/sheets.json', JSON.stringify(sheets, null, 4), (err) => {
        if(err) console.log(err)  
        res.json({
            status: true,
            msg: "ok"
        })
    })

})
app.post('/api/dislike', (req, res) => {

    let user = req.body.user
    let sheet = req.body.sheet

    let sheets = require('./data/sheets.json')

    user = getUserByToken(user)
    sheet = sheets[sheet]

    if(!user) res.json({
        status: false,
        msg: 'bad token'
    })

    if(sheet.dislikes.includes(user.id)) return res.json({
        status: false,
        msg: 'already dislike'
    })

    if(sheet.likes.includes(user.id)) {
        sheet.likes.splice(sheet.likes.indexOf(user.id), 1)
    }

    sheet.dislikes.push(user.id)
    sheets[sheet.id] = sheet


    fs.writeFile('./data/sheets.json', JSON.stringify(sheets, null, 4), (err) => {
        if(err) console.log(err)  
        res.json({
            status: true,
            msg: "ok"
        })
    })

})
app.post('/api/comment', (req, res) => {
    
    let user = req.body.user
    let sheet = req.body.sheet
    let comment = req.body.comment

    let sheets = require('./data/sheets.json')

    user = getUserByToken(user)
    sheet = sheets[sheet]

    if(!user) res.json({
        status: false,
        msg: 'bad token'
    })

    sheet.comments.push({
        author: user,
        comment: comment
    })

    sheets[sheet.id] = sheet

    fs.writeFile('./data/sheets.json', JSON.stringify(sheets, null, 4), (err) => {
        if(err) console.log(err)
        res.json({
            status: true,
            msg: 'ok',
            message: sheets[sheet.id].comments[sheets[sheet.id].comments.length - 1]
        })
    })

})
app.post('/api/follow', (req, res) => {

    let user = req.body.user //token
    let follow = req.body.follow //ID

    let users = require('./data/users.json')

    user = getUserByToken(user)

    if(!user) res.json({
        status: false,
        msg: 'bad token'
    })

    if(user.followings.includes(follow)) return res.json({
        status: false,
        msg: 'already follow'
    })

    user.followings.push(follow)
    users[follow].followers.push(user.id)

    users[user.id] = user

    fs.writeFile('./data/users.json', JSON.stringify(users, null, 4), (err) => {
        if(err) console.log(err)
        res.json({
            status: true,
            msg: 'ok'
        })
    })

})
app.post('/api/unfollow', (req, res) => {

    let user = req.body.user //token
    let follow = req.body.follow //ID

    let users = require('./data/users.json')

    user = getUserByToken(user)

    if(!user) res.json({
        status: false,
        msg: 'bad token'
    })

    if(!user.followings.includes(follow)) return res.json({
        status: false,
        msg: 'not follow'
    })

    user.followings.splice(user.followings.indexOf(follow), 1)
    users[follow].followers.splice(users[follow].followers.indexOf(user.id), 1)

    users[user.id] = user

    fs.writeFile('./data/users.json', JSON.stringify(users, null, 4), (err) => {
        if(err) console.log(err)
        res.json({
            status: true,
            msg: 'ok'
        })
    })

})
app.post('/api/loginByToken', (req, res) => {
    let token = req.body.token

    let user = getUserByToken(token)

    if(!user) return res.json({
        status: false,
        msg: 'bad token'
    })

    res.json({
        status: true,
        msg: 'ok',
        user: user
    })

})
app.post('/api/modifInfos', (req, res) => {
    let token = req.body.token
    let user = getUserByToken(token)

    let username = req.body.username
    let password = req.body.password
    let email = req.body.email

    user.username = username
    user.password = password
    user.email = email

    let users = require('./data/users.json')

    users[user.id] = user

    fs.writeFile('./data/users.json', JSON.stringify(users, null, 4), (err) => {
        if(err) console.log(err)  
        res.json({
            status: true,
            msg: "ok",
            user: user
        })
        sendMail(user)
    })

})

app.get('*', (req, res) => {

    let file = req.path.slice(1)

    fs.readFile('./frontend/' + file, 'utf-8', (err, data) => {
        if(!err && file.endsWith('.css')) {

            res.sendFile(__dirname + "/frontend/" + file)

        } else {
            res.sendFile(__dirname + "/frontend/404.html")
        }
    })
})
app.listen(port, () => {
    console.log(`App listening at port ${port}`)
})

function genID() {
    let letters = "abcdefghijklmnopqrstuvwxyz".toUpperCase()
    let id = "#"
    for (let index = 0; index < 5; index++) {
        id += letters[Math.floor(Math.random() * letters.length)]
    }
    for (let index = 0; index < 3; index++) {
        id += Math.floor(Math.random() * 10).toString()
    }
    return id
}
function genToken() {
    let letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789"
    let token = ""
    let length = 32
    for (let index = 0; index < length; index++) {
        token += letters[Math.floor(Math.random() * letters.length)]
    }
    return token
}
function getUserByUsername(username) {

    const users = require('./data/users.json')

    let user = Object.keys(users).find(user => users[user].username == username)
    user = users[user]
    return user

}
function getUserByToken(token) {

    const users = require('./data/users.json')

    let user = Object.keys(users).find(user => users[user].token == token)
    user = users[user]
    return user

}
function sendMail(user) {
    //soon
}
function disconnection(){
    localStorage.removeItem('token')
    this.user = false
}