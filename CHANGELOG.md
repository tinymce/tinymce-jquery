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

### Removed
- The `$(e).replaceAll(...)` is not patched and won't attempt to remove effected TinyMCE instances.
- The `$(e).replaceWith(...)` is not patched and won't attempt to remove effected TinyMCE instances.

### Fixed
- Removing an element with `$(e).remove()` destroys all contained editors.
- Removing child elements with `$(e).empty()` destroys all contained editors.
- Overwriting an element with `$(e).text(value)` or `$(e).html(value)` destroys all contained editors