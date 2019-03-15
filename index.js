const express = require('express')
const cors = require('cors')
const server = express()
const psTree = require('ps-tree')

server.use(cors())

const extendTimeoutMiddleware = (req, res, next) => {
  const space = ' '
  let isFinished = false
  let isDataSent = false

  // Only extend the timeout for API requests
  if (!req.url.includes('/api')) {
    next()
    return
  }

  res.once('finish', () => {
    isFinished = true
  })

  res.once('end', () => {
    isFinished = true
  })

  res.once('close', () => {
    isFinished = true
  })

  res.on('data', data => {
    // Look for something other than our blank space to indicate that real
    // data is now being sent back to the client.
    if (data !== space) {
      isDataSent = true
    }
  })

  const waitAndSend = () => {
    setTimeout(() => {
      // If the response hasn't finished and hasn't sent any data back....
      if (!isFinished && !isDataSent) {
        // Need to write the status code/headers if they haven't been sent yet.
        if (!res.headersSent) {
          res.writeHead(202)
        }

        res.write(space)

        // Wait another 15 seconds
        waitAndSend()
      }
    }, 15000)
  }

  waitAndSend()
  next()
}

server.use(extendTimeoutMiddleware)

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
