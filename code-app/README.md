# Nottsvale Floorplan (code app)

A Power Apps code app built with React, TypeScript and Vite. It shows a floor plan for each Nottsvale site (Warrington Works, Wakefield Plant and Wigan Site), lets you place assets on the plan, and shows each asset's open maintenance requests.

## How it works

- Reads the Site, Asset and Maintenance Request tables from Dataverse through the generated services in `src/generated`.
- An asset's position is saved on its own record as two percentage coordinates (`nvm_planx` and `nvm_plany`). Assets without a position show in a "not yet placed" list.
- The floor plans are SVG files in `src/plans`.

## Run it locally

```
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run lint`, `npm run preview`.

## Deploy it to your own environment

The app already comes in with the solution in `../solution`, so you only need this if you change the code.

1. Open `power.config.json` and replace `REPLACE-WITH-YOUR-ENVIRONMENT-ID` with your own environment ID. `appId` is a placeholder too. It belongs to the original app, so it won't match anything in your environment.
2. Sign in with the Power Apps CLI (`pa auth`), build with `npm run build`, and publish with `pa app push`.

See Microsoft's Power Apps CLI documentation for the current options.

## Notes

- `src/generated` and `.power/schemas` are generated from the Dataverse tables by the CLI. Regenerate them if you change the table columns.
- A build guide and a bug log for this app are in `../docs`.
