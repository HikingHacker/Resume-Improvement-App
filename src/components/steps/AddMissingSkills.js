import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertTriangle, PenTool, Briefcase, Sparkles, Zap } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
  Textarea,
  Skeleton,
  SkeletonText
} from '../ui';

const AddMissingSkills = ({
  resumeData,
  aiRecommendations,
  targetJobForSkill,
  setTargetJobForSkill,
  selectedSkillCategory,
  setSelectedSkillCategory,
  selectedSkill,
  setSelectedSkill,
  newSkillBullets,
  setNewSkillBullets,
  generateSkillBullet,
  generatingSkillBullet,
  saveNewSkillBullet,
  onNext,
  onBack,
  loading,
  error = null,
  onRetry = null,
  embedded = false,
}) => {
  const [bulletText, setBulletText] = useState('');
  const [activeTab, setActiveTab] = useState('select'); //'select', 'generate', 'review'
  const [previewMode, setPreviewMode] = useState(false);
  const [confirmedSkillUse, setConfirmedSkillUse] = useState(false);

  const isAnalyticsLoading = loading?.analytics === true || loading?.analytics?.inProgress === true;
  const hasSkillSuggestions = Boolean(aiRecommendations?.missingConcepts?.length);

  // Reset selected skill when category changes
  useEffect(() => {
    setSelectedSkill(null);
  }, [selectedSkillCategory, setSelectedSkill]);

  // Reset bullet text when skill or job changes
  useEffect(() => {
    setBulletText('');
    setConfirmedSkillUse(false);
  }, [selectedSkill, targetJobForSkill]);

  // When a skill has a bullet generated, update the local state
  useEffect(() => {
    if (selectedSkill && targetJobForSkill) {
      const skillId = `${selectedSkill.name}-${targetJobForSkill.company}-${targetJobForSkill.position}`.replace(/\s+/g, '-').toLowerCase();
      if (newSkillBullets[skillId]?.bullet) {
        setBulletText(newSkillBullets[skillId].bullet);
      }
    }
  }, [selectedSkill, targetJobForSkill, newSkillBullets]);

  // Get a readable skill ID
  const getSkillId = (skill, job) => {
    if (!skill || !job) return null;
    return `${skill.name}-${job.company}-${job.position}`.replace(/\s+/g, '-').toLowerCase();
  };

  // Check if a bullet is already generated for the current selection
  const hasBulletGenerated = () => {
    if (!selectedSkill || !targetJobForSkill) return false;
    const skillId = getSkillId(selectedSkill, targetJobForSkill);
    return !!newSkillBullets[skillId]?.bullet;
  };

  // Count how many missing skills have been addressed
  const countAddressedSkills = () => {
    return Object.keys(newSkillBullets).length;
  };

  // Get total number of missing skills
  const getTotalMissingSkills = () => {
    if (!aiRecommendations?.missingConcepts) return 0;
    return aiRecommendations.missingConcepts.reduce((total, category) => {
      return total + category.skills.length;
    }, 0);
  };

  // Handle generation of new bullet point
  const handleGenerateBullet = async () => {
    if (!selectedSkill || !targetJobForSkill) return;

    try {
      await generateSkillBullet(
        selectedSkill.name,
        selectedSkill.recommendation,
        targetJobForSkill
      );
      setActiveTab('review');
    } catch (error) {
      console.error("Error generating bullet:", error);
    }
  };

  // Handle saving the generated bullet
  const handleSaveBullet = () => {
    if (!selectedSkill || !targetJobForSkill || !bulletText) return;

    try {
      const skillId = getSkillId(selectedSkill, targetJobForSkill);

      // Save the bullet to the resume
      saveNewSkillBullet(skillId, bulletText, targetJobForSkill);

      // Reset state
      setSelectedSkill(null);
      setBulletText('');
      setActiveTab('select');
    } catch (error) {
      console.error("Error saving bullet:", error);
    }
  };

  // Render the skills selection tab
  const renderSkillSelection = () => {
    // Loading state with skeleton UI
    if (isAnalyticsLoading && !hasSkillSuggestions) {
      return (
        <div className="space-y-6">
          {/* Skeleton for category selection */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-800">1. Select a Skill Category:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <div key={index} className="p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton for skill selection */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-800">2. Select a Specific Skill:</h3>
            <div className="grid grid-cols-1 gap-3 border p-4 rounded-lg border-gray-200 bg-gray-50">
              {[1, 2, 3].map((index) => (
                <div key={index} className="p-3 rounded-lg border border-gray-200 bg-white">
                  <div className="flex flex-col">
                    <Skeleton className="h-5 w-40 mb-2" />
                    <SkeletonText lines={2} className="w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-10 flex justify-end">
            <Skeleton className="w-40 h-10 rounded" />
          </div>
        </div>
      );
    }

    if (error && !hasSkillSuggestions) {
      return (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Skill suggestions did not load</h3>
          <p className="text-sm text-yellow-700 mb-4">
            {error}
          </p>
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Try again
            </Button>
          )}
        </div>
      );
    }

    if (!hasSkillSuggestions) {
      return (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-yellow-800 mb-2">No Missing Skills Found</h3>
          <p className="text-sm text-yellow-700">
            No missing skills were identified in your resume. You're good to go!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Skill Category Selection */}
        <div>
          <h3 className="font-semibold mb-3 text-gray-800">1. Select a Skill Category:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiRecommendations.missingConcepts.map((category, index) => (
              <button
                key={index}
                onClick={() => setSelectedSkillCategory(category)}
                className={`p-4 rounded-lg border text-left transition ${
                  selectedSkillCategory === category
                    ? 'border-primary-500 bg-primary-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-800">{category.category}</h4>
                  <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700 min-w-[60px] text-center">
                    {category.skills.length} skills
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Specific Skill Selection */}
        {selectedSkillCategory && (
          <div className="animate-fade-in">
            <h3 className="font-semibold mb-3 text-gray-800">2. Select a Specific Skill:</h3>
            <div className="grid grid-cols-1 gap-3 border p-4 rounded-lg border-gray-200 bg-gray-50">
              {selectedSkillCategory.skills.map((skill, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedSkill(skill)}
                  className={`p-3 rounded-lg border text-left transition ${
                    selectedSkill === skill
                      ? 'border-primary-500 bg-white shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex flex-col">
                    <h4 className="font-medium text-gray-800">{skill.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{skill.recommendation}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Job Selection */}
        {selectedSkill && (
          <div className="animate-fade-in">
            <h3 className="font-semibold mb-3 text-gray-800">3. Select a Job Position:</h3>
            <div className="space-y-3 border p-4 rounded-lg border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600 mb-2">
                Select the job position where you want to add the"{selectedSkill.name}" skill:
              </p>

              {resumeData.bullet_points.map((job, index) => (
                <button
                  key={index}
                  onClick={() => setTargetJobForSkill(job)}
                  className={`p-3 rounded-lg border w-full text-left transition ${
                    targetJobForSkill === job
                      ? 'border-primary-500 bg-white shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="mr-3">
                      <Briefcase className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{job.position}</h4>
                      <p className="text-sm text-gray-600">{job.company} {job.time_period ? `• ${job.time_period}` : ''}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Continue Button */}
        {selectedSkill && targetJobForSkill && (
          <div className="space-y-3 animate-fade-in">
            <label className="flex items-start gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmedSkillUse}
                onChange={(e) => setConfirmedSkillUse(e.target.checked)}
              />
              <span>I used {selectedSkill.name} in this role at {targetJobForSkill.company}.</span>
            </label>
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  const skillId = getSkillId(selectedSkill, targetJobForSkill);
                  if (newSkillBullets[skillId]?.bullet) {
                    setActiveTab('review');
                  } else {
                    setActiveTab('generate');
                  }
                }}
                variant="primary"
                disabled={!confirmedSkillUse && !hasBulletGenerated()}
              >
                {hasBulletGenerated() ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Review Generated Bullet
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Bullet Point
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render the generation tab
  const renderBulletGeneration = () => {
    return (
      <div className="space-y-6">
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-primary-800 flex items-center">
            <PenTool className="w-5 h-5 mr-2" />
            Bullet Point Generation
          </h3>
          <p className="text-sm text-primary-700">
            Generate a bullet point that demonstrates the <strong>{selectedSkill?.name}</strong> skill
            for your <strong>{targetJobForSkill?.position}</strong> position at <strong>{targetJobForSkill?.company}</strong>.
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-5 space-y-4">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Skill Details:</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h5 className="font-medium text-gray-800">{selectedSkill?.name}</h5>
              <p className="text-sm text-gray-600 mt-1">{selectedSkill?.recommendation}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-800 mb-2">Position Details:</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center">
                <div className="mr-3">
                  <Briefcase className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <h5 className="font-medium text-gray-800">{targetJobForSkill?.position}</h5>
                  <p className="text-sm text-gray-600">{targetJobForSkill?.company} {targetJobForSkill?.time_period ? `• ${targetJobForSkill?.time_period}` : ''}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleGenerateBullet}
              variant="primary"
              className="w-full"
              loading={generatingSkillBullet}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generatingSkillBullet ? 'Generating...' : 'Generate AI Bullet Point'}
            </Button>
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            onClick={() => setActiveTab('select')}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Selection
          </Button>
        </div>
      </div>
    );
  };

  // Render the review tab
  const renderBulletReview = () => {
    // Get the current skill ID
    const skillId = selectedSkill && targetJobForSkill ?
      getSkillId(selectedSkill, targetJobForSkill) : null;

    // Get bullet options if available
    const bulletOptions = (skillId && newSkillBullets[skillId]?.multipleBullets) || [];
    const selectedVariation = (skillId && newSkillBullets[skillId]?.selectedVariation) || 0;

    // Handle selection of a different bullet variation
    const handleVariationSelect = (index) => {
      if (!skillId) return;

      // Update the selected variation and current bullet text
      setBulletText(bulletOptions[index]);

      // Update the newSkillBullets state
      setNewSkillBullets(prev => ({
        ...prev,
        [skillId]: {
          ...prev[skillId],
          selectedVariation: index,
          bullet: bulletOptions[index]
        }
      }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-green-800 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Review Generated Bullet Points
          </h3>
          <p className="text-sm text-green-700">
            Here are AI-generated bullet point options that demonstrate the <strong>{selectedSkill?.name}</strong> skill.
            Choose one or edit it before adding to your resume.
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-5 space-y-4">
          {/* Display multiple bullet options if available */}
          {bulletOptions.length > 1 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-3">Choose a bullet point option:</h4>
              <div className="space-y-3">
                {bulletOptions.map((option, index) => (
                  <div
                    key={index}
                    className={`
                      p-3 rounded-lg border cursor-pointer transition-colors
                      ${selectedVariation === index
                        ? 'border-primary-400 bg-primary-50 shadow-sm'
                        : 'border-gray-200 hover:bg-gray-50'
                      }
                    `}
                    onClick={() => handleVariationSelect(index)}
                  >
                    <div className="flex items-start">
                      <div className={`
                        flex-shrink-0 w-6 h-6 rounded-full mr-2 flex items-center justify-center mt-0.5
                        ${selectedVariation === index
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200'
                        }
                      `}>
                        {selectedVariation === index ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <span className="text-xs font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${selectedVariation === index ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                          {option}
                        </p>
                        {selectedVariation === index && (
                          <span className="text-xs text-primary-600 mt-1 block">
                            Selected option
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-medium text-gray-800 mb-3">
              {bulletOptions.length > 1 ? 'Edit Selected Bullet Point:' : 'Generated Bullet Point:'}
            </h4>
            <Textarea
              value={bulletText}
              onChange={(e) => setBulletText(e.target.value)}
              rows={4}
              className="w-full"
              placeholder="Your AI-generated bullet point will appear here."
            />
          </div>

          <div className="flex flex-col space-y-3">
            <h4 className="font-medium text-gray-800">Will be added to:</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center">
                <div className="mr-3">
                  <Briefcase className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <h5 className="font-medium text-gray-800">{targetJobForSkill?.position}</h5>
                  <p className="text-sm text-gray-600">{targetJobForSkill?.company} {targetJobForSkill?.time_period ? `• ${targetJobForSkill?.time_period}` : ''}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSaveBullet}
              variant="primary"
              className="w-full"
              disabled={!bulletText}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Bullet & Add to Resume
            </Button>
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            onClick={() => setActiveTab('select')}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Selection
          </Button>
        </div>
      </div>
    );
  };

  // Render the main content based on active tab
  const renderActiveTab = () => {
    switch (activeTab) {
      case'generate':
        return renderBulletGeneration();
      case'review':
        return renderBulletReview();
      case'select':
      default:
        return renderSkillSelection();
    }
  };

  // Render the preview of added skill bullets
  const renderSavedBullets = () => {
    if (Object.keys(newSkillBullets).length === 0) return null;

    // Group the bullets by job
    const bulletsByJob = {};

    Object.entries(newSkillBullets).forEach(([skillId, bulletInfo]) => {
      if (bulletInfo.jobIndex !== undefined) {
        const jobIndex = bulletInfo.jobIndex;
        if (!bulletsByJob[jobIndex]) {
          bulletsByJob[jobIndex] = [];
        }
        bulletsByJob[jobIndex].push({
          skillId,
          ...bulletInfo
        });
      }
    });

    return (
      <div className="mt-6 border-t border-gray-200 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800">
            Added Skill Bullets ({Object.keys(newSkillBullets).length})
          </h3>
          <Button
            onClick={() => setPreviewMode(!previewMode)}
            variant="outline"
            size="sm"
          >
            {previewMode ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>

        {previewMode && (
          <div className="space-y-6 animate-fade-in">
            {Object.entries(bulletsByJob).map(([jobIndex, bullets]) => {
              const job = resumeData.bullet_points[jobIndex];
              return (
                <div key={jobIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-3 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="mr-3">
                        <Briefcase className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{job.position}</h4>
                        <p className="text-sm text-gray-600">{job.company} {job.time_period ? `• ${job.time_period}` : ''}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3">
                    <ul className="space-y-3">
                      {bullets.map((bullet) => (
                        <li key={bullet.skillId} className="bg-green-50 p-3 rounded-lg border border-green-100">
                          <div className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-gray-800">{bullet.bullet}</p>
                              <p className="text-xs text-green-600 mt-1">Added for skill: {bullet.skill}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Main loading skeleton for the entire component
  if (isAnalyticsLoading && !hasSkillSuggestions) {
    return (
      <Card className="w-full shadow-md transition-colors duration-200">
        <CardHeader>
          <CardTitle className="text-xl">Add Missing Skills</CardTitle>
          <CardDescription>
            Strengthen your resume by adding bullet points for important missing skills
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress indicator skeleton */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-primary-600 rounded-full w-1/4" />
            </div>
          </div>

          {/* Tab content skeleton */}
          <div className="space-y-6">
            {/* Category selection skeletons */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-800">Select a Skill Category:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((index) => (
                  <div key={index} className="p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill selection skeletons */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-800">Select a Specific Skill:</h3>
              <div className="grid grid-cols-1 gap-3 border p-4 rounded-lg border-gray-200 bg-gray-50">
                {[1, 2, 3, 4].map((index) => (
                  <div key={index} className="p-3 rounded-lg border border-gray-200 bg-white">
                    <div className="flex flex-col">
                      <Skeleton className="h-5 w-40 mb-2" />
                      <SkeletonText lines={2} className="w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t border-gray-200 pt-4">
          <Skeleton className="h-10 w-36 rounded" />
          <Skeleton className="h-10 w-36 rounded" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-md transition-colors duration-200">
      <CardHeader>
        <CardTitle className="text-xl">Add missing skills</CardTitle>
        <CardDescription>
          Optional. Only add a skill you actually used. Skip anything that would invent experience.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress indicator */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Optional additions</h3>
            <span className="text-sm text-gray-600">
              {countAddressedSkills()} skill {countAddressedSkills() === 1 ? 'bullet' : 'bullets'} added — skip anything you did not do
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-primary-600 rounded-full"
              style={{ width: `${Math.min(100, countAddressedSkills() ? 12 + countAddressedSkills() * 8 : 0)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Skip is the default. There is nothing to complete.</p>
        </div>

        {/* Main content */}
        {renderActiveTab()}

        {/* Preview of saved bullets */}
        {renderSavedBullets()}
      </CardContent>

      <CardFooter className="flex justify-between border-t border-gray-200 pt-4 mt-4">
        {!embedded && (
          <Button
            onClick={onBack}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        {embedded && <span />}
        <Button
          onClick={onNext}
          variant="primary"
        >
          Done adding skills
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AddMissingSkills;