const express = require('express')
const server = express()



server.get('/', async (req, res) => {
  if (!req.query.username) {
    res.status(404).json({message: "BAD REQUEST"})
  }
  const py = await require('child_process').spawn('python', [
    './app.py',
    req.query.username
  ])
  try {
    py.stdout.on('data', data => {
      res.json(JSON.parse(data))
    })
  } catch (e) {
    py.stderr.on(
      'data',
      data => {
        console.log(`stderr: ${data}`)
      },
      e
    )
  } finally {
    py.on('close', (code, signal) => {
      console.log(`child process exited with code ${code} and signal ${signal}`)
    })
  }
})
server.listen(process.env.PORT || 3000, console.log('up and running'))
