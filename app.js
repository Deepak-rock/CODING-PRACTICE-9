const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())

const databasePath = path.join(__dirname, 'userData.db')
let database = null

const intializeDBAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`ERROR: ${error.message}`)
    process.exit(1)
  }
}

intializeDBAndServer()

const validPassword = password => {
  return password.length > 4
}

// API 1

app.post('/register/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)

  const selectUserQuery = `
    SELECT *
    FROM user
    WHERE username = '${username}';`

  const databaseUser = await database.get(selectUserQuery)

  if (databaseUser === undefined) {
    const createNewUser = `
        INSERT INTO
         user (username, name, password, gender, location)
        VALUES (
          '${username}',
          '${name}',
          '${hashedPassword}',
          '${gender}',
          '${location}'
        );`

    if (validPassword(password)) {
      await database.run(createNewUser)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

// API 2

app.post('/login/', async (request, response) => {
  const {username, password} = request.body

  const selectUserQuery = `
    SELECT *
    FROM user
    WHERE username = '${username}';`

  const databaseUser = await database.get(selectUserQuery)

  if (databaseUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatches = await bcrypt.compare(
      password,
      databaseUser.password,
    )
    if (isPasswordMatches === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

// API 3

app.put('/change-password/', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body

  const selectUserQuery = `
    SELECT *
    FROM user
    WHERE username = '${username}';`

  const databaseUser = await database.get(selectUserQuery)

  if (databaseUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatches = await bcrypt.compare(
      oldPassword,
      databaseUser.password,
    )
    if (isPasswordMatches === true) {
      
      if (validPassword(newPassword)) {
      const hashedNewPassword = await bcrypt.hash(newPassword, 10)
      const updatePasswordQuery = `
        UPDATE 
          user
        SET 
          password = '${hashedNewPassword}'
        WHERE 
          username = '${username}';`
        const user = await database.run(updatePasswordQuery)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }

    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
