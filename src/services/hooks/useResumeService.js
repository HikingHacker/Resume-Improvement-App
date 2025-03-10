import { useState, useCallback } from 'react';
import ResumeAPI from '../api';

/**
 * Custom hook for working with resume improvement services
 * 
 * Provides loading states, error handling, and API interaction
 */
export const useResumeService = () => {
  const [loading, setLoading] = useState({
    parse: false,
    improve: false,
    export: false,
    analyze: false
  });
  
  const [errors, setErrors] = useState({
    parse: null,
    improve: null,
    export: null,
    analyze: null
  });

  /**
   * Parse a resume file and extract bullet points
   */
  const parseResume = useCallback(async (file) => {
    setLoading(prev => ({ ...prev, parse: true }));
    setErrors(prev => ({ ...prev, parse: null }));
    
    try {
      const result = await ResumeAPI.parseResume(file);
      console.log("Parse result from API:", result);
      
      // Return the structured data along with the flat bullet points
      return result;
    } catch (error) {
      console.error("Error in parseResume:", error);
      setErrors(prev => ({ ...prev, parse: error.message }));
      return { bulletPoints: [], parsedData: { bullet_points: [] } };
    } finally {
      setLoading(prev => ({ ...prev, parse: false }));
    }
  }, []);

  /**
   * Get AI-powered improvements for a specific bullet point
   */
  const getAISuggestions = useCallback(async (bulletPoint, additionalContext = "") => {
    setLoading(prev => ({ ...prev, improve: true }));
    setErrors(prev => ({ ...prev, improve: null }));
    
    try {
      return await ResumeAPI.getAISuggestions(bulletPoint, additionalContext);
    } catch (error) {
      setErrors(prev => ({ ...prev, improve: error.message }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, improve: false }));
    }
  }, []);

  /**
   * Get AI-powered comprehensive resume analysis
   */
  const analyzeResume = useCallback(async (resumeData) => {
    setLoading(prev => ({ ...prev, analyze: true }));
    setErrors(prev => ({ ...prev, analyze: null }));
    
    try {
      return await ResumeAPI.analyzeResume(resumeData);
    } catch (error) {
      console.error("Error in analyzeResume:", error);
      setErrors(prev => ({ ...prev, analyze: error.message }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, analyze: false }));
    }
  }, []);

  /**
   * Export an improved resume for download
   */
  const exportResume = useCallback(async (bulletPoints, options) => {
    setLoading(prev => ({ ...prev, export: true }));
    setErrors(prev => ({ ...prev, export: null }));
    
    try {
      const result = await ResumeAPI.exportResume(bulletPoints, options);
      
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
      setErrors(prev => ({ ...prev, export: error.message }));
      return false;
    } finally {
      setLoading(prev => ({ ...prev, export: false }));
    }
  }, []);

  return {
    loading,
    setLoading,
    errors,
    setErrors,
    parseResume,
    getAISuggestions,
    analyzeResume,
    exportResume
  };
};

export default useResumeService;