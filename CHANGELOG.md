# Change Log

## [0.4.2](https://github.com/Multicolour/multicolour/tree/0.4.2) (2016-08-19)
[Full Changelog](https://github.com/Multicolour/multicolour/compare/0.4.2...0.4.2)

**Fixed bugs:**

- Default env is development, should be production [\#82](https://github.com/Multicolour/multicolour/issues/82)
- Cannot read property identity of undefined. [\#81](https://github.com/Multicolour/multicolour/issues/81)
- Investigate failing tests but everything working.. [\#80](https://github.com/Multicolour/multicolour/issues/80)

## [0.4.2](https://github.com/Multicolour/multicolour/tree/0.4.2) (2016-08-12)
[Full Changelog](https://github.com/Multicolour/multicolour/compare/0.4.1...0.4.2)

**Implemented enhancements:**

- Plugins can extend core Plugin class [\#73](https://github.com/Multicolour/multicolour/issues/73)

**Closed issues:**

- Add better logging behind debug module [\#74](https://github.com/Multicolour/multicolour/issues/74)
- Uncaught error: reply\[multicolour.request\(...\)\] is not a function [\#72](https://github.com/Multicolour/multicolour/issues/72)
- Clean exit when running app.js without DB running [\#71](https://github.com/Multicolour/multicolour/issues/71)

## [0.4.1](https://github.com/Multicolour/multicolour/tree/0.4.1) (2016-08-05)
[Full Changelog](https://github.com/Multicolour/multicolour/compare/0.3.4...0.4.1)

**Implemented enhancements:**

- Add configuration validation [\#70](https://github.com/Multicolour/multicolour/issues/70)
- Multicolour user collection/table creation issues [\#69](https://github.com/Multicolour/multicolour/issues/69)
- ROBOTS.txt [\#55](https://github.com/Multicolour/multicolour/issues/55)
- Create an optional blueprint abstraction for granular route/FE control [\#53](https://github.com/Multicolour/multicolour/issues/53)
- Support path prefix [\#52](https://github.com/Multicolour/multicolour/issues/52)

**Fixed bugs:**

- Error with schema creation [\#48](https://github.com/Multicolour/multicolour/issues/48)

**Closed issues:**

- 0.3.2 Release [\#50](https://github.com/Multicolour/multicolour/issues/50)
- Integrate Sorrow [\#12](https://github.com/Multicolour/multicolour/issues/12)

## [0.3.4](https://github.com/Multicolour/multicolour/tree/0.3.4) (2016-03-10)
[Full Changelog](https://github.com/Multicolour/multicolour/compare/v0.2.9...0.3.4)

**Implemented enhancements:**

- Programatically add relationships to `multicolour\_user` [\#51](https://github.com/Multicolour/multicolour/issues/51)
- 2 Blueprints but 3 resources is confusing [\#46](https://github.com/Multicolour/multicolour/issues/46)
- Replace hapi-swaggered-ui [\#45](https://github.com/Multicolour/multicolour/issues/45)

**Fixed bugs:**

- `.stop\(\)` doesn't run the teardown routine on the db [\#49](https://github.com/Multicolour/multicolour/issues/49)
- 'undefined' not recognised. Not good, setting to .any\(\) [\#47](https://github.com/Multicolour/multicolour/issues/47)
- User parameters string is very long in Swagger [\#41](https://github.com/Multicolour/multicolour/issues/41)

## [v0.2.9](https://github.com/Multicolour/multicolour/tree/v0.2.9) (2016-02-08)
**Implemented enhancements:**

- Add nedb adapter for database [\#38](https://github.com/Multicolour/multicolour/issues/38)
- Better constraints. [\#34](https://github.com/Multicolour/multicolour/issues/34)
- Data layer should be in Multicolour core [\#33](https://github.com/Multicolour/multicolour/issues/33)
- Missing role support for users [\#32](https://github.com/Multicolour/multicolour/issues/32)
- Remove any default migration policy. [\#28](https://github.com/Multicolour/multicolour/issues/28)
- Disable overly protective migrate default from "safe" to "alter" [\#25](https://github.com/Multicolour/multicolour/issues/25)

**Fixed bugs:**

- Default migration policy appears to be "alter" [\#43](https://github.com/Multicolour/multicolour/issues/43)
- Missed multicolour-auth-oauth module in CLI [\#39](https://github.com/Multicolour/multicolour/issues/39)
- CLI bashing config and not respecting path [\#36](https://github.com/Multicolour/multicolour/issues/36)
- Data layer should be in Multicolour core [\#33](https://github.com/Multicolour/multicolour/issues/33)
- REST API GET handling by id \(non-existent objects\) [\#31](https://github.com/Multicolour/multicolour/issues/31)
- CLI outdated [\#30](https://github.com/Multicolour/multicolour/issues/30)
- 500 on POST /user caused by incorrectly handled waterline validation error. [\#29](https://github.com/Multicolour/multicolour/issues/29)
- Remove any default migration policy. [\#28](https://github.com/Multicolour/multicolour/issues/28)
- Don't default the migration policy to "alter" [\#27](https://github.com/Multicolour/multicolour/issues/27)
- Throwing error in multicolour start and not db start prevents error reporting [\#26](https://github.com/Multicolour/multicolour/issues/26)
- Disable overly protective migrate default from "safe" to "alter" [\#25](https://github.com/Multicolour/multicolour/issues/25)
- Fix PUT and PATCH [\#23](https://github.com/Multicolour/multicolour/issues/23)
- Identity in blueprints not respected [\#21](https://github.com/Multicolour/multicolour/issues/21)

**Closed issues:**

- Can't seed app generated with CLI [\#42](https://github.com/Multicolour/multicolour/issues/42)
- Mongodb kerberos peer dependency [\#40](https://github.com/Multicolour/multicolour/issues/40)
- Create Example app [\#35](https://github.com/Multicolour/multicolour/issues/35)
- API docs/WIKI [\#18](https://github.com/Multicolour/multicolour/issues/18)
- Blueprint -\> Frontend route/collection/model generation. [\#17](https://github.com/Multicolour/multicolour/issues/17)
- Custom, additional route creation in blueprints. [\#15](https://github.com/Multicolour/multicolour/issues/15)
- Create CLI [\#14](https://github.com/Multicolour/multicolour/issues/14)
- Make it all JSON API compliant [\#13](https://github.com/Multicolour/multicolour/issues/13)
- Paginate GET requests [\#10](https://github.com/Multicolour/multicolour/issues/10)



\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*