// Language detection utilities for SMART Health Cards

/**
 * Extract language from SMART Health Card data
 * @param {Object} shxResult - The processed SHC result
 * @returns {string} Language code or null if not detected
 */
export const detectLanguageFromSHC = (shxResult) => {
  if (!shxResult || !shxResult.bundles || shxResult.bundles.length === 0) {
    return null;
  }

  // Check each bundle for language indicators
  for (const bundle of shxResult.bundles) {
    if (bundle.fhir && bundle.fhir.entry) {
      const language = extractLanguageFromBundle(bundle.fhir);
      if (language) {
        return language;
      }
    }
  }

  return null;
};

/**
 * Extract language from FHIR bundle
 * @param {Object} bundle - FHIR bundle
 * @returns {string} Language code or null
 */
const extractLanguageFromBundle = (bundle) => {
  if (!bundle.entry) return null;

  // Check the bundle itself first and use the declared language.
  if (bundle.language) {
    const language = normalizeLanguageCode(bundle.language);
    
    if (language) {
      return language;
    }
  }
  
  // Otherwise, try to find the language in the bundle's entries.
  for (const entry of bundle.entry) {
    if (entry.resource) {
      const language = extractLanguageFromResource(entry.resource);
      if (language) {
        return language;
      }
    }
  }

  return null;
};

/**
 * Extract language from FHIR resource
 * @param {Object} resource - FHIR resource
 * @returns {string} Language code or null
 */
const extractLanguageFromResource = (resource) => {
  // Check for language in resource directly
  if (resource.language) {
    return normalizeLanguageCode(resource.language);
  }

  // Check for language in text elements
  if (resource.text && resource.text.language) {
    return normalizeLanguageCode(resource.text.language);
  }

  // Check for language in narrative
  if (resource.narrative && resource.narrative.language) {
    return normalizeLanguageCode(resource.narrative.language);
  }

  // Check for language in contained resources
  if (resource.contained) {
    for (const contained of resource.contained) {
      const language = extractLanguageFromResource(contained);
      if (language) {
        return language;
      }
    }
  }

  // Check for language in extensions
  if (resource.extension) {
    for (const extension of resource.extension) {
      if (extension.url && extension.url.includes('language')) {
        if (extension.valueCode) {
          return normalizeLanguageCode(extension.valueCode);
        }
        if (extension.valueString) {
          return normalizeLanguageCode(extension.valueString);
        }
      }
    }
  }

  // Check for language in meta
  if (resource.meta && resource.meta.language) {
    return normalizeLanguageCode(resource.meta.language);
  }

  // Check for language in tags
  if (resource.meta && resource.meta.tag) {
    for (const tag of resource.meta.tag) {
      if (tag.system && tag.system.includes('language')) {
        if (tag.code) {
          return normalizeLanguageCode(tag.code);
        }
      }
    }
  }

  return null;
};

/**
 * Normalize language code to 'en' or 'fr'
 * @param {string} languageCode - Raw language code
 * @returns {string} Normalized language code or null
 */
// TODO: Use new language util functions instead?
const normalizeLanguageCode = (languageCode) => {
  if (!languageCode) return null;

  const code = languageCode.toLowerCase().trim();

  // English variants
  if (code === 'en' || code.startsWith('en-') || code === 'english') {
    return 'en';
  }

  // French variants
  if (code === 'fr' || code.startsWith('fr-') || code === 'french' || code === 'français') {
    return 'fr';
  }

  return null;
};

/**
 * Detect language from text content using common patterns
 * @param {string} text - Text content to analyze
 * @returns {string} Language code or null
 */
