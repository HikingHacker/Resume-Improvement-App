# Resume Improvement API Integration

This document provides guidelines for integrating the Resume Improvement App with AI services and backend APIs.

## Claude AI Integration

The app can directly connect to Anthropic's Claude API for AI-powered resume improvements.

### Setup

1. Create an Anthropic API account at https://console.anthropic.com/
2. Generate an API key from your Anthropic dashboard
3. Copy `.env.example` to `.env.local` and add your API key:
   ```
   REACT_APP_API_MODE=claude
   REACT_APP_ANTHROPIC_API_KEY=your_api_key_here
   ```
4. Start the application

### Claude AI Implementation

The app uses Claude for two primary functions:
1. Extracting and parsing bullet points from resume text
2. Improving existing bullet points with suggested enhancements

The prompts are designed to extract structured information and provide targeted improvements for resume content.

## API Endpoints

### Resume Parsing

**Endpoint**: `POST /api/v1/resume/parse`  
**Content-Type**: `multipart/form-data`

**Request**:
```
{
  "resume": [File Object]  // PDF, DOC, or DOCX file
}
```

**Response**:
```json
{
  "success": true,
  "bulletPoints": [
    "Bullet point 1",
    "Bullet point 2",
    "Bullet point 3"
  ]
}
```

### AI Improvement

**Endpoint**: `POST /api/v1/resume/improve`  
**Content-Type**: `application/json`

**Request**:
```json
{
  "bulletPoint": "Original bullet point text",
  "additionalContext": "Optional additional context provided by user"
}
```

**Response**:
```json
{
  "success": true,
  "improvedBulletPoint": "AI improved bullet point",
  "reasoning": "Explanation of improvements",
  "followUpQuestions": [
    "Question 1?",
    "Question 2?",
    "Question 3?"
  ]
}
```

### Resume Export

**Endpoint**: `POST /api/v1/resume/export`  
**Content-Type**: `application/json`

**Request**:
```json
{
  "bulletPoints": [
    "Improved bullet point 1",
    "Improved bullet point 2"
  ],
  "format": "pdf",
  "template": "modern"
}
```

**Response**:
```json
{
  "success": true,
  "downloadUrl": "https://api.example.com/downloads/resume-123.pdf"
}
```

## Error Handling

All API responses should include a `success` flag. When `success` is `false`, include an error message:

```json
{
  "success": false,
  "message": "Failed to parse resume due to unsupported file format."
}
```

## Rate Limiting

The API client implements rate limiting based on configuration values. To adjust these values:

1. Configure `rateLimitRequests` and `rateLimitPeriod` in the API configuration
2. Alternatively, implement server-side rate limiting

## Backend Implementation Notes

### AI Provider Integration

For a production implementation, you'll need to:

1. Set up an account with an AI provider (OpenAI, Anthropic, etc.)
2. Implement a backend service to proxy requests to the AI provider
3. Configure prompt engineering for resume improvement
4. Implement caching to avoid redundant AI requests

### Document Processing

For document parsing:
1. Use libraries like `pdf.js` for PDF processing
2. Use libraries like `mammoth` for DOCX processing
3. Implement text extraction for resume sections
4. Consider implementing OCR for scanned documents

### Security Considerations

1. Implement user authentication for API requests
2. Rate limit requests per user
3. Validate file uploads (size, type, content)
4. Sanitize all user inputs before processing
5. Use HTTPS for all API requests