import React, { useMemo } from 'react';
import { Badge } from '../ui';
import { useResumeContext } from '../../contexts/ResumeContext';
import { listRankedBullets } from '../../utils/bulletPriority';
import { buildInsightTasks, getGuideForBullet } from '../../utils/insightTasks';

export { getBulletInsightChips } from '../../utils/insightTasks';

const InsightsPanel = ({ currentBulletText, currentImprovement, bulletId }) => {
  const {
    resumeAnalysis,
    resumeData,
    targetRole,
    jobDescriptions,
    savedBullets,
    skippedBullets,
  } = useResumeContext();

  const ranked = useMemo(
    () => listRankedBullets(resumeData, { targetRole, jobDescriptions }),
    [resumeData, targetRole, jobDescriptions]
  );
  const tasks = useMemo(
    () => buildInsightTasks(resumeData, resumeAnalysis, {
      targetRole,
      jobDescriptions,
      savedBullets,
      skippedBullets,
    }),
    [resumeData, resumeAnalysis, targetRole, jobDescriptions, savedBullets, skippedBullets]
  );
  const rankedBullet = ranked.find((item) => item.bulletId === bulletId);
  const guide = getGuideForBullet(
    {
      bulletId,
      text: currentBulletText,
      reasons: rankedBullet?.reasons || [],
    },
    {
      analysis: resumeAnalysis,
      improvement: currentImprovement,
      tasks,
    }
  );

  return (
    <div className="space-y-5 text-sm">
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900">Why this one</h3>
        {guide.reasons.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {guide.reasons.map((reason) => (
              <Badge key={reason} variant="warning" size="sm">{reason}</Badge>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No extra ranking flags.</p>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900">What to change</h3>
        {guide.remainingWeakness ? (
          <p className="text-gray-700">{guide.remainingWeakness}</p>
        ) : (
          <p className="text-gray-500">No extra flags for this bullet.</p>
        )}
      </div>

      {guide.matchingTasks.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">From the diagnosis</h3>
          <ul className="space-y-1 text-gray-700 list-disc pl-4">
            {guide.matchingTasks.map((task) => (
              <li key={task.id}>{task.title}</li>
            ))}
          </ul>
        </div>
      )}

      {guide.keywords.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">Try to hit if true</h3>
          <div className="flex flex-wrap gap-1.5">
            {guide.keywords.map((keyword) => (
              <Badge key={keyword} variant="light" size="sm">{keyword}</Badge>
            ))}
          </div>
        </div>
      )}

      {guide.followUp && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
          <p className="font-medium mb-1">Add a detail</p>
          <p>{guide.followUp}</p>
        </div>
      )}

      {guide.openTasks.length > 0 && (
        <div className="border-t border-gray-200 pt-4 space-y-2">
          <h3 className="font-semibold text-gray-900">Still open on the resume</h3>
          <p className="text-xs text-gray-500">Leftover checklist only — not the full report.</p>
          <ul className="space-y-1 text-gray-700 list-disc pl-4">
            {guide.openTasks.map((task) => (
              <li key={task.id}>{task.title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default InsightsPanel;
