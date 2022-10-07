# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## NEXT
### Breaking Changes
- [DAVIAF-100] - Sending event `collage-fragment-loaded` when fragment is loaded instead of waiting until everything in fragment is resolved

### Fixed
- [DAVIAF-113] - Check for falsy href property of stylesheet because of jsdom css parser bug
- [DAVIAF-114] - Added missing main entry in package.json

### Added
- [DAVIAF-100] - Sending event `collage-fragment-loaded` when fragment is loaded


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
