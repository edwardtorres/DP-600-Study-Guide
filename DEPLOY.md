# Deploying Fabric Mill to Azure Static Web Apps

This is the runbook for putting the app online at **https://dp600.edwardtorres.dev** on the Static Web Apps **Free** plan,
the same way as the AZ-900 study app. You run every account step yourself. The only secret is a deployment token, and it
goes straight into a GitHub repository secret. Never paste it into a file, a commit, an issue, or a chat.

**What you'll have at the end**
- A Static Web App in its own resource group, created from `infra/main.bicep`.
- `.github/workflows/deploy.yml`: on every push to `main` it runs `npm run check`, the build (with the bundle check),
  the e2e flows, and the production e2e. It deploys only if all of them pass. Pull requests run the checks only.
- The custom domain `dp600.edwardtorres.dev`, a Cloudflare CNAME (DNS only) validated by Azure, with a free certificate.

---

## 1. Create the Static Web App from Azure Cloud Shell

1. Open <https://shell.azure.com> (or the **Cloud Shell** button in the Azure portal) and choose **Bash**.
2. Check the subscription and register the provider (harmless if it's already registered):

```bash
az account show --query "{name:name, id:id}" -o table
az provider register --namespace Microsoft.Web --wait
```

## 2. Pick a region and deploy `main.bicep`

Static Web Apps is offered in a limited set of regions, and some subscriptions have an allowed-locations policy.
Pick a region that appears in **both** lists:

```bash
# Regions where Static Web Apps can be created:
az provider show --namespace Microsoft.Web \
  --query "resourceTypes[?resourceType=='staticSites'].locations | [0]" -o tsv

# Regions your subscription allows (empty output = no region policy):
az policy assignment list --disable-scope-strict-match \
  --query "[?parameters.listOfAllowedLocations].parameters.listOfAllowedLocations.value | []" -o tsv
```

The region only sets where the resource record lives; Static Web Apps serves the files from a global network.

```bash
git clone https://github.com/edwardtorres/dp-600-study-guide.git
cd dp-600-study-guide

REGION=eastus2              # the region you picked
RG=rg-dp600-fabric-mill
APP=dp600-fabric-mill       # letters, numbers, hyphens

az group create --name $RG --location $REGION --tags project=dp600-fabric-mill

az deployment group create \
  --resource-group $RG \
  --template-file infra/main.bicep \
  --parameters name=$APP location=$REGION \
  --query properties.outputs
```

Note `defaultHostname` from the output (something like `random-words-1234.azurestaticapps.net`). You need it in step 5.

## 3. Put the deployment token in a GitHub secret

```bash
az staticwebapp secrets list --name $APP --resource-group $RG --query "properties.apiKey" -o tsv
```

Copy the value it prints, then save it in GitHub. Don't save it anywhere else.
- **Website:** the repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
  - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
  - Secret: paste the value
- **Or the GitHub CLI** on your own computer. It prompts for the value, so the value never reaches your shell history:
  `gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --repo edwardtorres/dp-600-study-guide`

If the token ever leaks, reset it and update the secret:
`az staticwebapp secrets reset-api-key --name $APP --resource-group $RG`

## 4. Run the first deploy

1. GitHub → **Actions** → **Deploy to Azure Static Web Apps** → **Run workflow** on `main`.
2. The `verify` job runs first: checks, build, e2e, and production e2e. Then `deploy` uploads `dist/`.
3. Open `https://<defaultHostname>` and check the headers:

```bash
curl -sI https://<defaultHostname>/ | grep -iE "content-security-policy|strict-transport|x-frame-options"
```

## 5. Cloudflare DNS: point `dp600` at the Static Web App

In the Cloudflare dashboard, open the `edwardtorres.dev` zone, then go to **DNS** → **Records** → **Add record**:

| Setting | Value |
|---|---|
| Type | `CNAME` |
| Name | `dp600` |
| Target | your `defaultHostname` from step 2 (no `https://`, no trailing slash) |
| Proxy status | **DNS only** (gray cloud). Azure must see the CNAME itself to validate the domain and issue the certificate. |
| TTL | Auto |

Check it from Cloud Shell. The answer should be your `defaultHostname`, not a Cloudflare address:

```bash
dig +short CNAME dp600.edwardtorres.dev
```

## 6. Azure: add and validate the custom domain

Microsoft Learn: [Set up a custom domain in Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/custom-domain-external),
and the [`az staticwebapp hostname`](https://learn.microsoft.com/en-us/cli/azure/staticwebapp/hostname) reference.

**Portal:**
1. Go to the Static Web App → **Settings** → **Custom domains** → **+ Add** → **Custom domain on other DNS**.
2. Enter `dp600.edwardtorres.dev` → **Next**.
3. Set the hostname record type to **CNAME** → **Add**.

**Or the CLI:** CNAME validation (`cname-delegation`) is the default method.

```bash
az staticwebapp hostname set --name $APP --resource-group $RG --hostname dp600.edwardtorres.dev
az staticwebapp hostname show --name $APP --resource-group $RG --hostname dp600.edwardtorres.dev --query status -o tsv
```

Learn notes that validation depends on DNS propagation and can take a while. If it fails, add the domain again later.
When the status is `Ready`, open https://dp600.edwardtorres.dev. `.dev` domains are HTTPS-only in browsers, so the site
won't load until the free certificate is issued.

Leave the Cloudflare record on **DNS only** afterwards too. Proxying it would put Cloudflare's certificate and caching
in front of Azure's.

## 7. Check the live site

Tell Claude it's live, or run the production specs against it yourself:

```bash
E2E_BASE_URL=https://dp600.edwardtorres.dev npm run e2e:live
```

They run at 1440 px and 390 px. They check the headers, the CSP, the fallback and 404 page, offline use, the manifest,
and the main screens with axe. They don't use the dev-only `?seed=` or `?mock=short` hooks, which production doesn't have.

## Moving your progress

Each browser keeps its own copy of your progress: the dev server, the live site, and your phone. Export from
**Settings** on the copy you want to keep, then import the file on the live site. On an iPhone, open the site in
Safari, choose Share → **Add to Home Screen**, and export your save from time to time (the app reminds you after 7 days).

## Tearing it down

```bash
az group delete --name rg-dp600-fabric-mill --yes --no-wait
```

Then delete the Cloudflare `dp600` record and the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret.

## What's in the repo for deployment

| File | What it does |
|---|---|
| `infra/main.bicep` | One `Microsoft.Web/staticSites` resource on the Free plan. Parameters: `name`, `location`, `tags`. Outputs: `defaultHostname`, `staticWebAppName`. |
| `.github/workflows/deploy.yml` | `verify` (check, build, e2e, production e2e), then `deploy` (main only) with `Azure/static-web-apps-deploy@v1`. It skips with a notice while the secret is missing. |
| `.github/workflows/freshness.yml` | Weekly: `check:freshness` and `check:content -- --live`. Opens or updates a `content-freshness` issue when Learn or the outline changed. |
| `public/staticwebapp.config.json` | SPA fallback, 404 page, the CSP and other security headers, and cache rules. `scripts/serve-dist.ts` applies the same file locally for the production e2e. |
| `public/manifest.webmanifest`, `public/icons/*`, `dist/sw.js` (generated) | Installable PWA; offline after the first visit; an update prompt. |
