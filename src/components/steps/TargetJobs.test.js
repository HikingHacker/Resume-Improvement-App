import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useResumeContext } from '../../contexts/ResumeContext';
import { PHASES } from '../../constants/workflow';
import TargetJobs from './TargetJobs';

jest.mock('../../contexts/ResumeContext', () => ({
  useResumeContext: jest.fn(),
}));

describe('TargetJobs', () => {
  const setJobDescriptions = jest.fn();
  const handleStepNavigation = jest.fn();

  beforeAll(() => {
    window.scrollTo = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useResumeContext.mockReturnValue({
      targetRole: '',
      jobDescriptions: [''],
      setTargetRole: jest.fn(),
      setJobDescriptions,
      handleStepNavigation,
      handleNavigation: jest.fn(),
    });
  });

  it('lets the user add multiple job descriptions', async () => {
    render(<TargetJobs />);

    expect(screen.getByText(/Paste job descriptions \(optional\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Collect 5–10 postings/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/job description/i)).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: /add another job description/i }));
    expect(setJobDescriptions).toHaveBeenCalledWith(['', '']);
  });

  it('continues to Insights', async () => {
    render(<TargetJobs />);
    await userEvent.click(screen.getByRole('button', { name: /see tailored insights/i }));
    expect(handleStepNavigation).toHaveBeenCalledWith(PHASES.INSIGHTS);
  });
});
