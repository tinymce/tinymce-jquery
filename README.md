# Official TinyMCE jQuery integration

## About

Official jQuery integration for TinyMCE, the rich text editor. It adds a custom `.tinymce()` function to jQuery so an editor can be initialized by invoking `$(<selector>).tinymce()`. By default, it pulls TinyMCE from the Tiny Cloud CDN unless configured to use a different setup, such as self-hosting the [tinymce NPM package](https://www.npmjs.com/package/tinymce).

## Quickstart

### Cloud CDN

1. [Sign up for a Tiny Cloud account](https://www.tiny.cloud/pricing/) to receive a Tiny Cloud API key.
1. Then in your project:
    1. Include the following script tags to load jQuery, TinyMCE, and the jQuery integration:

        ```html
        <script
          src="https://code.jquery.com/jquery-4.0.0.min.js"
          integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
          crossorigin="anonymous"
        ></script>
        <script
          src="https://cdn.tiny.cloud/1/your-api-key/tinymce/8/tinymce.min.js"
          referrerpolicy="origin"
        ></script>
        <script src="https://cdn.jsdelivr.net/npm/@tinymce/tinymce-jquery/dist/tinymce-jquery.min.js"></script>
        ```
    1. Add a `textarea` to target and initialize the editor:

        ```html
        <textarea id="tiny"><p>Welcome to TinyMCE jQuery!</p></textarea>

        <script>
          $('textarea#tiny').tinymce({
            api_key: 'your-api-key',
            plugins: 'lists link image table code help wordcount'
          });
        </script>
        ```
    1. Update the `your-api-key` placeholders to include your Tiny Cloud API key.

For more information: [Using TinyMCE with jQuery - Cloud CDN](https://www.tiny.cloud/docs/tinymce/latest/jquery-cloud/)

### Self hosted via NPM package

Using TinyMCE from NPM in a jQuery project requires a couple of extra steps. See the documentation for more information: [Using TinyMCE with jQuery - Self hosted via NPM](https://www.tiny.cloud/docs/tinymce/latest/jquery-pm/)

## Demos

For our quick demos, check out the TinyMCE jQuery [Storybook](https://tinymce.github.io/tinymce-jquery/).

## Detailed documentation

* [TinyMCE Documentation](https://www.tiny.cloud/docs/tinymce/latest/).

## Issues

Have you found an issue with `tinymce-jquery` or do you have a feature request?
Open up an [issue](https://github.com/tinymce/tinymce-jquery/issues) and let us
know or submit a [pull request](https://github.com/tinymce/tinymce-jquery/pulls).
*Note: For issues concerning TinyMCE please visit the
[TinyMCE repository](https://github.com/tinymce/tinymce).*

## License

`tinymce-jquery` is licensed under the MIT License. See the LICENSE.txt file for details.

Depending on use case, the TinyMCE core editor can be used under either GPL-2.0-or-later or a commercial license. See the [tinymce package](https://www.npmjs.com/package/tinymce) for details.
