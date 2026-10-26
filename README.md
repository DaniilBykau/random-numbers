# Random numbers

An Angular app that generates random numbers with a target average and a maximum allowed difference between the values. The actual difference can be smaller than the requested maximum.

## Run locally

```powershell
cd random-numbers-app
npm ci
npm start
```

Open `http://localhost:4200/`.

## GitHub Pages

The `master` branch is deployed to [GitHub Pages](https://daniilbykau.github.io/random-numbers/) by `.github/workflows/pages.yml`. The workflow builds Angular with the `/random-numbers/` base path and publishes the browser output.
