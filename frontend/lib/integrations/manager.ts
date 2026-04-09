import { GoogleSheetsIntegration } from './google-sheets'
import { HubSpotIntegration } from './hubspot'
import { BigQueryIntegration } from './bigquery'
import { MailchimpIntegration } from './mailchimp'
import { SalesforceIntegration } from './salesforce'

export type IntegrationTarget =
  | 'google_sheets'
  | 'bigquery'
  | 'hubspot'
  | 'mailchimp'
  | 'salesforce'

export interface IntegrationResult {
  target: IntegrationTarget
  status: 'fulfilled' | 'rejected'
  data: any
  error: string | null
}

// Singleton instances to prevent duplicate pushes
let googleSheetsInstance: GoogleSheetsIntegration | null = null
let hubspotInstance: HubSpotIntegration | null = null
let bigqueryInstance: BigQueryIntegration | null = null
let mailchimpInstance: MailchimpIntegration | null = null
let salesforceInstance: SalesforceIntegration | null = null

export class IntegrationManager {
  private integrations: Record<IntegrationTarget, any>

  constructor() {
    // Use singleton instances to prevent creating new ones on each request
    if (!googleSheetsInstance) googleSheetsInstance = new GoogleSheetsIntegration()
    if (!hubspotInstance) hubspotInstance = new HubSpotIntegration()
    if (!bigqueryInstance) bigqueryInstance = new BigQueryIntegration()
    if (!mailchimpInstance) mailchimpInstance = new MailchimpIntegration()
    if (!salesforceInstance) salesforceInstance = new SalesforceIntegration()

    this.integrations = {
      google_sheets: googleSheetsInstance,
      hubspot: hubspotInstance,
      bigquery: bigqueryInstance,
      mailchimp: mailchimpInstance,
      salesforce: salesforceInstance,
    }
  }

  async pushToIntegrations(
    data: any,
    targets: IntegrationTarget[],
    credentials: Record<string, any>
  ): Promise<IntegrationResult[]> {
    console.log(`Pushing to ${targets.length} integration(s):`, targets)

    const results = await Promise.allSettled(
      targets.map(async (target) => {
        const integration = this.integrations[target]

        if (!integration) {
          throw new Error(`Unknown integration: ${target}`)
        }

        console.log(`Processing integration: ${target}`)
        const config = credentials[target]

        if (!config) {
          throw new Error(`Missing configuration for integration: ${target}`)
        }

        return await integration.push(data, config)
      })
    )

    return results.map((result, index) => ({
      target: targets[index],
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error:
        result.status === 'rejected'
          ? (result.reason as Error).message || 'Unknown error'
          : null,
    }))
  }

  /**
   * Push to a single integration target
   */
  async pushToSingle(
    data: any,
    target: IntegrationTarget,
    config: any
  ): Promise<IntegrationResult> {
    try {
      const integration = this.integrations[target]

      if (!integration) {
        throw new Error(`Unknown integration: ${target}`)
      }

      const result = await integration.push(data, config)

      return {
        target,
        status: 'fulfilled',
        data: result,
        error: null,
      }
    } catch (error: any) {
      return {
        target,
        status: 'rejected',
        data: null,
        error: error.message || 'Unknown error',
      }
    }
  }

  /**
   * Validate integration credentials before pushing
   */
  validateCredentials(target: IntegrationTarget, config: any): boolean {
    switch (target) {
      case 'google_sheets':
        return !!(config.spreadsheetId && config.sheetName)
      case 'bigquery':
        return !!(
          config.projectId &&
          config.datasetId &&
          process.env.GOOGLE_CLOUD_CREDENTIALS
        )
      case 'hubspot':
        return !!(
          config.listId &&
          process.env.HUBSPOT_ACCESS_TOKEN
        )
      case 'mailchimp':
        return !!(config.listId && process.env.MAILCHIMP_API_KEY)
      case 'salesforce':
        return !!(
          config.instanceUrl &&
          process.env.SALESFORCE_ACCESS_TOKEN
        )
      default:
        return false
    }
  }

  /**
   * Get list of available integrations
   */
  getAvailableIntegrations(): IntegrationTarget[] {
    return Object.keys(this.integrations) as IntegrationTarget[]
  }

  /**
   * Check which integrations are properly configured
   */
  getConfiguredIntegrations(): IntegrationTarget[] {
    const configured: IntegrationTarget[] = []

    if (process.env.GOOGLE_CLOUD_CREDENTIALS) configured.push('google_sheets')
    if (process.env.GOOGLE_CLOUD_CREDENTIALS) configured.push('bigquery')
    if (process.env.HUBSPOT_ACCESS_TOKEN) configured.push('hubspot')
    if (process.env.MAILCHIMP_API_KEY) configured.push('mailchimp')
    if (process.env.SALESFORCE_ACCESS_TOKEN) configured.push('salesforce')

    return configured
  }
}

export default IntegrationManager
