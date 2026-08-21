import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  CheckCircle,
  Info,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Textarea,
} from '../ui';
import { useResumeContext } from '../../contexts/ResumeContext';
import InsightsPanel, { getBulletInsightChips } from './InsightsPanel';
import { normalizeJobDescriptions } from '../../utils/bulletPriority';
import { getDetailQuestionPlaceholder } from '../../utils/detailQuestions';
import { countPlaceholders, extractPlaceholders, hasInventedNumbers } from '../../utils/placeholders';

const getBulletStatus = (bulletId, improvements, savedBullets, skippedBullets) => {
  if (savedBullets[bulletId]) return 'saved';
  if (skippedBullets[bulletId]) return 'skipped';
  if (improvements[bulletId]?.improvedBulletPoint) return 'suggested';
  return 'todo';
};

const statusBadge = (status) => {
  if (status === 'saved') return <Badge variant="success" size="sm">Saved</Badge>;
  if (status === 'skipped') return <Badge variant="light" size="sm">Skipped</Badge>;
  if (status === 'suggested') return <Badge variant="warning" size="sm">Suggested</Badge>;
  return <Badge variant="light" size="sm">To do</Badge>;
};

const DetailQuestionsForm = ({
  questions,
  answers,
  onChange,
  onSubmit,
  loading,
  submitLabel,
}) => (
  <div className="border border-amber-200 rounded-lg p-4 space-y-3 bg-amber-50">
    <p className="text-sm font-medium text-amber-800 flex items-center">
      <Lightbulb className="w-4 h-4 mr-2" />
      Add details to fill the gaps
    </p>
    {questions.map((question, index) => (
      <div key={question}>
        <p className="text-sm text-gray-800 mb-1">{question}</p>
        <Textarea
          placeholder={getDetailQuestionPlaceholder(question)}
          value={answers?.[index] || ''}
          onChange={(e) => onChange(index, e.target.value)}
          rows={2}
        />
      </div>
    ))}
    <Button
      variant="secondary"
      loading={loading}
      onClick={onSubmit}
    >
      <Sparkles className="w-4 h-4 mr-2" />
      {submitLabel}
    </Button>
  </div>
);

