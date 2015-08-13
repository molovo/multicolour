# Multicolour

### This is still in development, all hands welcome.

Track progress or pick a task [here][todo] or if you think you can improve upon the code (it needs improving but getting version 1.0 out is more important) then fork and submit PRs.

The overall mission of this library is to make mundane CRUD API generation fast with a single page app frontend, easy and cost efficient by simplifying the work involved in creating RESTful services and apps.

You configure Multicolour and start writing models in the form of JSON and it handles the leg work for you.

We _**love**_ open source software and Multicolour is built atop [Waterline][waterline], [Hapi JS][hapi] and has full OAuth support via [Bell][bell] (we're going to add JWT support soon). It's also self documenting (yeah, really) using [Swagger][swagger].

You can also write middleware to add your business logic easily.

`npm i -G multicolour`

Then you can run `multicolour init` in your desired working folder to get started developing and

`multicolour -c config.js` to start your services, head over to `http://localhost:1811/documentation` to get an idea on the default guff created by init and the API.

More coming soon.

[todo]: https://github.com/newworldcode/multicolour/issues/1
[waterline]: https://github.com/balderdashy/waterline
[hapi]: http://hapijs.com
[bell]: https://github.com/hapijs/bell
[swagger]: https://github.com/glennjones/hapi-swagger
