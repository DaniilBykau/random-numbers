# Random numbers

An Angular app that generates random numbers within a range whose average matches a target value.

## Run locally

```powershell
cd random-numbers-app
npm ci
npm start
```

Open `http://localhost:4200/`.

## GitHub Pages

The `master` branch is deployed to [GitHub Pages](https://daniilbykau.github.io/random-numbers/) by `.github/workflows/pages.yml`. The workflow builds Angular with the `/random-numbers/` base path and publishes the browser output.
