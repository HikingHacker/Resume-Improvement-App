import React from 'react';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Textarea,
} from '../ui';
import { useResumeContext } from '../../contexts/ResumeContext';
import { PHASES } from '../../constants/workflow';
import { MAX_JOB_DESCRIPTIONS, normalizeJobDescriptions } from '../../utils/bulletPriority';

const TargetJobs = () => {
  const {
    targetRole,
    jobDescriptions,
    setTargetRole,
    setJobDescriptions,
    handleStepNavigation,
    handleNavigation,
  } = useResumeContext();

  const descriptionFields = jobDescriptions?.length ? jobDescriptions : [''];
  const filledDescriptionCount = normalizeJobDescriptions(descriptionFields).length;
  const canAddDescription = descriptionFields.length < MAX_JOB_DESCRIPTIONS;

  const updateJobDescription = (index, value) => {
    const next = descriptionFields.map((item, itemIndex) => (itemIndex === index ? value : item));
    setJobDescriptions(next);
  };

  const addJobDescription = () => {
    if (!canAddDescription) return;
    setJobDescriptions([...descriptionFields, '']);
  };

  const removeJobDescription = (index) => {
    if (descriptionFields.length === 1) {
      setJobDescriptions(['']);
      return;
    }
    setJobDescriptions(descriptionFields.filter((_, itemIndex) => itemIndex !== index));
  };

  const goToInsights = () => {
    window.scrollTo(0, 0);
    handleStepNavigation(PHASES.INSIGHTS);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Add job details</CardTitle>
        <CardDescription>
          Paste the roles you would actually apply to. Overlapping skills and language help tailor insights and rewrites.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Input
          label="What role are you targeting? (optional)"
          placeholder="e.g. Staff Product Designer"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
        />

        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium text-gray-700">
              Paste job descriptions (optional)
            </p>
            <p className="text-xs text-gray-500">
              {filledDescriptionCount} of {MAX_JOB_DESCRIPTIONS}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Collect 5–10 postings. More postings make the overlap clearer.
          </p>
          {descriptionFields.map((description, index) => (
            <div key={`job-description-${index}`} className="space-y-1">
              <Textarea
                label={descriptionFields.length > 1 ? `Job description ${index + 1}` : undefined}
                aria-label={descriptionFields.length > 1 ? `Job description ${index + 1}` : 'Job description'}
                placeholder="Paste a posting here."
                value={description}
                onChange={(event) => updateJobDescription(index, event.target.value)}
                rows={5}
              />
              {descriptionFields.length > 1 && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeJobDescription(index)}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          ))}
          {canAddDescription ? (
            <Button
              variant="outline"
              size="sm"
              onClick={addJobDescription}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add another job description
            </Button>
          ) : (
            <p className="text-xs text-gray-500">That’s the maximum of {MAX_JOB_DESCRIPTIONS} postings.</p>
          )}
          {filledDescriptionCount > 0 && filledDescriptionCount < 5 && canAddDescription && (
            <p className="text-xs text-gray-500">
              A few more postings (aim for 5–10) will make the overlap clearer.
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t border-gray-200 pt-4">
        <Button onClick={() => handleNavigation('back')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Confirm
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={goToInsights}>
            Skip for now
          </Button>
          <Button variant="primary" onClick={goToInsights}>
            See tailored insights
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TargetJobs;
