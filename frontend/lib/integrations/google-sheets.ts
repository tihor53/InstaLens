import { google } from 'googleapis'

interface GoogleSheetsConfig {
  spreadsheetId: string
  sheetName?: string
}

export class GoogleSheetsIntegration {
  private sheets: any
  private lastPushTime: number = 0
  private lastPushSpreadsheetId: string = ''
  private lastPushSheetName: string = ''

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

    // Deduplicate: prevent pushing the same spreadsheet/sheet within 2 seconds
    const now = Date.now()
    if (
      this.lastPushSpreadsheetId === spreadsheetId &&
      this.lastPushSheetName === sheetName &&
      now - this.lastPushTime < 2000
    ) {
      console.warn(`⚠️ [Google Sheets] Duplicate push detected for ${spreadsheetId}/${sheetName}, skipping (within 2sec)`)
      return {
        spreadsheetId,
        sheetName,
        isDuplicate: true,
        timestamp: new Date().toISOString(),
      }
    }

    this.lastPushTime = now
    this.lastPushSpreadsheetId = spreadsheetId
    this.lastPushSheetName = sheetName

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

      // Ensure sheet exists with enhanced structure
      await this.ensureSheetExists(spreadsheetId, sheetName)

      // Enrich the data with AI analysis insights
      const enrichedData = this.enrichDataWithAnalysis(data)
      console.log(`📊 [Google Sheets] Data enriched with AI analysis insights`)

      // Create structured rows with narratives
      const rows = this.createStructuredRows(enrichedData)
      console.log(`📊 [Google Sheets] Created ${rows.length} rows with narrative insights`)

      // Append all rows to sheet
      console.log(`📊 [Google Sheets] Appending rows to sheet...`)
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: rows,
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

