import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle, Copy, Download } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
} from '../ui';
import { useResumeContext } from '../../contexts/ResumeContext';
import { PHASES } from '../../constants/workflow';
import AddMissingSkills from './AddMissingSkills';
import { countPlaceholderBullets, hasPlaceholders } from '../../utils/placeholders';

const buildFallbackRecommendations = (analysis) => {
  const skills = (analysis?.missingSkills || [])
    .map((item) => (typeof item === 'string' ? item : item?.name))
    .filter(Boolean);
  if (!skills.length) return null;
  return {
    success: true,
    source: 'analysis',
    generalImprovements: analysis.areasForImprovement || [],
    missingConcepts: [
      {
        category: 'Skills to consider adding',
        skills: skills.map((name) => ({
          name,
          recommendation: 'Add a bullet that shows how you used this skill, only if it is true to your experience.',
        })),
      },
    ],
    aiInsights: [],
  };
};

const FinalReview = () => {
  const {
    resumeData,
    improvements,
    originalBullets,
    savedBullets,
    getBulletId,
    copyRewrittenBullets,
    downloadRewrittenAsText,
    selectBullet,
    handleStepNavigation,
    handleNavigation,
    getImprovementAnalytics,
    getAISuggestions,
    startOperation,
    endOperation,
    setErrors,
    setResumeData,
    setResumeEdited,
    resumeAnalysis,
    skippedBullets = {},
    targetRole,
    jobDescriptions,
  } = useResumeContext();

  const [copied, setCopied] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [skillsError, setSkillsError] = useState(null);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [newSkillBullets, setNewSkillBullets] = useState({});
  const [selectedSkillCategory, setSelectedSkillCategory] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [targetJobForSkill, setTargetJobForSkill] = useState(null);
  const [generatingSkillBullet, setGeneratingSkillBullet] = useState(false);
  const analyticsInFlight = useRef(false);
  const recommendationsRef = useRef(null);
  recommendationsRef.current = aiRecommendations;

  const loadSkillRecommendations = useCallback(async (force = false) => {
    if (analyticsInFlight.current && !force) {
      return;
    }
    if (!force && recommendationsRef.current?.source === 'analytics') {
      return;
    }

    const fallback = buildFallbackRecommendations(resumeAnalysis);
    if (fallback) {
      setAiRecommendations((prev) => (prev?.missingConcepts?.length ? prev : fallback));
    }

    analyticsInFlight.current = true;
    setSkillsLoading(!fallback && !recommendationsRef.current?.missingConcepts?.length);
    setSkillsError(null);
    try {
      const data = await getImprovementAnalytics(resumeData, improvements, savedBullets, {
        targetRole,
        jobDescriptions,
      });
      if (data?.missingConcepts?.length) {
        setAiRecommendations({ ...data, source: 'analytics' });
        return;
      }
      if (fallback) {
        setAiRecommendations(fallback);
        return;
      }
      setSkillsError('We could not load skill suggestions. Try again.');
    } catch (error) {
      if (fallback) {
        setAiRecommendations(fallback);
        return;
      }
      setSkillsError(error.message || 'We could not load skill suggestions. Try again.');
    } finally {
      analyticsInFlight.current = false;
      setSkillsLoading(false);
    }
  }, [getImprovementAnalytics, improvements, resumeAnalysis, resumeData, savedBullets, targetRole, jobDescriptions]);

  const totalBullets = resumeData.bullet_points.reduce(
    (sum, job) => sum + (job.achievements?.length || 0),
    0
  );
  const rewrittenCount = resumeData.bullet_points.reduce((count, job, jobIndex) => {
    return count + (job.achievements || []).reduce((inner, _, bulletIndex) => {
      const bulletId = getBulletId(jobIndex, bulletIndex);
      return inner + (improvements[bulletId]?.improvedBulletPoint || savedBullets[bulletId] ? 1 : 0);
    }, 0);
  }, 0);
  const skippedCount = resumeData.bullet_points.reduce((count, job, jobIndex) => {
    return count + (job.achievements || []).reduce((inner, _, bulletIndex) => {
      const bulletId = getBulletId(jobIndex, bulletIndex);
      return inner + (skippedBullets[bulletId] && !improvements[bulletId]?.improvedBulletPoint && !savedBullets[bulletId] ? 1 : 0);
    }, 0);
  }, 0);
  const placeholderCount = countPlaceholderBullets(resumeData, improvements, getBulletId);
  const unchangedCount = Math.max(0, totalBullets - rewrittenCount);

  useEffect(() => {
    loadSkillRecommendations();
  }, [loadSkillRecommendations, showSkills]);

  const generateSkillBullet = async (skillName, skillRecommendation, jobDetails) => {
    try {
      setGeneratingSkillBullet(true);
      startOperation('generate');
      const skillId = `${skillName}-${jobDetails.company}-${jobDetails.position}`.replace(/\s+/g, '-').toLowerCase();
      if (newSkillBullets[skillId]) {
        return newSkillBullets[skillId];
      }

      const result = await getAISuggestions('', '', skillId, {
        task: 'skill',
        skillName,
        skillRecommendation,
        jobDetails,
      });

      if (result && result.improvedBulletPoint) {
        let bulletOptions = result.multipleSuggestions?.length
          ? result.multipleSuggestions
          : result.improvedBulletPoint
            .split('###')
            .map((option) => option.trim().replace(/^•\s*/, ''))
            .filter(Boolean);

        if (bulletOptions.length === 0) {
          bulletOptions = [result.improvedBulletPoint.replace(/^•\s*/, '')];
        }

        setNewSkillBullets((prev) => ({
          ...prev,
          [skillId]: {
            bullet: bulletOptions[0],
            multipleBullets: bulletOptions,
            selectedVariation: 0,
            skill: skillName,
            jobIndex: resumeData.bullet_points.findIndex(
              (job) => job.company === jobDetails.company && job.position === jobDetails.position
            ),
            category: selectedSkillCategory,
          },
        }));

        return bulletOptions[0];
      }
      throw new Error('Failed to generate bullet point');
    } catch (error) {
      console.error('Error generating skill bullet:', error);
      setErrors((prev) => ({ ...prev, generate: 'Failed to generate bullet point. Please try again.' }));
      return null;
    } finally {
      endOperation('generate');
      setGeneratingSkillBullet(false);
    }
  };

  const saveNewSkillBullet = (skillId, bulletText, targetJob) => {
    if (!skillId || !bulletText || !targetJob) return;
    const jobIndex = resumeData.bullet_points.findIndex(
      (job) => job.company === targetJob.company && job.position === targetJob.position
    );
    if (jobIndex === -1) return;

    const updatedJobs = [...resumeData.bullet_points];
    updatedJobs[jobIndex] = {
      ...updatedJobs[jobIndex],
      achievements: [...updatedJobs[jobIndex].achievements, bulletText],
    };
    setResumeData({ ...resumeData, bullet_points: updatedJobs });
    setNewSkillBullets((prev) => ({
      ...prev,
      [skillId]: {
        ...prev[skillId],
        bullet: bulletText,
        jobIndex,
        added: true,
      },
    }));
    setResumeEdited(true);
  };

  const handleCopy = async () => {
    const success = await copyRewrittenBullets();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openBullet = (jobIndex, bulletIndex) => {
    selectBullet(jobIndex, bulletIndex);
    handleStepNavigation(PHASES.IMPROVE);
  };

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Review your rewrites</CardTitle>
          <CardDescription>
            {rewrittenCount} rewritten, {skippedCount} skipped, {unchangedCount} original
            {placeholderCount > 0 ? `, ${placeholderCount} with gaps to fill` : ''}.
            This is a rewrite pack you can paste into your resume — not a formatted CV.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <p>
              {rewrittenCount} rewritten · {skippedCount} skipped · {unchangedCount} original
              {placeholderCount > 0 ? ` · ${placeholderCount} still have [placeholders]` : ''}
            </p>
            {unchangedCount > 0 && (
              <p className="mt-1 text-gray-500">
                {unchangedCount} original {unchangedCount === 1 ? 'bullet is' : 'bullets are'} unchanged — continue anyway, or click a row to improve it.
              </p>
            )}
            <p className="mt-1 text-gray-500">
              Paste into your existing resume. This is not a formatted CV.
            </p>
          </div>
          {resumeData.bullet_points.map((job, jobIndex) => (
            <div key={`${job.company}-${jobIndex}`} className="space-y-3">
              <div className="p-4 border rounded-lg bg-gray-50">
                <h3 className="font-bold text-lg text-gray-900 mb-1">{job.company}</h3>
                <div className="text-gray-700">{job.position}</div>
                {job.time_period && (
                  <div className="text-sm text-gray-600">{job.time_period}</div>
                )}
              </div>

              <Table className="w-full table-fixed border border-gray-200">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2">Original</TableHead>
                    <TableHead className="w-1/2">Rewritten</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {job.achievements?.map((bullet, bulletIndex) => {
                    const bulletId = getBulletId(jobIndex, bulletIndex);
                    const improved = improvements[bulletId]?.improvedBulletPoint;
                    const originalBullet = originalBullets[bulletId] || bullet;
                    const wasRewritten = Boolean(improved);
                    const hasGaps = hasPlaceholders(improved || bullet);

                    return (
                      <TableRow
                        key={bulletId}
                        interactive
                        className="cursor-pointer"
                        onClick={() => openBullet(jobIndex, bulletIndex)}
                      >
                        <TableCell className="align-top">{originalBullet}</TableCell>
                        <TableCell className={wasRewritten
                          ? 'align-top bg-green-50'
                          : 'align-top bg-gray-50 text-gray-500'}
                        >
                          {improved || 'Not rewritten — click to improve'}
                          {hasGaps && (
                            <span className="block text-xs text-amber-700 mt-1">Has gaps to fill</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ))}

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Button onClick={handleCopy} variant="primary" size="lg">
              {copied ? <CheckCircle className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
              {copied ? 'Copied' : 'Copy rewritten bullets'}
            </Button>
            <Button onClick={downloadRewrittenAsText} variant="outline" size="lg">
              <Download className="w-5 h-5 mr-2" />
              Download as text
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t border-gray-200 pt-4">
          <Button onClick={() => handleNavigation('back')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Improve
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowSkills((open) => !open)}
          >
            {showSkills ? 'Hide optional skills' : 'Add missing skills (optional)'}
          </Button>
        </CardFooter>
      </Card>

      {showSkills && (
        <AddMissingSkills
          embedded
          resumeData={resumeData}
          aiRecommendations={aiRecommendations}
          targetJobForSkill={targetJobForSkill}
          setTargetJobForSkill={setTargetJobForSkill}
          selectedSkillCategory={selectedSkillCategory}
          setSelectedSkillCategory={setSelectedSkillCategory}
          selectedSkill={selectedSkill}
          setSelectedSkill={setSelectedSkill}
          newSkillBullets={newSkillBullets}
          setNewSkillBullets={setNewSkillBullets}
          generateSkillBullet={generateSkillBullet}
          generatingSkillBullet={generatingSkillBullet}
          saveNewSkillBullet={saveNewSkillBullet}
          loading={{ analytics: skillsLoading }}
          error={skillsError}
          onRetry={() => loadSkillRecommendations(true)}
          onNext={() => setShowSkills(false)}
          onBack={() => setShowSkills(false)}
        />
      )}
    </div>
  );
};

export default FinalReview;
