const express = require('express')
const cors = require('cors')
const server = express()
const psTree = require('ps-tree')
server.use(cors())
server.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Methods: GET, POST, DELETE, PUT, PATCH, OPTIONS'
  )
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, api_key'
  )
  next()
})

var kill = function(pid, signal, callback) {
  signal = signal || 'SIGKILL'
  callback = callback || function() {}
  var killTree = true
  if (killTree) {
    psTree(pid, function(err, children) {
      ;[pid]
        .concat(
          children.map(function(p) {
            return p.PID
          })
        )
        .forEach(function(tpid) {
          try {
            process.kill(tpid, signal)
          } catch (ex) {}
        })
      callback()
    })
  } else {
    try {
      process.kill(pid, signal)
    } catch (ex) {}
    callback()
  }
}

server.get('/', async (req, res, next) => {
  if (!req.query.username) {
    res.json({ message: 'Unauthorized' })
  }
  var usernameRegex = /^[a-zA-Z0-9]+$/
  if (!usernameRegex.test(req.query.username)) {
    res.json({ message: 'bad request' })
  }
  const py = await require('child_process').spawn('python', [
    './app.py',
    req.query.username
  ])
  try {
    py.stdout.on('data', data => res.json(JSON.parse(data)))
  } catch (e) {
    py.stderr.on(
      'data',
      data => {
        console.log(`stderr: ${data}`)
        res.status(500).json({ message: 'An error has occurred.' })
      },
      e
    )
  } finally {
    py.on('close', (code, signal) => {
      kill(py.pid)
      console.log(`child process exited with code ${code} and signal ${signal}`)
    })
  }
})
server.listen(process.env.PORT || 4000, console.log('up and running'))
