const stripUnsafeCharacters = (value) => {
  return value
    .replace(/[^\x00-\x7F]/g, '')
    .trim()
    .replace(/[\n\r\t]/g, '')
}

const hasTrailingDot = (value) => {
  return value.endsWith('.') || value.endsWith('./')
}

export const sanitizeBackendUrlValue = (rawValue) => {
  if (typeof rawValue !== 'string') {
    return {
      ok: false,
      reason: 'missing',
      cleanedInput: '',
      original: rawValue ?? ''
    }
  }

  const cleanedInput = stripUnsafeCharacters(rawValue)

  if (!cleanedInput) {
    return {
      ok: false,
      reason: 'empty-after-clean',
      cleanedInput,
      original: rawValue
    }
  }

  if (hasTrailingDot(cleanedInput)) {
    return {
      ok: false,
      reason: 'trailing-dot',
      cleanedInput,
      original: rawValue
    }
  }

  if (cleanedInput.length < 10 || !cleanedInput.includes('://')) {
    return {
      ok: false,
      reason: 'incomplete',
      cleanedInput,
      original: rawValue
    }
  }

  try {
    const parsedUrl = new URL(cleanedInput)

    if (
      !parsedUrl.hostname ||
      parsedUrl.hostname.includes('xn--') ||
      !parsedUrl.hostname.includes('.') ||
      parsedUrl.hostname.endsWith('.') ||
      parsedUrl.hostname.startsWith('.')
    ) {
      return {
        ok: false,
        reason: 'invalid-hostname',
        cleanedInput,
        hostname: parsedUrl.hostname,
        original: rawValue
      }
    }

    const cleanedOrigin = parsedUrl.origin

    if (!cleanedOrigin || hasTrailingDot(cleanedOrigin) || !cleanedOrigin.includes('://')) {
      return {
        ok: false,
        reason: 'invalid-origin',
        cleanedInput,
        cleanedOrigin,
        hostname: parsedUrl.hostname,
        original: rawValue
      }
    }

    return {
      ok: true,
      cleanedOrigin,
      cleanedInput,
      hostname: parsedUrl.hostname,
      protocol: parsedUrl.protocol,
      original: rawValue
    }
  } catch (error) {
    return {
      ok: false,
      reason: 'parse-error',
      cleanedInput,
      original: rawValue,
      error
    }
  }
}
