/**
 * Analysis Completeness Validation Utility
 * Ensures that only fully completed analyses are displayed to users
 */

/**
 * Interface for meeting analysis data
 */
export interface MeetingAnalysis {
  meeting_id: string
  analysis_status: string
  summary?: string | null
  email_content?: string | null
  mind_map?: string | null
  resources_list?: string | null
  next_meeting_prep?: string | null
  coaching_advice?: string | null
  sales_technique_advice?: string | null
  pain_point?: string | null
  goal?: string | null
  suggestion?: string | null
  action_items_client?: string | null
  action_items_coach?: string | null
  [key: string]: any
}

/**
 * Check if a string is empty (null, undefined, or empty string)
 */
function isEmpty(value: any): boolean {
  return !value || String(value).trim() === ''
}

/**
 * Validate if an analysis is complete
 * An analysis is complete if:
 * 1. Status is 'completed' or 'success'
 * 2. At least one core analysis field is populated (summary OR email_content OR mind_map OR resources_list OR next_meeting_prep)
 *
 * Note: We use a lenient check (at least 1 field) rather than strict (at least 3 fields)
 * because some analysis steps may fail but the analysis is still usable
 */
export function isAnalysisComplete(analysis: MeetingAnalysis): boolean {
  // Check status
  if (!analysis.analysis_status || (analysis.analysis_status !== 'completed' && analysis.analysis_status !== 'success')) {
    return false
  }

  // Define core fields that indicate a complete analysis
  const coreFields = [
    'summary',
    'email_content',
    'mind_map',
    'resources_list',
    'next_meeting_prep'
  ]

  // At least one core field must have content
  for (const field of coreFields) {
    if (!isEmpty(analysis[field])) {
      return true // Found at least one populated field
    }
  }

  // Also check if coaching_advice or sales_technique_advice are populated
  if (!isEmpty(analysis.coaching_advice) || !isEmpty(analysis.sales_technique_advice)) {
    return true
  }

  // Also check if pain_point, goal, or suggestion are populated
  if (!isEmpty(analysis.pain_point) || !isEmpty(analysis.goal) || !isEmpty(analysis.suggestion)) {
    return true
  }

  // No core fields populated
  return false
}

/**
 * Filter out incomplete analyses from a collection
 */
export function filterCompleteAnalyses(analyses: MeetingAnalysis[]): MeetingAnalysis[] {
  return analyses.filter(analysis => isAnalysisComplete(analysis))
}

/**
 * Get analysis completion status details
 * Returns detailed information about which fields are missing
 */
export function getAnalysisCompletionStatus(analysis: MeetingAnalysis): {
  isComplete: boolean
  populatedFields: string[]
  missingFields: string[]
  completionPercentage: number
} {
  const coreFields = [
    'summary',
    'email_content',
    'mind_map',
    'resources_list',
    'next_meeting_prep'
  ]

  const populatedFields: string[] = []
  const missingFields: string[] = []

  for (const field of coreFields) {
    if (!isEmpty(analysis[field])) {
      populatedFields.push(field)
    } else {
      missingFields.push(field)
    }
  }

  const completionPercentage = (populatedFields.length / coreFields.length) * 100
  const isComplete = populatedFields.length >= 3

  return {
    isComplete,
    populatedFields,
    missingFields,
    completionPercentage: Math.round(completionPercentage)
  }
}

/**
 * Log analysis completion status for debugging
 */
export function logAnalysisCompletion(meetingId: string, analysis: MeetingAnalysis): void {
  const status = getAnalysisCompletionStatus(analysis)

  if (status.isComplete) {
    console.log(`✅ Analysis complete for meeting ${meetingId}`)
    console.log(`   Populated fields: ${status.populatedFields.join(', ')}`)
    console.log(`   Completion: ${status.completionPercentage}%`)
  } else {
    console.warn(`⚠️ Analysis incomplete for meeting ${meetingId}`)
    console.warn(`   Populated fields: ${status.populatedFields.join(', ')}`)
    console.warn(`   Missing fields: ${status.missingFields.join(', ')}`)
    console.warn(`   Completion: ${status.completionPercentage}%`)
  }
}
