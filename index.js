require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

// Basic Configuration
const port = process.env.PORT || 3000;

// Middleware configuration
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({extended: true}))

// Connect Database
mongoose.connect(process.env.DATABASE_URL, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
}).then(console.log('Database connected')).catch(err => console.log(err));

//URL Model
const urlSchema = new mongoose.Schema({
  full: String,
  short: String
})

const URI = mongoose.model('URI', urlSchema)

// Home Page
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  const text = req.body.url;
  function isValidUrl(text) {
    try {
      new URL(text);
      return true;
    } catch (err) {
      return false;
    }
  }

  if(isValidUrl(text) === true) {
    // Hash Function to shorten the url string
    const simpleHash = (str) => {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i)
        hash &= hash // Convert to 32bit integer
      }
      return (hash >>> 0).toString(36)
    }
    
    // Save the url and the hash to the DB
    let url = new URI({
      full: text,
      short: simpleHash(text)
    });
    url.save()
    
    // Send JSON Response
    res.json({original_url: url.full, short_url: url.short});
  } else {
    res.json({error: 'invalid url'});
  }
})

app.get('/api/shorturl/:shorturl', async (req, res) => {
  const url = req.params.shorturl
  const redirect = await URI.findOne({short: url})
  if(redirect != null) {
    let redir = redirect.full
    res.redirect(redir)
  } else {
    res.json({error: 'invalid URL'});
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
