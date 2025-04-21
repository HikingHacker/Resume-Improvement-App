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
  // State for tracking loading status of different operations - enhanced to support per-bullet tracking
  const [loading, setLoading] = useState({
    [OPERATION_TYPES.PARSE]: false,
    [OPERATION_TYPES.IMPROVE]: false, // This will be enhanced with bullet IDs
    [OPERATION_TYPES.EXPORT]: false,
    [OPERATION_TYPES.ANALYZE]: false,
    [OPERATION_TYPES.ANALYTICS]: false,
    bulletMap: {} // Map of bullet IDs to loading state
  });
  
  // State for tracking errors from different operations
  const [errors, setErrors] = useState({
    [OPERATION_TYPES.PARSE]: null,
    [OPERATION_TYPES.IMPROVE]: null,
    [OPERATION_TYPES.EXPORT]: null,
    [OPERATION_TYPES.ANALYZE]: null,
    [OPERATION_TYPES.ANALYTICS]: null,
    bulletMap: {} // Map of bullet IDs to error messages
  });

  // Helper functions for consistent state management - enhanced for bullet-level tracking
  const startOperation = useCallback((operationType, bulletId = null) => {
    setLoading(prev => {
      if (bulletId) {
        // For bullet-specific operations, track in the bulletMap
        return { 
          ...prev, 
          [operationType]: true,
          bulletMap: { 
            ...prev.bulletMap, 
            [bulletId]: true 
          }
        };
      }
      // Standard operation without bullet ID
      return { ...prev, [operationType]: true };
    });
    
    setErrors(prev => {
      if (bulletId) {
        return { 
          ...prev, 
          [operationType]: null,
          bulletMap: { 
            ...prev.bulletMap, 
            [bulletId]: null 
          }
        };
      }
      return { ...prev, [operationType]: null };
    });
  }, []);

  const endOperation = useCallback((operationType, error = null, bulletId = null) => {
    setLoading(prev => {
      if (bulletId) {
        return { 
          ...prev, 
          [operationType]: false,
          bulletMap: { 
            ...prev.bulletMap, 
            [bulletId]: false 
          }
        };
      }
      return { ...prev, [operationType]: false };
    });
    
    if (error) {
      setErrors(prev => {
        const errorMsg = error.message || String(error);
        if (bulletId) {
          return { 
            ...prev, 
            [operationType]: errorMsg,
            bulletMap: { 
              ...prev.bulletMap, 
              [bulletId]: errorMsg 
            }
          };
        }
        return { ...prev, [operationType]: errorMsg };
      });
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
   * @param {string} bulletPoint - The bullet point text to improve
   * @param {string} additionalContext - Additional context for the improvement
   * @param {string} bulletId - Unique identifier for this bullet point (for deduplication)
   */
  const getAISuggestions = useCallback(async (bulletPoint, additionalContext = "", bulletId = null) => {
    // Use bullet-level tracking if a bulletId is provided
    const operationKey = OPERATION_TYPES.IMPROVE;
    
    // First check if this specific bullet is already being processed
    if (bulletId && loading.bulletMap[bulletId]) {
      console.log(`Improvement already in progress for bullet ${bulletId}, skipping duplicate request`);
      return null;
    }
    
    // Start the operation, tracking both the global state and bullet-specific state
    startOperation(operationKey, bulletId);
    
    try {
      console.log(`Requesting improvement for bullet ${bulletId || 'unknown'}`);
      const result = await apiService.getAISuggestions(bulletPoint, additionalContext);
      return result;
    } catch (error) {
      console.error(`Error improving bullet ${bulletId || 'unknown'}:`, error);
      endOperation(operationKey, error, bulletId);
      return null;
    } finally {
      endOperation(operationKey, null, bulletId);
    }
  }, [startOperation, endOperation, apiService, loading]);

  /**
   * Get AI-powered comprehensive resume analysis
   * Supports polling for long-running operations with progress updates
   */
  const analyzeResume = useCallback(async (resumeData) => {
    startOperation(OPERATION_TYPES.ANALYZE);
    
    try {
      // Show status updates during long-running operation
      const onStatusUpdate = (status) => {
        if (status && status.progress) {
          // Update loading state with progress information
          setLoading(prev => ({ 
            ...prev, 
            [OPERATION_TYPES.ANALYZE]: { 
              inProgress: true, 
              progress: status.progress,
              status: status.status
            } 
          }));
        }
      };
      
      // Call the API with polling enabled for this long-running operation
      return await apiService.analyzeResume(resumeData, { 
        longRunning: true,
        onStatusUpdate
      });
    } catch (error) {
      console.error("Error in analyzeResume:", error);
      endOperation(OPERATION_TYPES.ANALYZE, error);
      return null;
    } finally {
      endOperation(OPERATION_TYPES.ANALYZE);
    }
  }, [startOperation, endOperation, apiService, setLoading]);

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
   * Supports polling for long-running operations with progress updates
   */
  const getImprovementAnalytics = useCallback(async (resumeData, improvements, savedBullets) => {
    startOperation(OPERATION_TYPES.ANALYTICS);
    
    try {
      // Show status updates during long-running operation
      const onStatusUpdate = (status) => {
        if (status && status.progress) {
          // Update loading state with progress information
          setLoading(prev => ({ 
            ...prev, 
            [OPERATION_TYPES.ANALYTICS]: { 
              inProgress: true, 
              progress: status.progress,
              status: status.status
            } 
          }));
        }
      };
      
      // Call the API with polling enabled for this long-running operation
      return await apiService.getImprovementAnalytics(resumeData, improvements, savedBullets, {
        longRunning: true,
        onStatusUpdate
      });
    } catch (error) {
      console.error("Error in getImprovementAnalytics:", error);
      endOperation(OPERATION_TYPES.ANALYTICS, error);
      return null;
    } finally {
      endOperation(OPERATION_TYPES.ANALYTICS);
    }
  }, [startOperation, endOperation, apiService, setLoading]);

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