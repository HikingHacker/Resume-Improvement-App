import { render, screen } from '@testing-library/react';
import App from './App';

test('renders resume dj app', () => {
  render(<App />);
  expect(screen.getByText(/Don’t just apply—headline the show/i)).toBeInTheDocument();
});
