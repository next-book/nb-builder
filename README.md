> **Deprecated**: nb-builder was the first experimental next-book publishing tool, written as prototype and a proof of concept. It is followed by [nb-mapper](https://github.com/next-book/nb-mapper) (generator) and [nb-base](https://github.com/next-book/nb-base) (browser functionality).

# nb-builder

Next Book building tool.

## Use

```bash
git clone https://github.com/next-book/nb-builder.git .
yarn install
npm link
nb-build --src ./src --out ./out --owner "John Doe" --hash "abcdefgh"
```


- Above values are defaults, any params may be omitted.
- `--src` directory needs to be a git repo.
