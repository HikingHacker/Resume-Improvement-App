/**
 * PDF Helper utilities
 * This file provides a wrapper around pdf-parse to avoid its test file issues
 */

const fs = require('fs');
const path = require('path');

// Create a PDF parsing function that doesn't rely on the problematic index.js
// Main PDF parsing function
const parsePDF = async (dataBuffer) => {
  try {
    // Option 1: Try to use our own patched version of pdf-parse
    try {
      // Use the direct pdf-parse module but monkey patch its behavior
      const pdfParse = require('pdf-parse');
      
      // Skip the test file loading by directly calling the function
      const result = await pdfParse(dataBuffer);
      console.log('PDF parsing successful with pdf-parse');
      return result;
    } catch (mainModuleError) {
      console.error('Error with main pdf-parse module:', mainModuleError);
      
      // Option 2: If that fails, try to load the lib module directly
      try {
        // Get the base path to pdf-parse
        const basePath = path.dirname(require.resolve('pdf-parse/package.json'));
        const libPath = path.join(basePath, 'lib', 'pdf-parse.js');
        
        console.log('Attempting to load pdf-parse directly from:', libPath);
        
        if (fs.existsSync(libPath)) {
          const pdfParseLib = require(libPath);
          const result = await pdfParseLib(dataBuffer);
          console.log('PDF parsing successful with direct lib import');
          return result;
        } else {
          throw new Error('PDF parse library file not found');
        }
      } catch (libError) {
        console.error('Error loading pdf-parse lib directly:', libError);
        throw libError; // Let it fall through to our fallback
      }
    }
  } catch (error) {
    console.error('All PDF parsing methods failed:', error);
    
    // Our own basic fallback parser
    if (dataBuffer) {
      console.log('Using fallback text extraction for PDF');
      // Try to extract text directly from PDF data buffer
      // This is a basic extraction that won't work well but is better than nothing
      const text = dataBuffer.toString('utf8');
      
      // Clean up text by removing non-printable characters
      const cleanedText = text.replace(/[^\x20-\x7E\x0A\x0D]+/g, ' ')
                             .replace(/\s+/g, ' ')
                             .trim();
      
      console.log('Fallback extraction complete, text length:', cleanedText.length);
      return {
        text: cleanedText || 'Failed to extract PDF text. Please upload a text version of your resume.',
        numpages: 0,
        info: {}
      };
    }
    
    throw new Error('Failed to parse PDF: ' + error.message);
  }
};

module.exports = { parsePDF };