const ImproveWorkspace = ({ insightsOpen, onToggleInsights }) => {
  const {
    resumeData,
    currentJobIndex,
    currentBulletIndex,
    improvements,
    savedBullets,
    skippedBullets,
    originalBullets,
    additionalContexts,
    showFollowUpForBullets,
    loading,
    errors,
    targetRole,
    jobDescriptions,
    getBulletId,
    getCurrentBulletId,
    getTotalBulletPoints,
    getCurrentBulletPointNumber,
    selectBullet,
    selectFirstBullet,
    handleBulletPointImprovement,
    handleBulletDetails,
    handleAdditionalContextChange,
    handleAdditionalContextSubmit,
    navigateBulletPoints,
    saveBulletPoint,
    skipBullet,
    skipRestOfRole,
    updateImprovement,
  } = useResumeContext();

  const jobs = resumeData.bullet_points || [];
  const rewriteRef = useRef(null);
  const [pendingAction, setPendingAction] = useState(null);

  const filledJobDescriptionCount = useMemo(
    () => normalizeJobDescriptions(jobDescriptions).length,
    [jobDescriptions]
  );

  useEffect(() => {
    if (currentJobIndex === null || currentBulletIndex === null) {
      selectFirstBullet();
    }
  }, [currentJobIndex, currentBulletIndex, selectFirstBullet]);

  const bulletId = getCurrentBulletId();
  const currentJob = currentJobIndex !== null ? jobs[currentJobIndex] : null;
  const currentBullet = currentJob?.achievements?.[currentBulletIndex];
  const currentImprovement = bulletId ? improvements[bulletId] : null;
  const totalBullets = getTotalBulletPoints();
  const currentNumber = getCurrentBulletPointNumber();
  const savedCount = Object.keys(savedBullets).length;
  const chips = getBulletInsightChips(currentBullet, currentImprovement);
  const hasRewrite = Boolean(currentImprovement?.improvedBulletPoint);
  const detailQuestions = currentImprovement?.followUpQuestions || [];
  const showingDetails = Boolean(showFollowUpForBullets[bulletId] && detailQuestions.length);
  const isImproving = Boolean(loading.improve || (bulletId && loading.bulletMap?.[bulletId]));

  const editedText =
    currentImprovement?.currentlyEditing ||
    currentImprovement?.improvedBulletPoint ||
    '';
  const placeholders = extractPlaceholders(editedText);
  const placeholderCount = countPlaceholders(editedText);
  const userContext = Object.values(additionalContexts[bulletId] || {}).join(' ');
  const inventedNumbers = currentImprovement
    ? hasInventedNumbers(originalBullets[bulletId] || currentBullet, editedText, userContext)
    : false;

  useEffect(() => {
    setPendingAction(null);
  }, [bulletId]);

  const handleSaveAndNext = () => {
    if (!bulletId || !editedText) return;
    const success = saveBulletPoint(bulletId, editedText);
    if (success) {
      navigateBulletPoints('next');
    }
  };

  const startDetails = async () => {
    setPendingAction('details');
    try {
      await handleBulletDetails();
    } finally {
      setPendingAction(null);
    }
  };

  const startRewrites = async (requestId = null) => {
    setPendingAction('rewrites');
    try {
      await handleBulletPointImprovement(requestId);
    } finally {
      setPendingAction(null);
    }
  };

  const selectPlaceholder = (placeholder) => {
    const textarea = rewriteRef.current;
    const start = editedText.indexOf(placeholder);
    if (start < 0) return;
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(start, start + placeholder.length);
    }
  };

  useLayoutEffect(() => {
    const textarea = rewriteRef.current;
    if (!textarea) return;

    const resizeToContent = () => {
      textarea.style.height = 'auto';
      const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight);
      const extraRow = Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : 24;
      textarea.style.height = `${textarea.scrollHeight + extraRow}px`;
    };

    resizeToContent();

    let lastWidth = textarea.offsetWidth;
    const parent = textarea.parentElement;
    const observer = parent
      ? new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect?.width;
        if (width == null || Math.round(width) === Math.round(lastWidth)) return;
        lastWidth = width;
        resizeToContent();
      })
      : null;
    observer?.observe(parent);
    window.addEventListener('resize', resizeToContent);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', resizeToContent);
    };
  }, [editedText, insightsOpen]);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {currentJob ? (
            <>
              <h2 className="text-lg font-semibold text-gray-900 leading-tight">
                {currentJob.position}
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">
                {currentJob.company}
                {currentJob.time_period ? ` · ${currentJob.time_period}` : ''}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Bullet {currentNumber || 0} of {totalBullets} · {savedCount} saved
              </p>
              {(targetRole || filledJobDescriptionCount > 0) && (
                <p className="text-xs text-primary-700 mt-1">
                  Tailoring
                  {targetRole ? ` for ${targetRole}` : ''}
                  {filledJobDescriptionCount > 0
                    ? ` using ${filledJobDescriptionCount} job description${filledJobDescriptionCount === 1 ? '' : 's'}`
                    : ''}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm font-medium text-gray-900">
              Improving {currentNumber || 0} of {totalBullets}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onToggleInsights}>
            {insightsOpen ? 'Hide guide' : 'Guide'}
          </Button>
        </div>
      </div>

      <div className={`grid gap-4 ${insightsOpen ? 'lg:grid-cols-[minmax(220px,24%)_minmax(0,1fr)_minmax(200px,22%)]' : 'lg:grid-cols-[minmax(220px,26%)_minmax(0,1fr)]'}`}>
        <Card className="h-fit max-h-[80vh] overflow-auto">
          <CardHeader className="py-3">
            <CardTitle className="text-base">Bullets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {jobs.map((job, jobIndex) => {
              const isCurrentJob = jobIndex === currentJobIndex;
              const visibleBullets = (job.achievements || [])
                .map((bullet, bulletIndex) => ({ bullet, bulletIndex, id: getBulletId(jobIndex, bulletIndex) }));

              if (visibleBullets.length === 0) return null;

              return (
              <div key={job.id || `${job.company}-${jobIndex}`}>
                <div
                  className={`mb-2 rounded-md px-2 py-2 ${
                    isCurrentJob
                      ? 'bg-primary-50 border border-primary-200'
                      : 'bg-gray-100 border border-transparent'
                  }`}
                >
                  <p className={`text-sm font-semibold leading-tight ${
                    isCurrentJob
                      ? 'text-primary-800'
                      : 'text-gray-800'
                  }`}>
                    {job.position}
                  </p>
                  <p className={`text-xs mt-0.5 ${
                    isCurrentJob
                      ? 'text-primary-700'
                      : 'text-gray-500'
                  }`}>
                    {job.company}
                    {job.time_period ? ` · ${job.time_period}` : ''}
                  </p>
                </div>
                <div className="space-y-1">
                  {visibleBullets.map(({ bullet, bulletIndex, id }) => {
                    const status = getBulletStatus(id, improvements, savedBullets, skippedBullets);
                    const selected = jobIndex === currentJobIndex && bulletIndex === currentBulletIndex;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => selectBullet(jobIndex, bulletIndex)}
                        className={`w-full text-left rounded-md border p-2 transition-colors ${
                          selected
                            ? 'border-primary-400 bg-primary-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs text-gray-500">#{bulletIndex + 1}</span>
                          {statusBadge(status)}
                        </div>
                        <p className="text-sm text-gray-800 line-clamp-3">{bullet}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Rewrite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentJobIndex === null ? (
              <p className="text-gray-600">Select a bullet to rewrite it.</p>
            ) : (
              <>
                <div className="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2">
                  <Briefcase className="w-4 h-4 text-primary-700 flex-shrink-0" />
                  <p className="text-sm text-gray-700 min-w-0 truncate">
                    <span className="font-semibold text-gray-900">{currentJob.position}</span>
                    {' · '}
                    {currentJob.company}
                    {' · '}
                    Bullet {currentBulletIndex + 1} of {currentJob.achievements?.length || 0}
                  </p>
                </div>

                {chips.length > 0 && (
                  <div className="space-y-2">
                    {chips.filter((chip) => chip.length <= 32).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {chips.filter((chip) => chip.length <= 32).map((chip) => (
                          <Badge key={chip} variant="warning" size="sm" className="whitespace-nowrap">
                            {chip}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {chips.filter((chip) => chip.length > 32).map((chip) => (
                      <div
                        key={chip}
                        className="w-full rounded-md bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-2 text-sm leading-relaxed whitespace-normal break-words"
                      >
                        {chip}
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Original</h3>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm text-gray-800">
                    {originalBullets[bulletId] || currentBullet}
                  </div>
                </div>

                {!hasRewrite && (
                  <div className="space-y-4">
                    {(isImproving || pendingAction) && (
                      <p className="text-sm text-primary-600 flex items-center">
                        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {pendingAction === 'details' ? 'Generating questions...' : 'Generating rewrite options...'}
                      </p>
                    )}

                    {showingDetails && (
                      <DetailQuestionsForm
                        questions={detailQuestions}
                        answers={additionalContexts[bulletId]}
                        onChange={handleAdditionalContextChange}
                        onSubmit={handleAdditionalContextSubmit}
                        loading={isImproving}
                        submitLabel="Suggest rewrites"
                      />
                    )}

                    {!showingDetails && !isImproving && !pendingAction && (
                      <div className="grid sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={startDetails}
                          className="text-left rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 p-4 transition-colors"
                        >
                          <p className="text-sm font-semibold text-amber-900 flex items-center">
                            <Lightbulb className="w-4 h-4 mr-2" />
                            Add details
                          </p>
                          <p className="text-sm text-amber-800 mt-1">
                            Answer a few questions first so the rewrite can use real facts.
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => startRewrites()}
                          className="text-left rounded-lg border border-primary-300 bg-primary-50 hover:bg-primary-100 p-4 transition-colors"
                        >
                          <p className="text-sm font-semibold text-primary-900 flex items-center">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Suggest rewrites
                          </p>
                          <p className="text-sm text-primary-800 mt-1">
                            Generate rewrite options from the original bullet now.
                          </p>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {errors.improve && (
                  <div className="text-red-500 text-sm p-3 bg-red-50 rounded border border-red-200">
                    {errors.improve}
                  </div>
                )}

                {hasRewrite && (
                  <div className="space-y-4">
                    {currentImprovement.multipleSuggestions?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Choose a variation</h3>
                        <div className="space-y-2">
                          {currentImprovement.multipleSuggestions.map((suggestion, index) => (
                            <button
                              key={`${suggestion}-${index}`}
                              type="button"
                              onClick={() => updateImprovement(bulletId, {
                                selectedVariation: index,
                                currentlyEditing: suggestion,
                                improvedBulletPoint: suggestion,
                              })}
                              className={`w-full text-left p-3 rounded-lg border text-sm ${
                                currentImprovement.selectedVariation === index
                                  ? 'border-primary-400 bg-primary-50'
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <label className="text-sm font-medium text-gray-700">Edit the rewrite</label>
                        <div className="flex flex-wrap items-center gap-1">
                          {!showingDetails && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isImproving}
                              onClick={startDetails}
                            >
                              <Lightbulb className="w-3.5 h-3.5 mr-1" />
                              Add details
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isImproving}
                            onClick={() => {
                              const variationRequestId = `${bulletId}-variation-${Date.now()}`;
                              startRewrites(variationRequestId);
                            }}
                          >
                            <Sparkles className="w-3.5 h-3.5 mr-1" />
                            New variations
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        ref={rewriteRef}
                        value={editedText}
                        onChange={(e) => updateImprovement(bulletId, {
                          currentlyEditing: e.target.value,
                          improvedBulletPoint: e.target.value,
                        })}
                        rows={1}
                        style={{ overflow: 'hidden', resize: 'none' }}
                      />
                    </div>

                    {placeholders.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Fill in the gaps</p>
                        <div className="flex flex-wrap gap-1.5">
                          {placeholders.map((placeholder, index) => (
                            <button
                              key={`${placeholder}-${index}`}
                              type="button"
                              onClick={() => selectPlaceholder(placeholder)}
                              className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-800"
                            >
                              {placeholder}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {inventedNumbers && (
                      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-3">
                        This rewrite added a number you did not provide. Replace it with a placeholder or a number you can stand behind.
                      </p>
                    )}

                    {currentImprovement.reasoning && (
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">
                        <p className="font-medium mb-1 flex items-center">
                          <Info className="w-4 h-4 mr-1" />
                          Why this works
                        </p>
                        {currentImprovement.reasoning}
                      </div>
                    )}

                    {showingDetails && (
                      <DetailQuestionsForm
                        questions={detailQuestions}
                        answers={additionalContexts[bulletId]}
                        onChange={handleAdditionalContextChange}
                        onSubmit={handleAdditionalContextSubmit}
                        loading={isImproving}
                        submitLabel="Rewrite with this context"
                      />
                    )}

                    {placeholderCount > 0 && (
                      <p className="text-xs text-amber-700">
                        {placeholderCount} gap{placeholderCount === 1 ? '' : 's'} still empty. You can save anyway.
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button variant="primary" onClick={handleSaveAndNext} disabled={!editedText}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Save and next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          skipBullet(bulletId);
                          navigateBulletPoints('next');
                        }}
                      >
                        Skip
                      </Button>
                      <Button variant="ghost" onClick={skipRestOfRole}>
                        Skip rest of this role
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {insightsOpen && (
          <Card className="h-fit max-h-[80vh] overflow-auto">
            <CardHeader className="py-3">
              <CardTitle className="text-base">Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <InsightsPanel
                currentBulletText={currentBullet}
                currentImprovement={currentImprovement}
                bulletId={bulletId}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ImproveWorkspace;
