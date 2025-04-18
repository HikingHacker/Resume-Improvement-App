import { useState, useCallback, useMemo } from 'react';
import ResumeAPI, { createResumeAPIService } from '../api';

// Define operation types as constants for typesafety and consistency
export const OPERATION_TYPES = Object.freeze({
  PARSE: 'parse',
  IMPROVE: 'improve',
  EXPORT: 'export',
  ANALYZE: 'analyze',
  ANALYTICS: 'analytics'
});

/**
 * Custom hook for working with resume improvement services
 * 
 * Provides loading states, error handling, and API interaction
 * following the command pattern for API operations
 * 
 * @param {Object} apiService - Optional API service instance for dependency injection (used in testing)
 * @returns {Object} Resume service with loading states, error handling, and API methods
 */
export const useResumeService = (apiService = ResumeAPI) => {
  // State for tracking loading status of different operations
  const [loading, setLoading] = useState({
    [OPERATION_TYPES.PARSE]: false,
    [OPERATION_TYPES.IMPROVE]: false,
    [OPERATION_TYPES.EXPORT]: false,
    [OPERATION_TYPES.ANALYZE]: false,
    [OPERATION_TYPES.ANALYTICS]: false
  });
  
  // State for tracking errors from different operations
  const [errors, setErrors] = useState({
    [OPERATION_TYPES.PARSE]: null,
    [OPERATION_TYPES.IMPROVE]: null,
    [OPERATION_TYPES.EXPORT]: null,
    [OPERATION_TYPES.ANALYZE]: null,
    [OPERATION_TYPES.ANALYTICS]: null
  });

  // Helper functions for consistent state management
  const startOperation = useCallback((operationType) => {
    setLoading(prev => ({ ...prev, [operationType]: true }));
    setErrors(prev => ({ ...prev, [operationType]: null }));
  }, []);

  const endOperation = useCallback((operationType, error = null) => {
    setLoading(prev => ({ ...prev, [operationType]: false }));
    if (error) {
      setErrors(prev => ({ ...prev, [operationType]: error.message || String(error) }));
    }
  }, []);

  /**
   * Parse a resume file and extract bullet points
   */
  const parseResume = useCallback(async (file) => {
    startOperation(OPERATION_TYPES.PARSE);
    
    try {
      const result = await apiService.parseResume(file);
      console.log("Parse result from API:", result);
      
      // Return the structured data along with the flat bullet points
      return result;
    } catch (error) {
      console.error("Error in parseResume:", error);
      endOperation(OPERATION_TYPES.PARSE, error);
      return { bulletPoints: [], parsedData: { bullet_points: [] } };
    } finally {
      endOperation(OPERATION_TYPES.PARSE);
    }
  }, [startOperation, endOperation, apiService]);

  /**
   * Get AI-powered improvements for a specific bullet point
   */
  const getAISuggestions = useCallback(async (bulletPoint, additionalContext = "") => {
    startOperation(OPERATION_TYPES.IMPROVE);
    
    try {
      return await apiService.getAISuggestions(bulletPoint, additionalContext);
    } catch (error) {
      endOperation(OPERATION_TYPES.IMPROVE, error);
      return null;
    } finally {
      endOperation(OPERATION_TYPES.IMPROVE);
    }
  }, [startOperation, endOperation, apiService]);

  /**
   * Get AI-powered comprehensive resume analysis
   */
  const analyzeResume = useCallback(async (resumeData) => {
    startOperation(OPERATION_TYPES.ANALYZE);
    
    try {
      return await apiService.analyzeResume(resumeData);
    } catch (error) {
      console.error("Error in analyzeResume:", error);
      endOperation(OPERATION_TYPES.ANALYZE, error);
      return null;
    } finally {
      endOperation(OPERATION_TYPES.ANALYZE);
    }
  }, [startOperation, endOperation, apiService]);

  /**
   * Export an improved resume for download
   */
  const exportResume = useCallback(async (bulletPoints, options) => {
    startOperation(OPERATION_TYPES.EXPORT);
    
    try {
      const result = await apiService.exportResume(bulletPoints, options);
      
      // For mock mode, simulate download by creating a blob
      if (!result.downloadUrl.startsWith('http')) {
        const blob = new Blob(
          [bulletPoints.join('\n\n')], 
          { type: 'text/plain' }
        );
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'improved-resume.txt';
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 0);
        
        return true;
      }
      
      // For real API, open the download URL
      window.open(result.downloadUrl, '_blank');
      return true;
    } catch (error) {
      endOperation(OPERATION_TYPES.EXPORT, error);
      return false;
    } finally {
      endOperation(OPERATION_TYPES.EXPORT);
    }
  }, [startOperation, endOperation, apiService]);

  /**
   * Get AI-powered improvement analytics and recommendations
   */
  const getImprovementAnalytics = useCallback(async (resumeData, improvements, savedBullets) => {
    startOperation(OPERATION_TYPES.ANALYTICS);
    
    try {
      return await apiService.getImprovementAnalytics(resumeData, improvements, savedBullets);
    } catch (error) {
      console.error("Error in getImprovementAnalytics:", error);
      endOperation(OPERATION_TYPES.ANALYTICS, error);
      return null;
    } finally {
      endOperation(OPERATION_TYPES.ANALYTICS);
    }
  }, [startOperation, endOperation, apiService]);

  // Memoize the service interface to prevent unnecessary re-renders
  const service = useMemo(() => ({
    // State management
    loading,
    setLoading,
    errors,
    setErrors,
    
    // Operation state helpers
    startOperation,
    endOperation,
    
    // API operations
    parseResume,
    getAISuggestions,
    analyzeResume,
    exportResume,
    getImprovementAnalytics,
    
    // Underlying API service (for advanced usage)
    apiService
  }), [
    // State
    loading, 
    setLoading, 
    errors, 
    setErrors,
    
    // Helpers
    startOperation,
    endOperation,
    
    // Operations
    parseResume, 
    getAISuggestions, 
    analyzeResume, 
    exportResume, 
    getImprovementAnalytics,
    
    // Service
    apiService
  ]);

  return service;
};

export default useResumeService;