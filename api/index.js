import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import { userModel } from './models/User.js'
import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import cors from 'cors'
import { WebSocketServer } from 'ws'

const port = process.env.PORT || 4000
const bcryptSalt = bcrypt.genSaltSync(10)

mongoose.connect(process.env.MONGO_URL)
.then(() => console.log('Database connected!'))
.catch(() => console.log('Cannot connect database!'))

const app = express()

app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL
}))
app.use(express.json())
app.use(cookieParser())

app.get('/test', (req, res) => {
    res.send('Test OK')
})

app.get('/profile', (req, res) => {
    const token = req.cookies?.token
    try {
        if (token)
            jwt.verify(token, process.env.JWT_SECRET, {}, (err, userData) => {
                if (err) throw err
                res.json(userData)
            })
        else
            res.status(401).json('no token')
    } catch (err) {
        console.error(err)
        res.status(500).json('error')
    }
})

app.post('/register', async (req, res) => {
    const { username, password } = req.body
    try {
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt)
        const createdUser = await userModel.create({
            username,
            password: hashedPassword
        })
        jwt.sign({userId: createdUser._id, username}, process.env.JWT_SECRET, (err, token) => {
            if (err) throw err;
            res.cookie('token', token, {sameSite: 'none', secure: true}).status(200).json({
                id: createdUser._id,
            })
        })
    } catch (err) {
        console.error(err)
        res.status(500).json('error')
    }
})

app.post('/login', async (req, res) => {
    const {username, password} = req.body
    try {
        const foundUser = await userModel.findOne({username})
        if (foundUser) {
            const passOk = bcrypt.compareSync(password, foundUser.password)
            if (passOk)
                jwt.sign({userId: foundUser._id, username}, process.env.JWT_SECRET, (err, token) => {
                    if (err) throw err;
                    res.cookie('token', token, {sameSite: 'none', secure: true}).status(200).json({
                        id: foundUser._id,
                        username: foundUser.username
                    })
                })
            else
                res.json('password invalid')
        }
        else
            res.json('user not found')
    } catch (err) {
        console.error(err)
        res.status(500).json('error')
    }
})

const server = app.listen(port, () => console.log(`Server started on http://localhost:${port}`))

const wss = new WebSocketServer({server})
wss.on('connection', (connection, req) => {
    const cookies = req.headers.cookie
    if (cookies) {
        const tokenCookieString = cookies.split(',').find(str => str.startsWith('token='))
        if (tokenCookieString) {
            const token = tokenCookieString.split('=')[1]
            if (token) {
                jwt.verify(token, process.env.JWT_SECRET, {}, (err, userData) => {
                    if (err) throw err
                    const {userId, username} = userData
                    connection.userId = userId
                    connection.username = username
                })
            }
        }
    }
    [...wss.clients].forEach(client => {
        client.send(JSON.stringify({
            online: [...wss.clients].map(c => ({userId: c.userId, username: c.username}))
        }))
    })
})