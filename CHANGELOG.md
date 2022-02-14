# Change log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Initial release of the TinyMCE jQuery integration as a separate node module.

### Changed
- The `$(e).tinymce({...})` now returns a `Promise` of all initialized editors instead of the `this` object.
- The `$(e).tinymce()` now returns `undefined` when no editor is present instead of `null`.

### Fixed
- Removing an element destroys all nested editors.