import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, PenTool, Briefcase, Sparkles, Zap } from 'lucide-react';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardContent, 
  CardTitle, 
  CardDescription, 
  CardFooter,
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell,
  Textarea 
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
  generateSkillBullet,
  generatingSkillBullet,
  saveNewSkillBullet,
  onNext,
  onBack
}) => {
  const [bulletText, setBulletText] = useState('');
  const [activeTab, setActiveTab] = useState('select'); // 'select', 'generate', 'review'
  const [previewMode, setPreviewMode] = useState(false);
  
  // Reset selected skill when category changes
  useEffect(() => {
    setSelectedSkill(null);
  }, [selectedSkillCategory, setSelectedSkill]);
  
  // Reset bullet text when skill or job changes
  useEffect(() => {
    setBulletText('');
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
    if (!aiRecommendations?.missingConcepts || aiRecommendations.missingConcepts.length === 0) {
      return (
        <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-300 mb-2">No Missing Skills Found</h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            No missing skills were identified in your resume. You're good to go!
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {/* Skill Category Selection */}
        <div>
          <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">1. Select a Skill Category:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiRecommendations.missingConcepts.map((category, index) => (
              <button
                key={index}
                onClick={() => setSelectedSkillCategory(category)}
                className={`p-4 rounded-lg border text-left transition ${
                  selectedSkillCategory === category
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 dark:border-primary-500 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">{category.category}</h4>
                  <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 min-w-[60px] text-center">
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
            <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">2. Select a Specific Skill:</h3>
            <div className="grid grid-cols-1 gap-3 border p-4 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              {selectedSkillCategory.skills.map((skill, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedSkill(skill)}
                  className={`p-3 rounded-lg border text-left transition ${
                    selectedSkill === skill
                      ? 'border-primary-500 bg-white dark:bg-gray-700 dark:border-primary-500 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">{skill.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{skill.recommendation}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Job Selection */}
        {selectedSkill && (
          <div className="animate-fade-in">
            <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">3. Select a Job Position:</h3>
            <div className="space-y-3 border p-4 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Select the job position where you want to add the "{selectedSkill.name}" skill:
              </p>
              
              {resumeData.bullet_points.map((job, index) => (
                <button
                  key={index}
                  onClick={() => setTargetJobForSkill(job)}
                  className={`p-3 rounded-lg border w-full text-left transition ${
                    targetJobForSkill === job
                      ? 'border-primary-500 bg-white dark:bg-gray-700 dark:border-primary-500 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="mr-3">
                      <Briefcase className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">{job.position}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{job.company} {job.time_period ? `• ${job.time_period}` : ''}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Continue Button */}
        {selectedSkill && targetJobForSkill && (
          <div className="flex justify-end animate-fade-in">
            <Button 
              onClick={() => {
                const skillId = getSkillId(selectedSkill, targetJobForSkill);
                if (newSkillBullets[skillId]?.bullet) {
                  // If already generated, go straight to review
                  setActiveTab('review');
                } else {
                  setActiveTab('generate');
                }
              }}
              variant="primary"
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
        )}
      </div>
    );
  };
  
  // Render the generation tab
  const renderBulletGeneration = () => {
    return (
      <div className="space-y-6">
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-primary-800 dark:text-primary-300 flex items-center">
            <PenTool className="w-5 h-5 mr-2" />
            Bullet Point Generation
          </h3>
          <p className="text-sm text-primary-700 dark:text-primary-400">
            Generate a bullet point that demonstrates the <strong>{selectedSkill?.name}</strong> skill
            for your <strong>{targetJobForSkill?.position}</strong> position at <strong>{targetJobForSkill?.company}</strong>.
          </p>
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-4">
          <div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Skill Details:</h4>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <h5 className="font-medium text-gray-800 dark:text-gray-200">{selectedSkill?.name}</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedSkill?.recommendation}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Position Details:</h4>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex items-center">
                <div className="mr-3">
                  <Briefcase className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <h5 className="font-medium text-gray-800 dark:text-gray-200">{targetJobForSkill?.position}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{targetJobForSkill?.company} {targetJobForSkill?.time_period ? `• ${targetJobForSkill?.time_period}` : ''}</p>
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
    const bulletOptions = skillId && newSkillBullets[skillId]?.multipleBullets || [];
    const selectedVariation = skillId && newSkillBullets[skillId]?.selectedVariation || 0;
    
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
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-green-800 dark:text-green-300 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Review Generated Bullet Points
          </h3>
          <p className="text-sm text-green-700 dark:text-green-400">
            Here are AI-generated bullet point options that demonstrate the <strong>{selectedSkill?.name}</strong> skill. 
            Choose one or edit it before adding to your resume.
          </p>
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-4">
          {/* Display multiple bullet options if available */}
          {bulletOptions.length > 1 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Choose a bullet point option:</h4>
              <div className="space-y-3">
                {bulletOptions.map((option, index) => (
                  <div 
                    key={index}
                    className={`
                      p-3 rounded-lg border cursor-pointer transition-colors
                      ${selectedVariation === index
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/30 dark:border-primary-600 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }
                    `}
                    onClick={() => handleVariationSelect(index)}
                  >
                    <div className="flex items-start">
                      <div className={`
                        flex-shrink-0 w-6 h-6 rounded-full mr-2 flex items-center justify-center mt-0.5
                        ${selectedVariation === index
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700'
                        }
                      `}>
                        {selectedVariation === index ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <span className="text-xs font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${selectedVariation === index ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                          {option}
                        </p>
                        {selectedVariation === index && (
                          <span className="text-xs text-primary-600 dark:text-primary-400 mt-1 block">
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
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
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
            <h4 className="font-medium text-gray-800 dark:text-gray-200">Will be added to:</h4>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex items-center">
                <div className="mr-3">
                  <Briefcase className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <h5 className="font-medium text-gray-800 dark:text-gray-200">{targetJobForSkill?.position}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{targetJobForSkill?.company} {targetJobForSkill?.time_period ? `• ${targetJobForSkill?.time_period}` : ''}</p>
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
      case 'generate':
        return renderBulletGeneration();
      case 'review':
        return renderBulletReview();
      case 'select':
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
      <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
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
                <div key={jobIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <div className="mr-3">
                        <Briefcase className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">{job.position}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{job.company} {job.time_period ? `• ${job.time_period}` : ''}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <ul className="space-y-3">
                      {bullets.map((bullet) => (
                        <li key={bullet.skillId} className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800">
                          <div className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-gray-800 dark:text-gray-200">{bullet.bullet}</p>
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">Added for skill: {bullet.skill}</p>
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
  
  return (
    <Card className="w-full shadow-md transition-colors duration-200">
      <CardHeader>
        <CardTitle className="text-xl">Add Missing Skills</CardTitle>
        <CardDescription>
          Strengthen your resume by adding bullet points for important missing skills
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress indicator */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Your Progress:</h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {countAddressedSkills()} of {getTotalMissingSkills()} missing skills addressed
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
            <div 
              className="h-2 bg-primary-600 dark:bg-primary-500 rounded-full" 
              style={{ width: `${(countAddressedSkills() / getTotalMissingSkills()) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Main content */}
        {renderActiveTab()}
        
        {/* Preview of saved bullets */}
        {renderSavedBullets()}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <Button 
          onClick={onBack}
          variant="outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Improvement Review
        </Button>
        
        <Button 
          onClick={onNext}
          variant="primary"
        >
          Continue to Final Overview
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AddMissingSkills;