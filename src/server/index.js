require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const path = require('path')

const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/', express.static(path.join(__dirname, '../public')))

// example API call
app.get('/apod', async(req, res) => {
  try {
    let image = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`)
      .then(res => res.json())
    res.send({ image })
  } catch (err) {
    console.log('error:', err);
  }
})

/**
 * Mars Rover
 */
app.get('/rovers', async(req, res) => {
  try {
    const rovers = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers?api_key=${process.env.API_KEY}`)
      .then(res => res.json());
    res.send(rovers)
  } catch (err) {
    console.log('error:', err);
    res.status(500);
    res.end();
  }
})

/**
 * photos of rovers
 */
app.get('/rovers/photos/:roverName/:maxDate', async(req, res) => {
  try {
    const { roverName, maxDate } = req.params
    const data = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/${roverName}/photos?earth_date=${maxDate}&api_key=${process.env.API_KEY}`)
      .then(res => res.json())
    res.send(data)
  } catch (err) {
    console.log('error:', err);
    res.status(500);
    res.end();
  }
})

/**
 * Mission Manifest
 */
app.get('/manifests/:roverName', async(req, res) => {
  const { roverName } = req.params
  try {
    let data = await fetch(`https://api.nasa.gov/mars-photos/api/v1/manifests/${roverName}?api_key=${process.env.API_KEY}`)
      .then(res => res.json())
    res.send(data)
  } catch (err) {
    console.log('error:', err);
    res.status(500);
    res.end();
  }
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))