  /**
   * Create structured rows with narrative insights for maximum clarity
   */
  private createStructuredRows(enrichedData: any): any[][] {
    const rows: any[][] = []
    const lead = enrichedData.lead || {}
    const enrichment = enrichedData.enrichmentData || {}
    const segmentation = enrichedData.segmentation || {}

    // Row 1: PROFILE HEADER
    rows.push([
      `📱 INSTAGRAM BUSINESS PROFILE: @${lead.socialProfiles?.instagram?.handle || 'Unknown'}`,
    ])

    // Row 2: Timestamp
    rows.push([`Analyzed: ${new Date().toISOString().split('T')[0]}`])

    // Row 3: Empty
    rows.push([''])

    // Row 4: BUSINESS OVERVIEW SECTION
    rows.push(['🏢 BUSINESS OVERVIEW'])
    rows.push([
      `Company: ${lead.companyName || 'Not specified'}`,
      `Industry: ${lead.industry || 'General'}`,
      `Type: ${enrichment.businessType || 'Creator'}`,
      `Model: ${enrichment.businessModel || 'D2C'}`,
    ])

    // Row 6: Business Summary Narrative
    rows.push([
      `Summary: ${this.generateBusinessNarrative(lead, enrichment)}`,
    ])

    // Row 7: Empty
    rows.push([''])

    // Row 8: AUDIENCE INSIGHTS SECTION
    rows.push(['👥 AUDIENCE INTELLIGENCE'])
    rows.push([
      `Followers: ${lead.socialProfiles?.instagram?.followers || 0}`,
      `Size: ${enrichment.audienceSize || 'Medium'}`,
      `Age Range: ${enrichment.targetAgeRange || '18-45'}`,
      `Engagement Rate: ${enrichment.averageEngagementRate || '2-5%'}`,
    ])

    // Row 10: Audience Profile Narrative
    rows.push([
      `Profile: ${this.generateAudienceNarrative(enrichment)}`,
    ])

    // Row 11: Top Interests
    rows.push([
      `Interests: ${enrichment.targetInterests?.slice(0, 5).join(', ') || 'Varied'}`,
    ])

    // Row 12: Empty
    rows.push([''])

    // Row 13: CONTENT STRATEGY SECTION
    rows.push(['📱 CONTENT STRATEGY & PERFORMANCE'])
    rows.push([
      `Frequency: ${enrichment.postingFrequency || 'Regular'}`,
      `Main Themes: ${enrichment.contentThemes?.slice(0, 3).join(', ') || 'Mixed'}`,
      `Best Performer: ${enrichment.bestPerformingContentType || 'Varied'}`,
      `Peak Times: ${enrichment.peakEngagementHours || 'Varied'}`,
    ])

    // Row 15: Content Strategy Narrative
    rows.push([
      `Analysis: ${this.generateContentNarrative(enrichment)}`,
    ])

    // Row 16: Empty
    rows.push([''])

    // Row 17: SERVICES & OFFERINGS SECTION
    rows.push(['💼 SERVICES & PRODUCTS'])
    const services = Array.isArray(enrichment.services)
      ? enrichment.services.join(', ')
      : enrichment.services || 'Not specified'
    rows.push([`Offerings: ${services}`])
    rows.push([`Price Point: ${enrichment.pricePointRange || 'Variable'}`])
    rows.push([`Value Proposition: ${enrichment.uniqueValue || 'Standard offerings'}`])

    // Row 20: Empty
    rows.push([''])

    // Row 21: COMPETITIVE ANALYSIS SECTION
    rows.push(['🎯 COMPETITIVE POSITIONING'])
    rows.push([
      `Position: ${enrichment.marketPosition || 'Established'}`,
      `Differentiators: ${enrichment.differentiators || 'Standard'}`,
      `Growth Trend: ${enrichment.growthTrend || 'Stable'}`,
    ])

    // Row 23: Competitive Narrative
    rows.push([
      `Insights: ${this.generateCompetitiveNarrative(enrichment)}`,
    ])

    // Row 24: Empty
    rows.push([''])

    // Row 25: ENGAGEMENT & PERFORMANCE SECTION
    rows.push(['📊 ENGAGEMENT METRICS'])
    rows.push([
      `Loyalty: ${enrichment.audienceLoyalty || 'Developing'}`,
      `Community Size: ${enrichment.audienceSize || 'Medium'}`,
      `Content Diversity: ${enrichment.contentThemes?.length || 3} themes`,
    ])

    // Row 27: Empty
    rows.push([''])

    // Row 28: PARTNERSHIP OPPORTUNITIES SECTION
    rows.push(['🤝 PARTNERSHIP OPPORTUNITIES'])
    rows.push([
      `Collaboration Fit: ${enrichment.partnershipFit || 'Moderate'}`,
      `Sponsorship Fit: ${enrichment.sponsorshipOpportunities || 'Moderate'}`,
      `Affiliate Potential: ${enrichment.affiliatePotential || 'Moderate'}`,
    ])

    // Row 30: Empty
    rows.push([''])

    // Row 31: LEAD SCORING & RECOMMENDATIONS SECTION
    rows.push(['⭐ LEAD SCORING & ACTION PLAN'])
    rows.push([
      `Lead Score: ${segmentation.leadScore}/100`,
      `Priority: ${segmentation.priority || 'Medium'}`,
      `Stage: ${segmentation.lifecycle || 'prospect'}`,
    ])

    // Row 33: Recommended Actions
    rows.push([`Next Steps: ${enrichment.recommendedActions || 'Develop engagement strategy'}`])

    // Row 34: Follow-up Strategy
    rows.push([`Follow-up: ${enrichment.followUpStrategy || 'Standard follow-up process'}`])

    // Row 35: Empty
    rows.push([''])

    // Row 36: TAGS & SUMMARY
    rows.push(['🏷️ TAGS & SUMMARY'])
    rows.push([`Labels: ${Array.isArray(segmentation.tags) ? segmentation.tags.join(', ') : 'Untagged'}`])

    // Row 38: Final Summary
    rows.push([
      `Executive Summary: ${this.generateExecutiveSummary(lead, enrichment, segmentation)}`,
    ])

    return rows
  }

  /**
   * Generate business narrative from data
   */
  private generateBusinessNarrative(lead: any, enrichment: any): string {
    const company = lead.companyName || 'This Instagram account'
    const type = enrichment.businessType || 'creator'
    const category = enrichment.primaryCategory || 'general'
    const model = enrichment.businessModel || 'D2C'

    return `${company} operates as a ${type} in the ${category} space using a ${model} business model. ${enrichment.description || 'They maintain an active presence on Instagram.'}. Brand voice: ${enrichment.brandVoice || 'Professional and engaging'}.`
  }

  /**
   * Generate audience profile narrative
   */
  private generateAudienceNarrative(enrichment: any): string {
    const size = enrichment.audienceSize || 'medium-sized'
    const ageRange = enrichment.targetAgeRange || '18-45'
    const engagement = enrichment.averageEngagementRate || '2-5%'
    const loyalty = enrichment.audienceLoyalty || 'developing'

    return `This account has a ${size} audience, primarily aged ${ageRange}, with ${engagement} engagement rate indicating ${loyalty} audience loyalty. Target market: ${enrichment.targetMarket || 'general audience'}.`
  }

  /**
   * Generate content strategy narrative
   */
  private generateContentNarrative(enrichment: any): string {
    const frequency = enrichment.postingFrequency || 'regular'
    const themes = enrichment.contentThemes?.slice(0, 3).join(', ') || 'varied themes'
    const best = enrichment.bestPerformingContentType || 'mixed content types'

    return `Content is posted ${frequency}y with focus on ${themes}. Best performing content includes ${best}. Strategy emphasizes: ${enrichment.contentStrategy || 'consistent engagement'}. Peak engagement occurs during ${enrichment.peakEngagementHours || 'varied times'}.`
  }

