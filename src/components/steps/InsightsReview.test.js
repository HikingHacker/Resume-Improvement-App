import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useResumeContext } from '../../contexts/ResumeContext';
import { PHASES } from '../../constants/workflow';
import InsightsReview from './InsightsReview';

jest.mock('../../contexts/ResumeContext', () => ({
  useResumeContext: jest.fn(),
}));

const resumeData = {
  bullet_points: [
    {
      id: 'job-1',
      company: 'Acme',
      position: 'Staff Engineer',
      time_period: '2023-2025',
      achievements: ['Led platform work', 'Reduced latency 40%'],
      achievementIds: ['bullet-1', 'bullet-2'],
    },
  ],
};

const resumeAnalysis = {
  strengths: ['Recent Staff-level ownership'],
  weaknesses: ['Too many duty statements'],
  areasForImprovement: ['Lead with outcome, not collaboration'],
  missingSkills: ['Incident response'],
  atsKeywords: [
    { keyword: 'Kubernetes', present: false, priority: 'High' },
  ],
};

describe('InsightsReview', () => {
  const selectBullet = jest.fn();
  const selectFirstBullet = jest.fn();
  const handleStepNavigation = jest.fn();
  const getResumeAnalysis = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useResumeContext.mockReturnValue({
      resumeData,
      resumeAnalysis,
      resumeEdited: false,
      getResumeAnalysis,
      loading: { analyze: false },
      errors: {},
      targetRole: 'Staff Engineer',
      jobDescriptions: [''],
      savedBullets: {},
      skippedBullets: {},
      selectBullet,
      selectFirstBullet,
      handleStepNavigation,
      handleNavigation: jest.fn(),
    });
  });

  it('starts Improve on the full resume', async () => {
    render(<InsightsReview />);

    expect(screen.getByText(/here is how this resume reads/i)).toBeInTheDocument();
    expect(screen.getByText(/add a metric to bullets that only describe duties/i)).toBeInTheDocument();
    expect(getResumeAnalysis).toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /start rewriting/i }));
    expect(handleStepNavigation).toHaveBeenCalledWith(PHASES.IMPROVE, { first: true });
  });

  it('mirrors the loaded layout while analysis is pending', () => {
    useResumeContext.mockReturnValue({
      resumeData,
      resumeAnalysis: null,
      resumeEdited: false,
      getResumeAnalysis,
      loading: { analyze: true },
      errors: {},
      targetRole: 'Staff Engineer',
      jobDescriptions: [''],
      savedBullets: {},
      skippedBullets: {},
      selectBullet,
      selectFirstBullet,
      handleStepNavigation,
      handleNavigation: jest.fn(),
    });

    render(<InsightsReview />);

    expect(screen.getByRole('status')).toHaveTextContent(/generating insights/i);
    expect(screen.getByText(/matching bullets to the diagnosis/i)).toBeInTheDocument();
    expect(screen.queryByText(/add a metric to bullets that only describe duties/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/insights will fill this list/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/recent staff-level ownership/i)).not.toBeInTheDocument();
  });
});
