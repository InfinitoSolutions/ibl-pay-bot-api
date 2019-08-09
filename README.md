 # 1. How to code
 ## 1.1. How to handle error / exception
 ## 1.2. How to create event
 - Add a new event registration in app.js
 
    `app.on('LoginFailed', require('./events/handlers/auth/loginFailed'))`
 
 - Create a new file with the registered path (in this example is `events/handlers/auth/loginFailed.js`)
 
 - Emit the event when needed (NOTE: use `async / await` if you return a Promise from the event handler):
 
 `res.app.emit('LoginFailed', req, res, {message: 'Email does not exists'})`
 
 - Handle the event as you need
 
 ##1.3. How to add activity log
 - Activity log needs to be handle in an event handler (see 3.2)
 - Example:
 
 ```
return rabbitmq.send('activityLog', JSON.stringify({
    type: "LoginFailed",
    reason: data.message,
    info: {
      ip_address: req.headers['x-real-ip'],
      user_agent: req.headers['user-agent']
    }
  }))
```   
 
 ##1.4. Queue
 RabbitMQ is implemented for handling long running tasks (e.g. sending emails).
 
 To send a message to RabbitMQ, use the following code (normally placed in an event handler):
 
 ```$xslt
  return rabbitmq.send('activityLog', JSON.stringify({
    type: "LoginFailed",
    reason: data.message,
    info: {
      ip_address: req.headers['x-real-ip'],
      user_agent: req.headers['user-agent']
    }
  }))
``` 
To create a worker for this queue, add a new file in `./workers` directory. Below is example from activity logging worker:

```$xslt
const botDb = require('app/models/bot')

module.exports = (message, channel) => {
  botDb.activityLog.create({
    data: message.content.toString()
  }).then(() => {
    channel.ack(message)
  })
}

```
 
 And finally register the worker in `./bin/worker`. On the following line add your queue:
 
 `const queues = ['activityLog', 'sendEmail']`
  
## 1.5. Validation
We are validating request inputs using the library [Indicative](http://indicative.adonisjs.com) in the middleware layer.

To make a validation, first you should create a file in `./validations path` e.g. `./validations/auth/login.js`:
```
module.exports = {
  email: 'required|email',
  password: 'required|min:8|max:21'
}
```
And then register the validation in route:
```
const validator = require('../middlewares/validator')

router.post('/login', validator({rules: require('../validations/auth/login')}), authController.login)
```

## 1.6. Responses
### HTTP Status Codes

- 200: Success

- 400: Validation & processing errors

- 401: Authentication failed

- 403: Permission Denied (do not have permission on a particular action)

- 404: Not found (Request a nonexistent record)

### Error messages

By default, error messages will be responded in 2 ways:

- For validation on input fields, always using the format `key: message`. Example:
```
{
    "status": "error",
    "message": {
        "email": "Email format is invalid",
        "password": "Password must have at least 8 characters"
    }
}
```
- For general errors while processing, the response can be like below:
```
{
    "status": "error",
    "message": "Error proccessing."
}
```

### Sucessful responses

When the request is validated and process successfully, response will be like below:
```
{
    "status": "success",
    "data": {
        "id": 1,
        "first_name": "Viet",
        "last_name": "Nguyen",
        "email": "vietnh@gemvietnam.com",
        "created_at": "2018-10-18T02:36:29.361Z",
        "updated_at": "2018-11-02T04:00:53.458Z"
    }
}
```

### Captcha validation
To validate captcha on server side, please add the following line to .env:
```
GOOGLE_RECAPTCHA_VERIFY_URL=https://www.google.com/recaptcha/api/siteverify
```