  /**
   * Generate competitive positioning narrative
   */
  private generateCompetitiveNarrative(enrichment: any): string {
    const position = enrichment.marketPosition || 'established'
    const trend = enrichment.growthTrend || 'stable'

    return `This account holds a ${position} market position with ${trend} growth trend. Key differentiators: ${enrichment.differentiators || 'standard market offerings'}. Competitive advantages include: ${enrichment.competitorInsights || 'strong community engagement'}.`
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(lead: any, enrichment: any, segmentation: any): string {
    const company = lead.companyName || lead.socialProfiles?.instagram?.handle
    const followers = lead.socialProfiles?.instagram?.followers || 0
    const engagement = enrichment.averageEngagementRate || '2-5%'
    const score = segmentation.leadScore || 50

    return `${company} (@${lead.socialProfiles?.instagram?.handle}) is a ${enrichment.businessType} account with ${followers} followers and ${engagement} engagement rate. Lead score: ${score}/100 (${segmentation.priority || 'medium'} priority). Recommended action: ${enrichment.recommendedActions?.split(';')[0] || 'Develop engagement strategy'}`
  }

  /**
   * Enrich data with AI analysis insights from Mastra agents
   */
  private enrichDataWithAnalysis(data: any): any {
    const profileAnalysis = data.profileAnalysis || {}
    const contentAnalysis = data.contentAnalysis || {}
    const audienceInsights = data.audienceInsights || {}
    const structuredData = data.structuredData || {}

    const leadData = structuredData.lead || {}
    const enrichmentData = structuredData.enrichmentData || {}

    // Build comprehensive enrichment object
    return {
      lead: leadData,
      enrichmentData: {
        businessType: enrichmentData.businessType || profileAnalysis.businessIdentity?.type || 'Creator',
        primaryCategory: enrichmentData.primaryCategory || profileAnalysis.classification?.primaryCategory || '',
        subCategories: enrichmentData.subCategories || profileAnalysis.classification?.subCategories || [],
        businessModel: enrichmentData.businessModel || profileAnalysis.classification?.businessModel || 'D2C',
        description: enrichmentData.description || profileAnalysis.businessIdentity?.description || '',
        brandVoice: enrichmentData.brandVoice || profileAnalysis.branding?.voiceTone || '',
        targetMarket: enrichmentData.targetMarket || audienceInsights.targetAudience?.description || '',
        targetAgeRange: enrichmentData.targetAgeRange || audienceInsights.targetAudience?.demographics?.ageRange || '18-45',
        targetInterests: enrichmentData.targetInterests || audienceInsights.targetAudience?.demographics?.interests || [],
        contentStrategy: enrichmentData.contentStrategy || contentAnalysis.strategy || 'Regular posting',
        contentThemes: enrichmentData.contentThemes || contentAnalysis.contentThemes?.map((t: any) => t.theme) || [],
        primaryContentType: enrichmentData.primaryContentType || contentAnalysis.contentThemes?.[0]?.theme || '',
        services: enrichmentData.services || contentAnalysis.services?.map((s: any) => s.name) || [],
        postingFrequency: enrichmentData.postingFrequency || audienceInsights.engagementPatterns?.postingFrequency || 'regular',
        averageEngagementRate: enrichmentData.averageEngagementRate || audienceInsights.engagementPatterns?.averageEngagementRate || '2-5%',
        bestPerformingContentType: enrichmentData.bestPerformingContentType || audienceInsights.engagementPatterns?.bestPerformingContentType || '',
        peakEngagementHours: enrichmentData.peakEngagementHours || audienceInsights.engagementPatterns?.peakEngagementTimes?.join(', ') || '',
        audienceSize: enrichmentData.audienceSize || this.getAudienceSizeCategory(leadData.socialProfiles?.instagram?.followers || 0),
        audienceLoyalty: enrichmentData.audienceLoyalty || audienceInsights.communityCharacteristics?.loyaltyIndicators?.join('; ') || '',
        growthTrend: enrichmentData.growthTrend || 'stable',
        competitorInsights: enrichmentData.competitorInsights || profileAnalysis.branding?.positioning || '',
        marketPosition: enrichmentData.marketPosition || profileAnalysis.classification?.businessModel || '',
        differentiators: enrichmentData.differentiators || contentAnalysis.contentThemes?.slice(0, 3).map((t: any) => t.theme).join('; ') || '',
        recommendedActions: this.generateRecommendedActions(profileAnalysis, contentAnalysis, audienceInsights),
        followUpStrategy: this.generateFollowUpStrategy(profileAnalysis, audienceInsights),
      },
      segmentation: structuredData.segmentation || {
        tags: [],
        lifecycle: 'prospect',
        priority: 'medium',
        leadScore: this.calculateLeadScore(profileAnalysis, contentAnalysis, audienceInsights),
      },
      marketingIntel: structuredData.marketingIntel || {},
    }
  }

  /**
   * Generate recommended actions based on analysis
   */
  private generateRecommendedActions(profileAnalysis: any, contentAnalysis: any, audienceInsights: any): string {
    const actions = []

    if (contentAnalysis.contentThemes?.length > 0) {
      const themes = contentAnalysis.contentThemes.map((t: any) => t.theme).join(', ')
      actions.push(`Leverage ${themes} content themes`)
    }

    if (audienceInsights.targetAudience?.needsAddressed) {
      actions.push(`Target: ${audienceInsights.targetAudience.needsAddressed.slice(0, 2).join(', ')}`)
    }

    if (audienceInsights.engagementPatterns?.averageEngagementRate) {
      actions.push(`Focus on high-engagement content strategies`)
    }

    if (contentAnalysis.services?.length > 0) {
      actions.push(`Promote top services: ${contentAnalysis.services.slice(0, 3).map((s: any) => s.name).join(', ')}`)
    }

    return actions.join('; ') || 'Develop engagement strategy and content calendar'
  }

  /**
   * Generate follow-up strategy
   */
  private generateFollowUpStrategy(profileAnalysis: any, audienceInsights: any): string {
    const strategies = []

    if (audienceInsights.communityCharacteristics?.engagement === 'high') {
      strategies.push('This account shows strong engagement - prioritize collaboration')
    } else if (audienceInsights.communityCharacteristics?.engagement === 'medium') {
      strategies.push('Medium engagement - focus on growth opportunities')
    }

    if (profileAnalysis.classification?.businessModel === 'B2B') {
      strategies.push('B2B model - target professional partnerships')
    } else {
      strategies.push('D2C/Creator - focus on brand partnerships and sponsorships')
    }

    strategies.push('Schedule follow-up in 2 weeks')

    return strategies.join('; ') || 'Standard follow-up process'
  }

  /**
   * Calculate lead score based on analysis
   */
  private calculateLeadScore(profileAnalysis: any, contentAnalysis: any, audienceInsights: any): number {
    let score = 50 // Base score

    // Calculate based on components
    const followers = audienceInsights.targetAudience?.demographics ? 10 : 0
    const engagementQuality = audienceInsights.engagementPatterns?.averageEngagementRate ? 15 : 0
    const contentDiversity = contentAnalysis.contentThemes?.length ? 10 : 0
    const audienceQuality = audienceInsights.targetAudience?.painPoints?.length ? 10 : 0
    const businessPositioning = profileAnalysis.branding?.positioning ? 5 : 0

    score += followers + engagementQuality + contentDiversity + audienceQuality + businessPositioning

    return Math.min(100, Math.max(0, score))
  }

  /**
   * Get audience size category
   */
  private getAudienceSizeCategory(followers: number): string {
    if (followers > 500000) return 'Mega (500K+)'
    if (followers > 50000) return 'Large (50K-500K)'
    if (followers > 5000) return 'Medium (5K-50K)'
    if (followers > 1000) return 'Small (1K-5K)'
    return 'Micro (<1K)'
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
        // Create new sheet
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

        // Format the sheet for narrative analysis
        const allSheets = await this.sheets.spreadsheets.get({ spreadsheetId })
        const newSheet = allSheets.data.sheets.find(
          (s: any) => s.properties.title === sheetName
        )

        if (newSheet) {
          // Apply formatting for better readability
          await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
              requests: [
                // Freeze first row
                {
                  updateSheetProperties: {
                    properties: {
                      sheetId: newSheet.properties.sheetId,
                      gridProperties: {
                        frozenRowCount: 0, // No frozen rows since structure is narrative
                      },
                    },
                    fields: 'gridProperties.frozenRowCount',
                  },
                },
                // Set column width for readability
                {
                  updateDimensionProperties: {
                    range: {
                      sheetId: newSheet.properties.sheetId,
                      dimension: 'COLUMNS',
                      startIndex: 0,
                      endIndex: 10,
                    },
                    properties: {
                      pixelSize: 400,
                    },
                    fields: 'pixelSize',
                  },
                },
              ],
            },
          })
        }

        console.log(`✅ Created new sheet: ${sheetName} with narrative format`)
      } else {
        console.log(`📝 Sheet ${sheetName} already exists`)
      }
    } catch (error: any) {
      console.error('Error ensuring sheet exists:', error)
      throw error
    }
  }

}

