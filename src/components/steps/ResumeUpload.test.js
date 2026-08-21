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

    expect(screen.getByRole('heading', { name: /Upload your resume/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/upload resume file/i)).toBeInTheDocument();
    expect(screen.queryByText(/Paste job descriptions/i)).not.toBeInTheDocument();
  });

  it('explains how the process works and lists key features', () => {
    renderUpload();

    expect(screen.getByText(/How It Works/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload your resume in PDF or text format/i)).toBeInTheDocument();
    expect(screen.getByText(/Receive a comprehensive analysis with strengths and improvement areas/i)).toBeInTheDocument();
    expect(screen.getByText(/Get AI-generated improvements for each bullet point/i)).toBeInTheDocument();

    expect(screen.getByText(/Key Features/i)).toBeInTheDocument();
    expect(screen.getByText(/Comprehensive resume analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/AI-powered bullet point improvements/i)).toBeInTheDocument();
    expect(screen.getByText(/Identification of missing skills/i)).toBeInTheDocument();
    expect(screen.getByText(/Suggested job roles matching your experience/i)).toBeInTheDocument();
  });
});
