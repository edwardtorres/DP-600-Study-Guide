// Azure Static Web Apps (Free plan) for Fabric Mill, the DP-600 study game.
// Deploy into a resource group from Azure Cloud Shell; see DEPLOY.md.
// The site's files are uploaded by the GitHub Actions workflow with a deployment token, so no repository link or
// token is stored in this template.

@description('Name of the Static Web App (letters, numbers, and hyphens). Azure generates the public hostname.')
@minLength(2)
@maxLength(40)
param name string

@description('Region for the app resource. Static Web Apps serves the files from a global network; this only sets where the resource lives. Pick a region that Static Web Apps supports and your subscription allows (DEPLOY.md step 2).')
param location string = 'eastus2'

@description('Tags for cost tracking.')
param tags object = {
  project: 'dp600-fabric-mill'
  environment: 'production'
}

resource site 'Microsoft.Web/staticSites@2025-03-01' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    // Deployed from GitHub Actions (upload with a deployment token), not a linked repository.
    allowConfigFileUpdates: true
    stagingEnvironmentPolicy: 'Enabled'
  }
}

@description('The default hostname, e.g. something-random-1234.azurestaticapps.net. The dp600 CNAME points here.')
output defaultHostname string = site.properties.defaultHostname

@description('The resource name (use it to get the deployment token and add the custom domain).')
output staticWebAppName string = site.name
