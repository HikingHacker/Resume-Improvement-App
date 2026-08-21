import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  SkeletonText,
} from '../ui';
import { useResumeContext } from '../../contexts/ResumeContext';
import { PHASES } from '../../constants/workflow';
import { listRankedBullets } from '../../utils/bulletPriority';
import { buildInsightTasks } from '../../utils/insightTasks';

const skillName = (skill) => (typeof skill === 'string' ? skill : skill?.name);

const InsightsReview = () => {
  const {
    resumeData,
    resumeAnalysis,
    getResumeAnalysis,
    loading,
    errors,
    targetRole,
    jobDescriptions,
    savedBullets,
    skippedBullets,
    handleStepNavigation,
    handleNavigation,
  } = useResumeContext();

  const [selectedTaskId, setSelectedTaskId] = useState(null);

  useEffect(() => {
    getResumeAnalysis();
  }, [getResumeAnalysis]);

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

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || tasks[0] || null;
  const mappedBullets = useMemo(() => {
    if (!selectedTask) return [];
    const byId = new Set(selectedTask.bulletIds);
    return ranked.filter((item) => byId.has(item.bulletId));
  }, [ranked, selectedTask]);

  const missingAts = (resumeAnalysis?.atsKeywords || [])
    .filter((entry) => entry && entry.present !== true && entry.keyword)
    .map((entry) => entry.keyword);
  const missingSkills = (resumeAnalysis?.missingSkills || []).map(skillName).filter(Boolean);
  const recommendedRoles = resumeAnalysis?.recommendedRoles || [];
  const majorCompanies = resumeAnalysis?.companies?.major || [];
  const promisingCompanies = resumeAnalysis?.companies?.promising || [];

  const startRewriting = () => {
    handleStepNavigation(PHASES.IMPROVE, { first: true });
  };

  const analysisReady = Boolean(resumeAnalysis);
  const analysisPending = loading.analyze && !resumeAnalysis;

  return (
    <div className="w-full space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Here is how this resume reads</CardTitle>
          <CardDescription>
            {targetRole ? `Targeting ${targetRole}. ` : ''}
            Confirm already verified the extract. Use this diagnosis to decide where to rewrite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analysisPending && (
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">Generating insights…</p>
              <SkeletonText lines={4} />
            </div>
          )}
          {errors.analyze && !resumeAnalysis && (
            <div className="text-sm text-red-600 mb-4">
              <p className="mb-2">{errors.analyze}</p>
              <Button size="sm" variant="outline" onClick={() => getResumeAnalysis()}>Try again</Button>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,1fr)] lg:items-stretch">
            <div className="space-y-6 text-sm">
              {analysisReady && (
                <>
                  {(resumeAnalysis.strengths || []).length > 0 && (
                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-900">Strengths</h3>
                      <ul className="space-y-1 text-gray-700">
                        {resumeAnalysis.strengths.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-green-600" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {(resumeAnalysis.weaknesses || []).length > 0 && (
                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-900">Gaps</h3>
                      <ul className="space-y-1 text-gray-700">
                        {resumeAnalysis.weaknesses.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-yellow-600" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </>
              )}

              {tasks.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">Recommended changes</h3>
                  <p className="text-xs text-gray-500">
                    Click one to see which bullets it maps to. These become the Improve guide.
                  </p>
                  <div className="space-y-2">
                    {tasks.map((task) => {
                      const selected = selectedTask?.id === task.id;
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`w-full text-left rounded-md border p-3 transition-colors ${
                            selected
                              ? 'border-primary-400 bg-primary-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          {task.detail && (
                            <p className="text-xs text-gray-600 mt-1">{task.detail}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {missingAts.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">ATS keywords to add only if true</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {missingAts.map((keyword) => (
                      <Badge key={keyword} variant="light" size="sm">{keyword}</Badge>
                    ))}
                  </div>
                </section>
              )}

              {missingSkills.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">Skills to consider</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {missingSkills.map((skill) => (
                      <Badge key={skill} variant="light" size="sm">{skill}</Badge>
                    ))}
                  </div>
                </section>
              )}

              {recommendedRoles.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">Roles that fit</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {recommendedRoles.map((role) => (
                      <Badge key={role} variant="light" size="sm">{role}</Badge>
                    ))}
                  </div>
                </section>
              )}

              {(majorCompanies.length > 0 || promisingCompanies.length > 0) && (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">Companies to consider</h3>
                  {majorCompanies.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-gray-500">Major</p>
                      <div className="flex flex-wrap gap-1.5">
                        {majorCompanies.map((company) => (
                          <Badge key={company} variant="light" size="sm">{company}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {promisingCompanies.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-gray-500">Promising</p>
                      <div className="flex flex-wrap gap-1.5">
                        {promisingCompanies.map((company) => (
                          <Badge key={company} variant="light" size="sm">{company}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>

            <div className="relative min-h-0">
            <Card
              variant="bordered"
              className="h-fit shadow-none lg:absolute lg:inset-x-0 lg:top-0 lg:max-h-full lg:flex lg:flex-col lg:overflow-hidden"
            >
              <CardHeader className="py-4 flex-shrink-0">
                <CardTitle className="text-base">Work plan</CardTitle>
                <CardDescription>
                  {selectedTask
                    ? `Selected change maps to ${mappedBullets.length} ${mappedBullets.length === 1 ? 'bullet' : 'bullets'}.`
                    : 'Insights will fill this list as the diagnosis arrives.'}
                </CardDescription>
              </CardHeader>
              <CardContent
                key={selectedTask?.id}
                className="space-y-3 pt-0 lg:min-h-0 lg:flex-1 lg:overflow-y-auto"
              >
                {mappedBullets.map((item, index) => (
                  <div
                    key={item.bulletId}
                    className={`rounded-md border p-3 ${
                      index === 0 ? 'border-primary-300 bg-primary-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <p className="text-xs text-gray-500 mb-1">
                      {resumeData.bullet_points[item.jobIndex]?.position}
                      {' · '}
                      {resumeData.bullet_points[item.jobIndex]?.company}
                    </p>
                    <p className="text-sm text-gray-800">{item.text}</p>
                    {item.reasons?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {item.reasons.map((reason) => (
                          <Badge key={reason} variant="warning" size="sm">{reason}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-gray-200 pt-4">
          <Button onClick={() => handleNavigation('back')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Target
          </Button>
          <Button variant="primary" onClick={startRewriting}>
            Start rewriting
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default InsightsReview;
