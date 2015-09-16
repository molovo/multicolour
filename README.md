# Multicolour

### Still in development, all hands welcome.

The overall mission of this library is to make mundane CRUD API generation fast with a single page app frontend, easy and cost efficient by simplifying the work involved in creating RESTful services and apps.

You configure Multicolour and start writing models in the form of JSON and it handles the leg work for you.

We _**love**_ open source software and Multicolour is built atop [Waterline][waterline], [Hapi JS][hapi] and has JWT support (we're adding OAuth support now). It's also self documenting (yeah, really) using [Swagger][swagger].

Start by running `npm i -G multicolour` then you can start your API development with `multicolour init`, in your desired working folder to get started developing.

Run `multicolour -c config.js` to start your API server and head over to `http://localhost:1811/documentation` to get an idea on the default guff created by the `init` command.

## Authenticating

There are 2 ways to autheticate your consumer's requests, using [JWT][jwt] or by using [OAuth 2.0][oauth]. To do this you need to make a change to your Multicolour config file.  

It's important to first understand that when you enable authentication on your API, **ALL** your endpoints will be authenticated using this method and a few extra endpoints are created to get your consumers authenticating.  

When you enable authentication you will notice a new collection/table/bucket called `multicolour_users` which will contain the users to be authenticated details. You will also notice new endpoints in your documentation, these are to list, create, edit and delete `multicolour_users` as well as new endpoints based on the `/session` uri for authenticating users and getting access tokens.  

Authenticating with either JWT or OAuth requires the same payload and returns the same response.

```bash
curl \
  -X POST \
  -d '{ \
    "email": "your@email.com",
    "password": "password"
  }' \
  http://localhost:1811/session
```

Once the request has completed, you will get one of two responses based on the validation
of the credentials provided. In the event of a successful authorisation it will respond with a header `Authorization: "Your access token."` and the below

```json
{
  "success": true,
  "token": "Your access token."
}
```

or if the request fails to validate:

```json
{
  "success": false,
  "error": {
    "code": 404,
    "message": "Email or password incorrect."
  }
}
```

### JWT

To enable JWT authentication find the `auth` section and replace it with;

```js
auth: {
  provider: "token",
  privateKey: require("crypto").createDiffieHellman(600).generateKeys("base64")
},
```

## Contributing

Track progress or pick a task [here][todo] if you want to help Multicolour reach version 1.0.

More coming soon.

[todo]: https://github.com/newworldcode/multicolour/issues/1
[waterline]: https://github.com/balderdashy/waterline
[hapi]: http://hapijs.com
[bell]: https://github.com/hapijs/bell
[swagger]: https://github.com/glennjones/hapi-swagger
[jwt]: http://jwt.io/
[oauth]: http://oauth.net/2/
