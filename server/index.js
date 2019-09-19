const finalHandler = require('finalhandler')
const http = require('http')
const serveStatic = require('serve-static')
const port = process.env.PORT || 8000
const serve = serveStatic('./client/build', { 'index': ['index.html', 'index.htm']})

const server = http.createServer((req, res) =>
  //serve(req, res, finalHandler(req, res))
  finalHandler(req,res)(new Error('nope!'))
  ).listen(port, ()=> console.log(`server is ready ${port}`))

const io = require('socket.io')(server);
const clients = []

const getRandomInt = (max=100,min=0) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const getRandomNumbers = () => new Array(3).fill(100).map(getRandomInt)

const getRandomAddition = () => {
  const numbers = getRandomNumbers()
  const answer = numbers.reduce((prev,curr)=>prev+curr)+""
  const text = numbers.join(' + ')
  const compare = (providedAnswer) => (providedAnswer+""===answer)
  return { numbers, answer, text, compare }
}

const buffer = []

io.on('connection', (socket) => {

  
  const id = socket.id
  const log = (command,args=null) => io.emit('log',{id,command,args})
  log('client connected')

  clients.push(id)

  socket.on('disconnect', () => {
    console.log('user disconnected');
    io.emit('new disconnection',id)
    const index = clients.indexOf(id)
    if(index>=0){
      clients.splice(index,1)
    }
  });

  socket.on('give me next', () => {
    log('give me next')
    socket.emit('next','Impressive. We\'re going to top it up a notch. The server will send you a simple, random, addition. You will need to answer correctly. You cannot put the answer in a button, because if you do, the page will refresh, and you will lose your ID. Try to solve it! The API to get an equation is to send "addition"')
  })
  
  socket.on('ping!', () => {
    log('ping')
    io.emit('pong!',{ 'data':'this could be anything', otherData:12, foo:'bar' })
  })

  const addition = getRandomAddition()
  
  socket.on('addition', () => {
    log('addition')
    const { text, answer } = addition
    const message = 'please send the message "answer" with the answer to '+text+'. You may send the answer as a string. You may also get a hint.'
    socket.emit('next',message)
  })

  socket.on('answer', (providedAnswer) => {
    const { answer, compare } = addition
    const correct = compare(providedAnswer)
    log('answer',providedAnswer,correct)
    if(correct){
      socket.emit('next',`Nice! You solved it. You can now send arbitrary things to the server. That\'s cool. Let\'s take a moment to clean up. We're going to keep:
      1. the "whoami" button
      2. the input that sends text
      3. the button that sends that text
You can also keep the labels that say if you are connected or not. Remove everything else.
What you'll also do is, instead of "answer", make the button submit to an endpoint called "message". You can send any piece of text there. See what happens.
Do clean first though!
`)
    }else{
      socket.emit('next','This is the right spot to send the answer, but your answer is wrong. Got:'+providedAnswer)
    }
  })


  socket.on('hint', () => {
    log('hint')
    socket.emit('next','Not bad! Good guess. But actually, you should use `hint:addition`')
  })

  socket.on('hint:addition', () => {
    const { answer } = addition
    log('hint:addition',answer)
    socket.emit('next','you *probably* need to capture an input\'s contents and send them. Also, the answer is '+answer)
  })

  socket.on('hint:room_message', () => {
    log('hint:room_message')
    socket.emit('next','simple: put something like: socket.on("room_message",()=>{})')
  })


  socket.on('whoami', () => {
    log('whoami')
    io.emit('youare',{id})
  })

  let firstMessage = true

  socket.on('message',(data)=>{
    console.log(data)
    if(data && (typeof data !== 'string') && ('id' in data)){
      const {text, id, name }= data
      if(!text){
        log('message -- no text')
        return socket.emit('next','`text` is empty')
      }
      if(!id){
        log('message -- no id')
        return socket.emit('next','`id` is empty')
      }
      if(!name){
        log('message -- no name')
        return socket.emit('next','`name` is empty')
      }
      const date = new Date().toLocaleString()
      const message = {id,name,text,date}
      buffer.push(message)
      if(buffer.length > 20 ){
        buffer.shift()
      }
      if(firstMessage){
        firstMessage = false
        socket.emit('next',`Congrats! You can send and receive chat messages. Now:
        1. display the old messages (you're receiving them when listening to \`room\`). Just take this array and put it in state and render it.
        2. display the new message (add it to the array)
        3. make the id auto-loaded, so you don't have to click on the button evey time to obtain an id.
        4. make it look the best you can! 
        `)
      }
      log('message',message)
      return io.emit('room_message',message)
    }
    log('message -- not correct',data)
    socket.emit('next',`Welcome! This is where you send your chat messages for others to read. A message is an object composed of:
    1. a 'text' property containing the text
    2. an 'id' property containing your user id
    3. a 'name' property containing your desired user name
That's it! Send an object with all those three things and other people will see your messages.
Ah! I almost forgot. *You* also need to see the messages. To receive them, you need to listen for the message "room_message". Good luck!
`)
  })

  io.emit('room',buffer)

  io.emit('new connection',id)
  //Object.keys(io.sockets.connected)
  
  socket.emit('peeps',clients)
  socket.emit('next','Bravo! Now please emit "give me next" from the client. You can do that on start, or when pressing a button, whatever')
});

