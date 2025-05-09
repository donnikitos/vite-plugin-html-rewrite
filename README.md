# vite-plugin-html-rewrite

[![npm](https://img.shields.io/npm/dt/vite-plugin-html-rewrite?style=for-the-badge)](https://www.npmjs.com/package/vite-plugin-html-rewrite) ![GitHub Repo stars](https://img.shields.io/github/stars/donnikitos/vite-plugin-html-rewrite?label=GitHub%20Stars&style=for-the-badge) [![GitHub](https://img.shields.io/github/license/donnikitos/vite-plugin-html-rewrite?color=blue&style=for-the-badge)](https://github.com/donnikitos/vite-plugin-html-rewrite/blob/master/LICENSE)
![GitHub last commit](https://img.shields.io/github/last-commit/donnikitos/vite-plugin-html-rewrite?style=for-the-badge) [![Issues](https://img.shields.io/github/issues/donnikitos/vite-plugin-html-rewrite?style=for-the-badge)](https://github.com/donnikitos/vite-plugin-html-rewrite/issues)

A Vite plugin to rewrite HTML tags.

```ts
// vite.config.js
import { defineConfig } from 'vite';
import rewriteHTML from 'vite-plugin-html-rewrite';

export default defineConfig({
  plugins: [
    rewriteHTML([
      {
        match: (element) => element.name.startsWith('php-'),
        render({ name, ...elementDetails }) {
          return `<?php do_something('${name}', '${JSON.stringify(
            elementDetails,
          ).replaceAll("'", "\\'")}}$'); ?>`;
        },
      },
    ]),
  ],
});
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body>
    <php-header variant="dark" size="big">
      <a href="/">Home</a>
      <a href="/about">about</a>
    </php-header>

    <div>Here some ordinary content.</div>

    <php-footer src="src/partials/footer" />
  </body>
</html>
```

This will result in a dev and runtime generated index.html looking like

```php
<!-- generated index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body>
    <?php do_something('php-header', '{"attribs":{"variant":"dark","size":"big"},"attributes":[{"name":"variant","value":"dark"},{"name":"size","value":"big"}],"nodeType":1,"startIndex":231,"tagName":"php-header","type":"tag","innerHTML":"\n      <a href=\"/\">Home</a>\n      <a href=\"/about\">about</a>\n    "}}$'); ?>

    <div>Here some ordinary content.</div>

    <?php do_something('php-footer', '{"attribs":{"src":"src/partials/footer"},"attributes":[{"name":"src","value":"src/partials/footer"}],"nodeType":1,"startIndex":276,"tagName":"php-footer","type":"tag","innerHTML":""}}$'); ?>
  </body>
</html>
```

## Configuration

You are able to specify when the rewrites are going to happen.\
It's either `pre`, `post` or `undefined`. See [Vite's guide on `transformIndexHtml`](https://vite.dev/guide/api-plugin#transformindexhtml).\
Defaults is set **`pre`**, so before other hooks.

```ts
rewriteHTML([
  {
    order: 'post',
    match: (element) => element.name.startsWith('php-'),
    render({ name, ...elementDetails }) {
      return `<?php do_something('${name}', '${JSON.stringify(
        elementDetails,
      ).replaceAll("'", "\\'")}}$'); ?>`;
    },
  },
]);
```

## Interface

```ts
type Transformation = {
  order?: 'pre' | 'post' | undefined;
  match: (element: Element) => boolean;
  render: (
    elementDetails: Pick<
      Element,
      | 'attribs'
      | 'attributes'
      | 'name'
      | 'namespace'
      | 'nodeType'
      | 'startIndex'
      | 'tagName'
      | 'type'
      | 'x-attribsNamespace'
      | 'x-attribsPrefix'
    > & { innerHTML: string },
    index: number,
  ) => false | undefined | null | string;
};
```

## Support

Love open source? Enjoying my project?\
Your support can keep the momentum going! Consider a donation to fuel the creation of more innovative open source software.

| via Ko-Fi                                                                         | Buy me a coffee                                                                                                                                                 | via PayPal                                                                                                                                                             |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Y8Y2ALMG) | <a href="https://www.buymeacoffee.com/donnikitos" target="_blank"><img src="https://nititech.de/donate-buymeacoffee.png" alt="Buy Me A Coffee" width="174"></a> | <a href="https://www.paypal.com/donate/?hosted_button_id=EPXZPRTR7JHDW" target="_blank"><img src="https://nititech.de/donate-paypal.png" alt="PayPal" width="174"></a> |
