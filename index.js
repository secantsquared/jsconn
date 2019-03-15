const express = require('express')
const cors = require('cors')
const server = express()
const psTree = require('ps-tree')

server.use(cors())

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

// ... somewhere in the code of Yez!
server.get('/', async (req, res, next) => {
  if (!req.query.username) {
    res.status(404).json({ message: 'BAD REQUEST' })
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
      kill(py.pid)
      console.log(`child process exited with code ${code} and signal ${signal}`)
    })
  }
})
server.listen(process.env.PORT || 3000, console.log('up and running'))
