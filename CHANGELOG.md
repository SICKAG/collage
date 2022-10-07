# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## NEXT
### Breaking Changes
- [DAVIAF-100] - Sending event `collage-fragment-loaded` when fragment is loaded instead of waiting until everything in fragment is resolved
- [DAVIAF-36] - API Change: Direct Functions: Context.children is now Context.fragments
- [DAVIAF-36] - API Change: Direct Functions: Direct functions now clustered in the functions property of a fragment ( now `Context.fragments.<fragment-name>.functions.<function-name>` instead of `Context.fragments.<fragment-name>.<function-name>`).
- [DAVIAF-36] - API Change: The `config`-property in the `Frontend Description Object` has changed to `fragmentsConfig`, to clarify that is is only for configuring of fragments and not the own context.
- [DAVIAF-36] - API Change: Unsubscribing from a topic now handled via unsubscribing callback

### Fixed
- [DAVIAF-94] - Services can not expose service functions and topics at the same level
- [DAVIAF-102] - Collage can`t handle http redirects
- [DAVIAF-113] - Check for falsy href property of stylesheet because of jsdom css parser bug
- [DAVIAF-114] - Added missing main entry in package.json
- [DAVIAF-117] - Importing collage leads to data-theme-state="pending" even if 'expose' is not used
- Using services with multiple arguments provide the arguments in an array within the service implementation

### Added
- [DAVIAF-100] - onLoaded() lifecycle hook 
- [DAVIAF-36] - onConfigUpdate() lifecycle hook
- [DAVIAF-36] - onContextUpdate() lifecycle hook


## 0.1.0

### Added
- **Expose capabilities** - Upgragde any web application to a micro frontend by exposing its capabilities.
- **Embedding of micro frontends** - Embed micro frontends in your application.
- **Configure embedded micro frontends** - Configure embedded micro frontends to fit them perfectly into your application.
- **Service API** - Provide services to other micro frontends and the whole Arrangement and use services, other Contexts are exposing.
- **Topic API** - Publish messages or subscribe to topics which are available for all parts of your application.


## 0.2.0

### Changed

- Toolchain update

## 0.2.1

### Changed

- Hardened use of global api. Use fallbacks where appropriate
- Topic listeners will always receive the last message (or null) when registered
