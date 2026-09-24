# Nottsvale Materials: Power Platform maintenance system

A portfolio build by David Kilgallon ([davidkilgallon.dev](https://davidkilgallon.dev)). Nottsvale Materials Ltd is a fictional UK manufacturer with three sites (Warrington Works, Wakefield Plant and Wigan Site). This repo holds what you need to rebuild its maintenance system in your own environment.

**Video series:** [add links here]

## What's in the build

- **Dataverse model:** Site, Asset and Maintenance Request tables with relationships, views and forms. A business rule makes Description required when a request's priority is Critical. A `Nottsvale Engineer` security role sits on top.
- **Canvas app:** Nottsvale Request Logger, a phone app for logging faults on the shop floor.
- **Model-driven app:** Nottsvale Maintenance Desk, for triaging and managing requests, with an embedded Power BI report.
- **Code app:** Nottsvale Floorplan, built in React and TypeScript. It places assets on a floor plan for each site and shows their open requests.
- **Power BI report:** connected to Dataverse, with Total Requests, Open Requests and Total Downtime Hours measures.
- **SharePoint:** a contractor induction list and three sample documents for a maintenance records library.

## Repo layout

| Folder | Contents |
|---|---|
| `/solution` | The unmanaged solution zip. This is what you import. |
| `/data` | Sample data exported with the Configuration Migration Tool. |
| `/powerbi` | The `.pbix` report. |
| `/sharepoint` | Contractor induction CSV and three sample maintenance documents. |
| `/code-app` | Source for the Floorplan code app. |
| `/docs` | The code app build guide and the floorplan bug log (PDF). |

## What you need

- A Microsoft work or school account. A free Power Apps Developer Plan account works and is what I'd suggest.
- A Power Platform environment **with Dataverse** (step 1 below).
- A Windows PC for the Configuration Migration Tool, which is Windows only.
- Power BI Desktop and a Power BI workspace, if you want the report.
- A SharePoint site, if you want the contractor list and sample documents.
- Node.js and the Power Apps CLI, only if you want to change or redeploy the code app.

## Import order

Do these in order. Later steps depend on earlier ones. Steps 6 to 8 are optional extras.

### 1. Create an environment

1. Go to the Power Platform admin centre (admin.powerplatform.microsoft.com), then Environments, then New.
2. Give it a name (for example `Nottsvale Dev`). Set the type to **Developer** and choose your region.
3. Turn on **Add a Dataverse data store**. Set the language to English and the currency to your own. The currency can't be changed later, so choose carefully. Create it and wait until its state shows Ready.

### 2. Import the solution

1. Go to make.powerapps.com and use the environment picker at the top right to select your new environment.
2. Go to Solutions, then Import solution, then Browse, and choose `solution/NottsvaleMaintenance_1_0_0_1.zip` from this repo.
3. Select Next. If it asks you to create or select a connection, sign in and continue. Then select Import and wait for the success message.
4. Open the **Nottsvale Maintenance** solution. You should see the three tables, the `Nottsvale Engineer` role, the business rule, two dashboards, the model-driven app, the canvas app and the code app.
5. Select **Publish all customisations**.

The import may warn about Microsoft's own platform solutions (names starting `msdyn_`). A normal Dataverse environment already has them, so this is expected. If the import fails and names a missing solution, update your environment or try again later.

### 3. Import the sample data

The data zip loads 3 sites, 23 assets and the maintenance requests, with their relationships intact. Import the solution first, because the tables must already exist.

1. Get the Configuration Migration Tool. **Use version 9.1.0.185.** The latest version (9.1.0.365) crashes on startup on current Windows 11 builds, with no window and no error message. This is a known bug, and the older version works.
   - Go to nuget.org and search for `Microsoft.CrmSdk.XrmTooling.ConfigurationMigration.Wpf`, open the **Versions** tab, choose **9.1.0.185**, then **Download package**.
   - Rename the `.nupkg` file to `.zip`, right-click it, choose Properties and tick **Unblock** if it's shown, then extract it to a short path such as `C:\CMT`.
   - Run `tools\DataMigrationUtility.exe`.
   - Alternatively, `pac tool cmt` installs the latest version, which currently has the bug.
2. Choose **Import data**.
3. Choose Office 365 as the deployment type, tick the option to display the list of available organisations, and sign in.
4. Select your environment and log in.
5. Browse to `data/NottsvaleData.zip` and start the import. The tool handles the order between the tables itself. Wait for it to finish and check the log for errors.
6. In Power Apps, open the Site, Asset and Maintenance Request tables and confirm rows are there.

### 4. Assign the security role

1. In the Power Platform admin centre, open your environment, then Settings, then Users + permissions, then Users.
2. Select a user, choose Manage security roles, and tick `Nottsvale Engineer`.

The role only carries privileges on Maintenance Request. If the site or asset lookups look empty for a non-admin user, also give them read access to Site and Asset.

### 5. Open the apps

In Power Apps, go to Apps. You should see **Nottsvale Request Logger** (canvas), **Nottsvale Maintenance Desk** (model-driven) and **Nottsvale Floorplan** (code app). Open each one and sign in to any connection it asks for. To let other people use them, share the apps and give those people a security role.

A quick check that everything works: log a request in the Request Logger, find it in the Maintenance Desk, and see it against its asset in the Floorplan.

### 6. SharePoint (optional)

1. Create a SharePoint team site.
2. Create a list from `sharepoint/Contractor Inductions.csv` (New, then List, then From CSV). Check the column types afterwards: dates as Date, Documents Received as Yes/No, Site as a choice of the three sites. The dates are US format (M/D/YYYY), so check they've read correctly if your site uses UK regional settings.
3. Upload the three `.docx` files in `sharepoint` to a document library if you want the retention demo from the video series.

### 7. Power BI (optional)

1. Open `powerbi/Maintenance Dash.pbix` in Power BI Desktop.
2. Find your environment URL in the Power Platform admin centre, on the environment's details page.
3. Go to Home, then Transform data, then Data source settings. Change the source to your own environment URL and sign in with your account. Apply the changes and refresh.
4. Publish the report to one of your workspaces.
5. In the Power BI service, open the report and pin its visuals to a new dashboard.

### 8. Reconnect the dashboard (optional)

The **Maintenance Report** dashboard in the model-driven app points at my Power BI workspace, so it shows an error in your environment until you repoint it.

1. In Power Apps, open the Nottsvale Maintenance solution and open the Maintenance Report dashboard.
2. Select your own workspace and report from the Power BI settings, then save and publish.
3. If it won't let you edit it, delete it, then add a Power BI page to the Maintenance Desk in the app designer that points at your report.

### 9. Changing the code app (optional)

The code app already came in with the solution. Only do this if you want to change the code. See `code-app/README.md`.

## Known limitations

- **Assigned Engineer** isn't included in the sample data. Users from the original tenant don't exist in yours, so those values were left out.
- **Power BI** connections and workspace IDs belong to the original workspace, so steps 7 and 8 are manual.
- **Tenant setup isn't in this repo.** Entra users and groups, Conditional Access, Purview retention and sensitivity labels, and the DLP policy can't be exported as a solution. The video series shows them. Your own tenant's DLP policies may also block connectors the apps use.
- **No ALM pipeline.** A trial or developer environment has limited capacity, so I couldn't demonstrate a live deployment pipeline.

## Updating this repo (maintainer notes)

- **Solution:** in Power Apps, open the solution, publish all customisations, then Export as **unmanaged**. Replace the zip in `/solution`.
- **Data:** in the Configuration Migration Tool choose Create schema, sign in, and tick Site, Asset and Maintenance Request. On Maintenance Request untick Assigned Engineer. On Asset untick the currency field so the target environment's default applies. Then Save and Export, and save the data as `data/NottsvaleData.zip`.
- **Before committing:** search the files for your environment URL, tenant domain, real email addresses and IDs in config files.

## Licence

MIT. See `LICENSE`.
