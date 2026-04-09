import { google } from 'googleapis'

interface GoogleSheetsConfig {
  spreadsheetId: string
  sheetName?: string
}

export class GoogleSheetsIntegration {
  private sheets: any

  constructor() {
    const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS
    if (!credentials) {
      console.warn('GOOGLE_CLOUD_CREDENTIALS not configured')
    }

    try {
      const parsedCreds = credentials ? JSON.parse(credentials) : {}
      
      // Validate that this is a service account (has client_email field)
      if (credentials && !parsedCreds.client_email) {
        throw new Error(
          'GOOGLE_CLOUD_CREDENTIALS must be a service account JSON key with client_email field. ' +
          'OAuth2 web credentials are not supported for Google Sheets API. ' +
          'Please create a service account at: https://console.cloud.google.com/iam-admin/serviceaccounts'
        )
      }

      const auth = new google.auth.GoogleAuth({
        credentials: parsedCreds,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })

      this.sheets = google.sheets({ version: 'v4', auth })
    } catch (error: any) {
      console.error('❌ [Google Sheets] Auth initialization failed:', error.message)
      throw error
    }
  }

  async push(data: any, config: GoogleSheetsConfig) {
    const { spreadsheetId, sheetName = 'Instagram Leads' } = config

    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID is required for Google Sheets integration')
    }

    try {
      console.log(`📊 [Google Sheets] Pushing to spreadsheet: ${spreadsheetId}`)
      console.log(`📊 [Google Sheets] Sheet name: ${sheetName}`)

      // Check if credentials are properly set
      const credStr = process.env.GOOGLE_CLOUD_CREDENTIALS
      if (!credStr || credStr === '{}' || credStr.trim() === '{}') {
        throw new Error(
          'GOOGLE_CLOUD_CREDENTIALS not properly configured. Please set it in .env.local with your Google Cloud service account JSON key.'
        )
      }

      console.log(`📊 [Google Sheets] Credentials detected, length: ${credStr.length}`)

      // Ensure sheet exists
      await this.ensureSheetExists(spreadsheetId, sheetName)

      // Prepare row data
      const rowData = this.formatDataForSheets(data)
      console.log(`📊 [Google Sheets] Formatted row data with ${rowData.length} columns`)

      // Append to sheet
      console.log(`📊 [Google Sheets] Appending row to sheet...`)
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [rowData],
        },
      })

      console.log(`✅ [Google Sheets] Successfully pushed to Google Sheets`)
      console.log(`✅ [Google Sheets] Updated rows: ${response.data.updates.updatedRows}`)
      console.log(`✅ [Google Sheets] Updated range: ${response.data.updates.updatedRange}`)

      return {
        spreadsheetId,
        sheetName,
        rowCount: response.data.updates.updatedRows,
        updatedRange: response.data.updates.updatedRange,
        timestamp: new Date().toISOString(),
      }
    } catch (error: any) {
      console.error('❌ [Google Sheets] Integration failed:', error.message)
      console.error('❌ [Google Sheets] Full error:', error)
      throw new Error(`Google Sheets push failed: ${error.message}`)
    }
  }

  private async ensureSheetExists(spreadsheetId: string, sheetName: string) {
    try {
      // Check if sheet exists
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
      })

      const sheetExists = response.data.sheets.some(
        (sheet: any) => sheet.properties.title === sheetName
      )

      if (!sheetExists) {
        // Create sheet with headers
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          resource: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName,
                  },
                },
              },
            ],
          },
        })

        // Add headers
        try {
          await this.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!A1:T1`,
            valueInputOption: 'RAW',
            resource: {
              values: [
                [
                  'Extracted Date',
                  'Username',
                  'Company Name',
                  'Industry',
                  'Website',
                  'Email',
                  'Phone',
                  'Followers',
                  'Business Type',
                  'Services',
                  'Target Market',
                  'Primary Category',
                  'Business Model',
                  'Brand Voice',
                  'Main Content Theme',
                  'Audience Age Range',
                  'Posting Frequency',
                  'Engagement Rate',
                  'Lead Lifecycle',
                  'Lead Score',
                ],
              ],
            },
          })

          // Format headers - bold, yellow background
          await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
              requests: [
                {
                  repeatCell: {
                    range: {
                      sheetId: response.data.sheets.find(
                        (s: any) => s.properties.title === sheetName
                      )?.properties.sheetId,
                      startRowIndex: 0,
                      endRowIndex: 1,
                    },
                    cell: {
                      userEnteredFormat: {
                        backgroundColor: {
                          red: 1,
                          green: 0.85,
                          blue: 0,
                        },
                        textFormat: {
                          bold: true,
                          foregroundColor: {
                            red: 0,
                            green: 0,
                            blue: 0,
                          },
                        },
                      },
                    },
                    fields: 'userEnteredFormat(backgroundColor,textFormat)',
                  },
                },
              ],
            },
          })

          console.log(`✅ Created new sheet: ${sheetName} with formatted headers`)
        } catch (headerError) {
          console.warn('Could not format headers, but sheet was created:', headerError)
        }
      } else {
        console.log(`📝 Sheet ${sheetName} already exists`)
      }
    } catch (error: any) {
      console.error('Error ensuring sheet exists:', error)
      throw error
    }
  }

  private formatDataForSheets(data: any): any[] {
    const lead = data.lead || {}
    const enrichment = data.enrichmentData || {}
    const segmentation = data.segmentation || {}

    // Handle services array
    const services = enrichment.services
      ? Array.isArray(enrichment.services)
        ? enrichment.services.join('; ')
        : enrichment.services
      : ''

    // Handle tags array
    const tags = segmentation.tags
      ? Array.isArray(segmentation.tags)
        ? segmentation.tags.join(', ')
        : segmentation.tags
      : ''

    return [
      new Date().toISOString(), // Extracted Date
      lead.socialProfiles?.instagram?.handle || '', // Username
      lead.companyName || '', // Company Name
      lead.industry || '', // Industry
      lead.website || '', // Website
      lead.email || '', // Email
      lead.phone || '', // Phone
      lead.socialProfiles?.instagram?.followers || 0, // Followers
      enrichment.businessType || '', // Business Type
      services, // Services
      enrichment.targetMarket || '', // Target Market
      enrichment.primaryCategory || '', // Primary Category
      enrichment.businessModel || '', // Business Model
      enrichment.brandVoice || '', // Brand Voice
      enrichment.contentStrategy || '', // Main Content Theme
      enrichment.audienceDemographics?.ageRange || '', // Audience Age Range
      enrichment.engagementPattern?.postingFrequency || '', // Posting Frequency
      enrichment.engagementPattern?.averageEngagementRate || '', // Engagement Rate
      segmentation.lifecycle || '', // Lead Lifecycle
      segmentation.leadScore || 0, // Lead Score
    ]
  }
}

