# Gaffer-Generator

My old Gaffer is tired of writing code, so he generates it instead! This is how he does it.

![](https://media.giphy.com/media/Tf1wxPaCbXzCE/giphy.gif)

## Requirements

Install the latest LTS of NodeJS. Or a version around v8.11.3. Or try whatever you've got installed already, maybe it will work!
https://nodejs.org/en/

Also install `yarn`. Or don't, and use `npm` instead.
https://yarnpkg.com/en/

```$bash
yarn global add gaffer-generator
```
or
```$bash
npm install -g gaffer-generator
```

Alternatively, `npx` is a useful way to run this.
https://www.npmjs.com/package/npx

## Let's see it in action!

This project is written in a platform and language agnostic way. It contains several limited scripts that find your templates, and then it generates code based on them.

You'll have an easier time understanding it if you see it in action, so do the following:

```$bash
> mkdir testing-gaffer-generator
> cd testing-gaffer-generator
> gaffer-generator create
> gaffer-generator generate
```

You should see output similar to the following:

```$bash

> gaffer-generator generate

[15:20:31] creating: sample.output/date-parser.ts
[15:20:31] creating: sample.output/is-set.ts
[15:20:31] creating: sample.output/models/day-of-week.ts
[15:20:31] creating: sample.output/models/address.ts
[15:20:31] creating: sample.output/models/geo-point.ts
[15:20:31] creating: sample.output/models/geo-polygon.ts
[15:20:31] creating: sample.output/models/geo-rectangle.ts
[15:20:31] creating: sample.output/models/page-index.ts
[15:20:31] creating: sample.output/models/paging.ts
[15:20:31] creating: sample.output/models/index.ts
[15:20:31] creating: sample.output/services/address.service.ts
[15:20:31] creating: sample.output/services/index.ts
[15:20:31] Finished 'default' after 341 ms
```

## What happened?

Let's break down the discrete steps that happened above:

1. We search the current directory recursively for `.templateroot` directories.
2. When one is found, we read in the `template.js` file (it should be a CommonJS module).
3. Call the `download` method of this file, which should return a promise that eventually resolves to any JSON describing what you want to generate.
4. Using the exported `into` property from the `template.js`, we'll recursively look at all of the other files within the `.templateroot`.
5. When we find a directory, recurse in to it!
6. When we find a file, parse it as a [lodash template](https://lodash.com/docs/4.17.11#template). The context will be whatever was returned from the `download` promise above, plus any exported methods of our `template.js` will be exposed on the `utils` object.
7. When we find a variable in the path, like `_fileName_.ts`, evaluate it based on our context from `download`.
8. When we find a `_each` in the path, like `_eachEnum.fileName_.ts`, expand it out. This lets us generate many files from a single template.

## How do I get started?

Create a `sample.templateroot` in your project:

```$bash
gaffer-generator create path/where/you/want/your/clientsdk.templateroot
```

Keep it under source control, and update it to generate based on your own metadata JSON, and desired client language.

It's also recommended that the generated output be placed under source control. This way, whenever you generate new code, you can see exactly what changed.

When you want to generate code, run `gaffer-generator generate` within that project. Point it at the root of your project, and enjoy your newly generated code! (Tip: you can have as many `.templateroot`s as you need.)

## Flags

There are several flags you can pass. To see them, run `gaffer-generator --help`!

## Testing

```$bash
yarn test
```
