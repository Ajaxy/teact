# Security policy

## Reporting a vulnerability

Please report security vulnerabilities in Teact privately, through GitHub: open the repository's **Security** tab and choose **Report a vulnerability**, or go to https://github.com/Ajaxy/teact/security/advisories/new. Do not open a public issue or pull request for a vulnerability.

A useful report includes the affected version of `@teact/core`, a minimal reproduction, and what an attacker can achieve with it. The maintainers follow up in the private advisory.

Vulnerabilities in the apps that use Teact belong to those apps: [Telegram Web A](https://github.com/Ajaxy/telegram-tt) and [MyTonWallet](https://github.com/mytonwallet-org/mytonwallet).

## Supported versions

Teact is in pre-release (0.x). Security fixes are released as a new version on the current release line: `next` until 0.1.0 is published, then `latest`. Older 0.x versions do not receive fixes.

## What the application is responsible for

Teact renders what the application gives it. Text children become text nodes, so rendering untrusted strings as children is safe. The following are passed to the DOM as they are, and making them safe is the application's responsibility; reports about them are not vulnerabilities in Teact, unless Teact itself produces the unsafe value:

- **`dangerouslySetInnerHTML={{ __html }}`** assigns `innerHTML` without sanitizing it. Sanitize untrusted HTML first, for example with an HTML sanitizer such as DOMPurify, or do not use the prop for it.
- **URL attributes**, such as `href`, `src`, `action`, `formAction` and the `href` of SVG elements, are set as given. Teact does not filter `javascript:` or other dangerous URLs. Check URLs that come from untrusted sources against the schemes you expect, such as `https:`.
- **`srcDoc`** sets an iframe's document as HTML. Treat it like `dangerouslySetInnerHTML`.
- **`style` strings** are assigned to `style.cssText` as they are.
- **Spread props.** Teact assigns most props as DOM properties, so spreading an untrusted object into an element's props (`<div {...untrusted}>`) can set any property, `innerHTML` included. Do not spread untrusted data into props.
