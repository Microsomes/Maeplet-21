const express= require("express")
const app= express()

const fs= require("fs")

const cors= require("cors")

require('dotenv').config()

var ssloptions = {
  key: fs.readFileSync("/etc/letsencrypt/live/maeplet.com/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/maeplet.com/fullchain.pem"),
};


 
const server= require("https").createServer(ssloptions,app)

const io= require("socket.io")(server)

const { v4: uuidV4 } = require('uuid')

const { ExpressPeerServer } = require('peer');

app.set('view engine', 'ejs')
app.use(express.static('public'))

const peerServer= ExpressPeerServer(server,{
    debug:true
});

app.use('/peerjs', peerServer);



io.on('connection', socket => {
    console.log("connected user",socket.id)
    socket.on('join-room', (roomId, userId) => {
        console.log("User connecting a room",roomId, userId)
      socket.join(roomId)
      socket.to(roomId).broadcast.emit('user-connected', userId);
      // messages
      socket.on('message', (message) => {
        //send message to the same room
        io.to(roomId).emit('createMessage', message)
    }); 
      socket.on('disconnect', () => {
        socket.to(roomId).broadcast.emit('user-disconnected', userId)
      })
    })
  })
 

 app.use(cors())

app.get('/', (req, res) => {
    res.render("index")
    // res.redirect(`/${uuidV4()}`)
  })

  app.get("/room",(req,res,next)=>{
      res.redirect(`/room/${uuidV4()}`)
  })

  app.get("/room/:room",(req,res,next)=>{
      res.render("room",{roomId:req.params.room})
  })

 

  if(process.env.MODE=='DEV'){
    console.log("DEV")
    server.listen(process.env.PORT||3000);
  }else{
    console.log("PRODUCTION")

    
    server.listen(443)

    


   }