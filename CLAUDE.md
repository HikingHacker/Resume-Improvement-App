# Resume Improvement Tool - Development Guidelines

## Commands
- Build/Start: `npm start` - Runs the app in development mode
- Build for production: `npm run build` - Builds the app for production
- Test: `npm test` - Runs all tests
- Test specific file: `npm test -- src/components/path/to/test.js` 
- Test with coverage: `npm test -- --coverage`
- Lint: `npm run lint` (add this script to package.json)

## Code Style Guidelines
- **Imports**: Group imports: React core, third-party libraries, components, then styles
- **Components**: Use functional components with hooks
- **State Management**: Use React hooks (useState, useEffect, useContext)
- **Naming**: 
  - Components: PascalCase
  - Functions/variables: camelCase
  - Files: Match component names (PascalCase)
- **Formatting**: 
  - Use 2-space indentation
  - Use trailing commas in multiline object/array literals
- **UI Components**: Use Tailwind CSS for styling
- **Error Handling**: Use try/catch with descriptive error messages
- **Testing**: Use React Testing Library, test user interactions
- **Props**: Destructure props at component level