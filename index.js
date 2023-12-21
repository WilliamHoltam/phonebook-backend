require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()

app.use(express.static('dist'))
app.use(express.json())

app.use(cors())

morgan.token('body', (request,) => JSON.stringify(request.body))

app.use(morgan('tiny', { skip: (request,) => request.method === 'POST' }))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body', {
  skip: (request,) => request.method !== 'POST'
}))

app.get('/api/persons', (request, response) => {
  Person.find({})
    .then(notes => response.json(notes)
    )
})

app.get('/info', (request, response) => {
  const now = new Date().toString()
  Person.countDocuments()
    .then(count => response.send(`
            <div>
                <p>Phonebook has info for ${count} people</p>
                <p>${now}</p>
            </div>`))
})

app.get('/api/persons/:id', (request, response, next) => {
  console.log('Getting by ID')
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const { name, number } = request.body
  console.log('updating...')
  Person.findByIdAndUpdate(
    request.params.id,
    { name, number },
    { new: true, runValidators: true, context: 'query' }
  )
    .then(updatedPerson => response.json(updatedPerson))
    .catch(error => next(error))
})


app.post('/api/persons', (request, response, next) => {
  const { name, number } = request.body
  console.log('posting...')
  const newPerson = new Person({
    name: name,
    number: number,
  })
  console.log('it gets here')
  newPerson.save()
    .then(savedPerson => response.json(savedPerson))
    .catch(error => next(error))
  console.log('and here??')
})

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

const errorHandler = (error, request, response, next) => {
  console.log('This is running???')
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)
