require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()

app.use(express.static('dist'))
app.use(express.json())

morgan.token('body', (req, res) => JSON.stringify(req.body))

app.use(morgan('tiny', { skip: (req, res) => req.method === "POST" }))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body', {
    skip: (req, res) => req.method !== "POST"
}))

app.use(cors())

const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    }

    next(error)
}

app.use(errorHandler)

app.get('/api/persons', (request, response, next) => {
    Person.find({})
        .then(notes => response.json(notes))
        .catch(error => next(error))
})

app.get('/info', (request, response, next) => {
    const now = new Date().toString();
    Person.countDocuments()
        .then(count => response.send(`
            <div>
                <p>Phonebook has info for ${count} people</p>
                <p>${now}</p>
            </div>`))
        .catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
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
        .then(result => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
    const body = request.body

    const person = {
        number: body.number,
    }

    Person.findByIdAndUpdate(request.params.id, person, { new: true })
        .then(updatedPerson => response.json(updatedPerson))
        .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
    const body = request.body

    if (body.name === undefined) {
        return response.status(400).json({ error: 'name missing' })
    }

    if (body.number === undefined) {
        return response.status(400).json({ error: 'number missing' })
    }

    const newPerson = new Person({
        name: body.name,
        number: body.number,
    })

    newPerson.save()
        .then(newPerson => response.json(newPerson))
        .catch(error => next(error))
})

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
