import { render, screen } from '@testing-library/react';
import { ResumeProvider } from '../../contexts/ResumeContext';
import ResumeUpload from './ResumeUpload';

const renderUpload = () => render(
  <ResumeProvider>
    <ResumeUpload />
  </ResumeProvider>
);

describe('ResumeUpload', () => {
  it('shows the resume dropzone without job description fields', () => {
    renderUpload();

    expect(screen.getByText(/Upload your resume/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/upload resume file/i)).toBeInTheDocument();
    expect(screen.queryByText(/Paste job descriptions/i)).not.toBeInTheDocument();
  });
});
