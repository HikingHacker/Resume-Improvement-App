import { render, screen } from '@testing-library/react';
import App from './App';

test('renders resume improvement app', () => {
  render(<App />);
  const headingElement = screen.getByText(/Resume Improvement Assistant/i);
  expect(headingElement).toBeInTheDocument();
});
