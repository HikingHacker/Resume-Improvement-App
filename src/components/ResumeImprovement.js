import React, { useState } from 'react';
import { Upload, FileText, Briefcase, Lightbulb, Zap, Layers, ArrowLeft } from 'lucide-react';
import { Button, StepNavigation } from './ui';
import { useResumeContext } from '../contexts/ResumeContext';
import { PHASES, PHASE_LABELS, getPhaseIndex, getPreviousPhase } from '../constants/workflow';
import ResumeUpload from './steps/ResumeUpload';
import ResumeOverview from './steps/ResumeOverview';
import TargetJobs from './steps/TargetJobs';
import InsightsReview from './steps/InsightsReview';
import ImproveWorkspace from './steps/ImproveWorkspace';
import FinalReview from './steps/FinalReview';

const navigationSteps = [
  { value: PHASES.UPLOAD, label: PHASE_LABELS[PHASES.UPLOAD], icon: <Upload className="w-4 h-4" /> },
  { value: PHASES.CONFIRM, label: PHASE_LABELS[PHASES.CONFIRM], icon: <FileText className="w-4 h-4" /> },
  { value: PHASES.TARGET, label: PHASE_LABELS[PHASES.TARGET], icon: <Briefcase className="w-4 h-4" /> },
  { value: PHASES.INSIGHTS, label: PHASE_LABELS[PHASES.INSIGHTS], icon: <Lightbulb className="w-4 h-4" /> },
  { value: PHASES.IMPROVE, label: PHASE_LABELS[PHASES.IMPROVE], icon: <Zap className="w-4 h-4" /> },
  { value: PHASES.REVIEW, label: PHASE_LABELS[PHASES.REVIEW], icon: <Layers className="w-4 h-4" /> },
];

const ResumeImprovement = () => {
  const {
    step,
    resumeData,
    handleStepNavigation,
    handleNavigation,
  } = useResumeContext();
  const [insightsOpen, setInsightsOpen] = useState(true);

  const hasResumeData = resumeData.bullet_points.length > 0;
  const currentIndex = getPhaseIndex(step);
  const previousPhase = getPreviousPhase(step);

  const isStepCompleted = (stepValue) => currentIndex > getPhaseIndex(stepValue);

  const disabledSteps = hasResumeData
    ? []
    : [PHASES.CONFIRM, PHASES.TARGET, PHASES.INSIGHTS, PHASES.IMPROVE, PHASES.REVIEW];

  const renderStep = () => {
    switch (step) {
      case PHASES.CONFIRM:
        return <ResumeOverview />;
      case PHASES.TARGET:
        return <TargetJobs />;
      case PHASES.INSIGHTS:
        return <InsightsReview />;
      case PHASES.IMPROVE:
        return (
          <ImproveWorkspace
            insightsOpen={insightsOpen}
            onToggleInsights={() => setInsightsOpen((open) => !open)}
          />
        );
      case PHASES.REVIEW:
        return <FinalReview />;
      case PHASES.UPLOAD:
      default:
        return <ResumeUpload />;
    }
  };

  const showBackButton = step === PHASES.IMPROVE;
  const maxWidthClass = 'w-full';

  return (
    <div className="min-h-full flex flex-col items-center">
      <div className="w-full max-w-[90rem] flex flex-col items-center flex-grow py-6 px-4 lg:px-8">
        <div className="w-full px-0 sm:px-2 mb-6">
          <StepNavigation
            currentStep={step}
            steps={navigationSteps}
            onStepClick={(nextStep) => handleStepNavigation(nextStep)}
            disabled={disabledSteps}
            isStepCompleted={isStepCompleted}
          />
        </div>

        <div key={step} className={`w-full flex justify-center ${maxWidthClass}`}>
          {renderStep()}
        </div>

        {showBackButton && (
          <div className={`w-full mt-6 ${maxWidthClass}`}>
            <Button
              onClick={() => handleNavigation('back')}
              variant="outline"
              aria-label={previousPhase ? `Back to ${PHASE_LABELS[previousPhase]}` : 'Go back'}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {previousPhase ? `Back to ${PHASE_LABELS[previousPhase]}` : 'Back'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeImprovement;
