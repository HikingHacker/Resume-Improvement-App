# Resume Improvement Tool - Server

This is the backend server for the Resume Improvement Tool that handles API calls to the Claude API.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file based on the provided example and add your Anthropic API key:
   ```
   # Server Configuration
   PORT=3001

   # Anthropic Claude API Configuration
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   CLAUDE_MODEL=claude-3-sonnet-20240229
   ```

3. Start the server:
   ```
   npm run dev
   ```

## API Endpoints

### Health Check
- `GET /api/health`
- Returns server status

### Parse Resume
- `POST /api/v1/resume/parse`
- Accepts a resume file or text and extracts bullet points

### Improve Bullet Point
- `POST /api/v1/resume/improve`
- Accepts a bullet point and additional context
- Returns improved bullet point with reasoning and follow-up questions

### Export Resume
- `POST /api/v1/resume/export`
- Accepts an array of bullet points
- Returns a download URL (mock implementation)