export const detectLanguageFromText = (text) => {
  if (!text) return null;

  const frenchPatterns = [
    /[àâäéèêëïîôöùûüÿç]/i,  // French accented characters
    /\b(le|la|les|un|une|des|ce|ces|mon|ma|mes|ton|ta|tes|son|sa|ses|notre|votre|leur|leurs)\b/i,  // French articles
    /\b(et|ou|mais|donc|car|ni|or|puis|ensuite|alors|donc|ainsi|par|pour|avec|sans|sous|sur|dans|chez|vers|depuis|pendant|avant|après|contre|selon|malgré|sauf|excepté|hormis|outre|en|de|du|des|au|aux|à|parmi|entre|contre|vers|jusqu'à|jusqu'au|jusqu'aux)\b/i,  // French prepositions
    /\b(être|avoir|faire|aller|venir|voir|dire|savoir|pouvoir|vouloir|devoir|falloir|paraître|sembler|rester|devenir|revenir|sortir|partir|arriver|entrer|monter|descendre|passer|rester|revenir|rentrer|sortir|partir|arriver|entrer|monter|descendre|passer)\b/i  // French verbs
  ];

  const englishPatterns = [
    /\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by|from|up|down|out|off|over|under|between|among|through|during|before|after|since|until|while|when|where|why|how|what|which|who|whom|whose|this|that|these|those|my|your|his|her|its|our|their)\b/i,  // English articles and prepositions
    /\b(be|have|do|say|get|make|go|know|take|see|come|think|look|want|give|use|find|tell|ask|work|seem|feel|try|leave|call|can|will|would|could|should|may|might|must|shall)\b/i  // English verbs
  ];

  let frenchScore = 0;
  let englishScore = 0;

  // Check for French patterns
  for (const pattern of frenchPatterns) {
    if (pattern.test(text)) {
      frenchScore++;
    }
  }

  // Check for English patternsp
  for (const pattern of englishPatterns) {
    if (pattern.test(text)) {
      englishScore++;
    }
  }

  // Return the language with higher score, or null if scores are equal
  if (frenchScore > englishScore) {
	console.log(`Detected FR by content (fr=${frenchScore} en=${englishScore})`);
    return 'fr';
  } else if (englishScore > frenchScore) {
	console.log(`Detected EN by content (fr=${frenchScore} en=${englishScore})`);
    return 'en';
  }

  return null;
};

/**
 * Detect language from patient information
 * @param {Object} patient - Patient resource
 * @returns {string} Language code or null
 */
export const detectLanguageFromPatient = (patient) => {
  if (!patient) return null;

  // Check patient's language preference
  if (patient.communication) {
    for (const comm of patient.communication) {
      if (comm.language && comm.language.coding) {
        for (const coding of comm.language.coding) {
          if (coding.code) {
            const language = normalizeLanguageCode(coding.code);
            if (language) return language;
          }
        }
      }
    }
  }

  // Check patient's address for language clues
  if (patient.address) {
    for (const address of patient.address) {
      if (address.country) {
        // French-speaking countries
        if (address.country === 'CA' || address.country === 'FR' || address.country === 'BE' || address.country === 'CH') {
          // Check if it's Quebec or French-speaking region
          if (address.state === 'QC' || address.state === 'Quebec') {
            return 'fr';
          }
        }
      }
    }
  }

  return null;
};

/**
 * Comprehensive language detection from SHC data
 * @param {Object} shxResult - The processed SHC result
 * @returns {string} Language code ('en' or 'fr') or null
 */
export const detectLanguageFromSHCComprehensive = (shxResult) => {
  // First try to detect from FHIR bundle structure
  const bundleLanguage = detectLanguageFromSHC(shxResult);
  if (bundleLanguage) {
    return bundleLanguage;
  }

  // If no language found in bundle structure, try to detect from text content
  if (shxResult && shxResult.bundles) {
    for (const bundle of shxResult.bundles) {
      if (bundle.fhir && bundle.fhir.entry) {
        for (const entry of bundle.fhir.entry) {
          if (entry.resource) {
            // Check patient information
            if (entry.resource.resourceType === 'Patient') {
              const patientLanguage = detectLanguageFromPatient(entry.resource);
              if (patientLanguage) {
                return patientLanguage;
              }
            }

            // Check text content in any resource
            if (entry.resource.text && entry.resource.text.div) {
              const textLanguage = detectLanguageFromText(entry.resource.text.div);
              if (textLanguage) {
                return textLanguage;
              }
            }
          }
        }
      }
    }
  }

  return null;
};
