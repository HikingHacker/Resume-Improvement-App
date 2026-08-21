import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useResumeContext } from '../../contexts/ResumeContext';
import { PHASES } from '../../constants/workflow';
import ResumeOverview from './ResumeOverview';

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
      achievements: ['Led platform work'],
      achievementIds: ['bullet-1'],
    },
  ],
};

describe('ResumeOverview', () => {
  beforeAll(() => {
    window.scrollTo = jest.fn();
  });

  it('sends Confirm to Insights', async () => {
    const handleStepNavigation = jest.fn();
    useResumeContext.mockReturnValue({
      resumeData,
      editingJobIndex: null,
      editingJob: null,
      startEditingJob: jest.fn(),
      saveEditedJob: jest.fn(),
      setEditingJob: jest.fn(),
      setEditingJobIndex: jest.fn(),
      editingBulletInfo: { jobIndex: null, bulletIndex: null },
      editedBullet: '',
      startEditingBullet: jest.fn(),
      saveEditedBullet: jest.fn(),
      setEditingBulletInfo: jest.fn(),
      setEditedBullet: jest.fn(),
      handleStepNavigation,
      handleNavigation: jest.fn(),
      addJob: jest.fn(),
      addBullet: jest.fn(),
      removeBullet: jest.fn(),
      removeJob: jest.fn(),
    });

    render(<ResumeOverview />);
    await userEvent.click(screen.getAllByRole('button', { name: /trust the parser — continue/i })[0]);
    expect(handleStepNavigation).toHaveBeenCalledWith(PHASES.TARGET);
  });
});
