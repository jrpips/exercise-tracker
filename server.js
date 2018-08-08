const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const User=require('./models/user');
const Exercise=require('./models/exercise');
const mongoose = require('mongoose');

mongoose.connect(process.env.MLAB_URI,{ useNewUrlParser: true });

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static('public'))

function valide(item){
  return true;
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Create a new User
app.post('/api/exercise/new-user',(req,res)=>{
  
  let user=req.body.username;
  
  if(user.length<1){
    
    let newUser=new User({
      "username":user
    })
    
    newUser.save(function(err){
      if(err) res.send('DB error :'+err.message);
      res.json({"username":newUser.username,"id":newUser._id})
    })
    
  }else{
  
    res.send('Username is required');
  }
})

// Add exercise
app.post('/api/exercise/add',(req,res)=>{

  let username=req.body.userId;
  let description=req.body.description;
  let duration=req.body.duration;
  let date=req.body.date;
  
  User.findOne({username:username},function(err,user){
    
    if(err) console.log('error');

    if(!user) res.send('Not found User: '+username);
    
    let exercise=new Exercise({
      userId:user._id,
      description:description,
      duration:duration,
      date:new Date(date)
    })
    
    exercise.save(function(err){
      if(err) console.log(err.message);
    })
   
    res.json({exercise})
  })
})

// Select exercises
app.get('/api/exercise/log',function(req,res){
  
  let username=req.query.userId;
  
  if(username=='undefined' || username.length===0) res.send('An username is required');
  
  let from=new Date(req.query.from);
  let to=new Date(req.query.to);
  let limit=parseInt(req.query.limit);
    
  const query={};
  
  User.findOne()
    .where('username')
    .equals(req.query.userId)
    .exec(function(err,user){
    
      query.userId=user._id;
      if(from!='Invalid Date') query.date={$gte:from};
      if(to!='Invalid Date') query.date={$lt:to};
    
      Exercise.find(query).select('description duration date').limit(limit).exec(function(err,exercises){
        res.json({
          user:user.username,
          exercices:exercises
        })
      })
  })
})

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
