if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
const express = require('express')
const app=express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride=require('method-override')

const initializePassport = require('./passport-config')

initializePassport(passport,
    email =>users.find(user => user.email === email),
    id =>users.find(user => user.id === id)
)

//local storage
const users=[]

app.set('view-engine','ejs')
app.use(express.urlencoded({extended:false}))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitiated:false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
//app.use(express.json())

app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', {name:req.user.name})
})

app.get('/login',checkNotAuthenticated, (req, res) => {
     res.render('login.ejs')
})

app.post('/login',checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash:true
}))

app.get('/resetPassword', (req, res) => {
    res.render('resetPassword.ejs')
})

app.post('/resetPassword', async (req, res)=> {
    try {
        const hashedPassword=await bcrypt.hash(req.body.password,10)
        const user = {
            id:Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        }
        users.push(user);
        res.redirect('/login')

    } catch {
        res.redirect('/register')
    }
    console.log(users)
})

app.get('/register',checkNotAuthenticated, (req, res) => {
     res.render('register.ejs')
})

app.post('/register',checkNotAuthenticated, async(req, res) => {
    try {
        const hashedPassword=await bcrypt.hash(req.body.password,10)
        const user = {
            id:Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        }
        users.push(user);
        res.redirect('/login')

    } catch {
        res.redirect('/register')
    }
    console.log(users)
})

app.get('/users',(req, res)=>{
    res.json(users)
})

app.post('/users', async (req, res) => {
    try {
        //const salt = await bcrypt.genSalt()
        const hashedPassword=await bcrypt.hash(req.body.password,10)
        const user = {
        name: req.body.name,
        password: hashedPassword
        }
        users.push(user);
        res.status(201).send()

    } catch {
        res.status(500).send()
    }

})

app.post('/users/login', async (req, res) => {
    const user = users.find(user => user.name = req.body.name)
    if (user == null) {
        return res.status(400).send('Cannot find user')
    }
    try {
        if (await bcrypt.compare(req.body.password, user.password)) {
           res.send('Success')
        } else {
            res.send('Not Allowed')
       }
    } catch {
        res.status(500).send()
    }
})

app.delete('/logout', (req, res)=>{
    req.logOut()
    res.redirect('/login')
})

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}


app.listen(3000)