import React, { useState } from 'react';
import { Upload, FileText, Download, Send, ArrowLeft, ArrowRight, AlertTriangle, PenTool, Briefcase } from 'lucide-react';
import Button from './ui/Button';

// Mock functions remain the same
const parseResume = (file) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        "Developed and maintained web applications using React and Node.js",
        "Increased website performance by 40% through optimization techniques",
        "Collaborated with cross-functional teams to deliver projects on time"
      ]);
    }, 1000);
  });
};

const getAISuggestions = (bulletPoint, additionalContext = "") => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        improvedBulletPoint: "Engineered high-performance web applications using React and Node.js, implementing optimization techniques that boosted website speed by 40% and enhanced user experience",
        reasoning: "The improved version uses a stronger action verb (Engineered), quantifies the achievement (40% speed boost), highlights specific technologies (React and Node.js), and emphasizes the impact (enhanced user experience). It's also kept concise within two lines.",
        followUpQuestions: [
          "Can you provide more details about the specific optimization techniques used?",
          "Were there any particular challenges you faced during this project?",
          "How many users were impacted by this performance improvement?"
        ]
      });
    }, 1000);
  });
};

const ConfirmationModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <div className="flex items-center mb-4">
          <AlertTriangle className="text-yellow-500 w-6 h-6 mr-2" />
          <h3 className="text-lg font-bold">Confirm Restart</h3>
        </div>
        <p className="mb-4">Are you sure you want to go back? This will restart the process and all changes will be lost.</p>
        <div className="flex justify-end space-x-2">
          <Button onClick={onCancel} className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

const ResumeImprovement = () => {
  const [step, setStep] = useState(0);
  const [bulletPoints, setBulletPoints] = useState([]);
  const [currentBulletIndex, setCurrentBulletIndex] = useState(0);
  const [improvements, setImprovements] = useState({});
  const [additionalContexts, setAdditionalContexts] = useState({});
  const [showFollowUpForBullets, setShowFollowUpForBullets] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const resetState = () => {
    setStep(0);
    setBulletPoints([]);
    setCurrentBulletIndex(0);
    setImprovements({});
    setAdditionalContexts({});
    setShowFollowUpForBullets({});
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const parsedBulletPoints = await parseResume(file);
      setBulletPoints(parsedBulletPoints);
      setStep(1); // Go to feature selection page
    }
  };

  const handleBulletPointImprovement = async () => {
    const currentBullet = bulletPoints[currentBulletIndex];
    const suggestions = await getAISuggestions(currentBullet, Object.values(additionalContexts[currentBulletIndex] || {}).join(' '));
    setImprovements(prev => ({
      ...prev,
      [currentBulletIndex]: suggestions
    }));
    setShowFollowUpForBullets(prev => ({
      ...prev,
      [currentBulletIndex]: true
    }));
  };

  const handleAdditionalContextChange = (questionIndex, value) => {
    setAdditionalContexts(prev => ({
      ...prev,
      [currentBulletIndex]: {
        ...(prev[currentBulletIndex] || {}),
        [questionIndex]: value
      }
    }));
  };

  const handleAdditionalContextSubmit = async () => {
    const currentBullet = bulletPoints[currentBulletIndex];
    const newSuggestions = await getAISuggestions(currentBullet, Object.values(additionalContexts[currentBulletIndex] || {}).join(' '));
    setImprovements(prev => ({
      ...prev,
      [currentBulletIndex]: newSuggestions
    }));
  };

  const handleNavigation = (direction) => {
    if (direction === 'back') {
      if (step === 1) {
        setShowConfirmModal(true);
      } else if (step === 2 && currentBulletIndex > 0) {
        setCurrentBulletIndex(currentBulletIndex - 1);
      } else if (step === 3) {
        setStep(2);
        setCurrentBulletIndex(bulletPoints.length - 1);
      } else if (step > 1) {
        setStep(step - 1);
      }
    } else if (direction === 'forward') {
      if (step === 2 && currentBulletIndex < bulletPoints.length - 1) {
        setCurrentBulletIndex(currentBulletIndex + 1);
      } else if (step < 3) {
        setStep(step + 1);
      }
    }
  };

  const handleConfirmReset = () => {
    resetState();
    setShowConfirmModal(false);
  };

  const renderProgressBar = () => {
    const progress = ((currentBulletIndex + 1) / bulletPoints.length) * 100;
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div 
          className="bg-blue-600 h-2.5 rounded-full" 
          style={{width: `${progress}%`}}
        ></div>
      </div>
    );
  };

  const renderFeatureSelection = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-6">Choose a Feature</h2>
        <div className="space-y-4">
          <Button 
            onClick={() => setStep(2)} 
            className="w-full bg-blue-500 text-white px-4 py-3 rounded flex items-center justify-between hover:bg-blue-600"
          >
            <span>Resume Improvement Assistant</span>
            <FileText className="w-5 h-5" />
          </Button>
          <Button 
            className="w-full bg-gray-200 text-gray-800 px-4 py-3 rounded flex items-center justify-between hover:bg-gray-300"
          >
            <span>Cover Letter Generator (Coming Soon)</span>
            <PenTool className="w-5 h-5" />
          </Button>
          <Button 
            className="w-full bg-gray-200 text-gray-800 px-4 py-3 rounded flex items-center justify-between hover:bg-gray-300"
          >
            <span>Find Matching Jobs (Coming Soon)</span>
            <Briefcase className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Upload Your Resume</h2>
            <label className="flex flex-col items-center p-4 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
              <Upload className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Choose a file</span>
              <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx" />
            </label>
          </div>
        );
      case 1:
        return renderFeatureSelection();
      case 2:
        return (
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Improve Your Bullet Points</h2>
            {renderProgressBar()}
            <p className="mb-4">Bullet Point {currentBulletIndex + 1} of {bulletPoints.length}</p>
            <div className="mb-4">
              <h3 className="font-bold">Original:</h3>
              <p>{bulletPoints[currentBulletIndex]}</p>
            </div>
            <Button onClick={handleBulletPointImprovement} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
              Get AI Suggestions
            </Button>
            <div className="mb-4">
              <h3 className="font-bold">Improved Version:</h3>
              <p>{improvements[currentBulletIndex]?.improvedBulletPoint || "AI suggestions will appear here after you click 'Get AI Suggestions'."}</p>
            </div>
            <div className="mb-4">
              <h3 className="font-bold">Reasoning:</h3>
              <p>{improvements[currentBulletIndex]?.reasoning || "The AI's reasoning for the improvements will be shown here."}</p>
            </div>
            <div className="mb-4">
              <h3 className="font-bold">Follow-up Questions:</h3>
              {showFollowUpForBullets[currentBulletIndex] && improvements[currentBulletIndex]?.followUpQuestions ? (
                improvements[currentBulletIndex].followUpQuestions.map((question, index) => (
                  <div key={index} className="mt-2">
                    <p>{question}</p>
                    <textarea
                      className="w-full p-2 border rounded mt-1"
                      placeholder="Provide additional context..."
                      value={additionalContexts[currentBulletIndex]?.[index] || ""}
                      onChange={(e) => handleAdditionalContextChange(index, e.target.value)}
                    />
                  </div>
                ))
              ) : (
                <p>Follow-up questions will appear here after AI suggestions are generated.</p>
              )}
              {showFollowUpForBullets[currentBulletIndex] && (
                <Button onClick={handleAdditionalContextSubmit} className="bg-green-500 text-white px-4 py-2 rounded mt-4">
                  <Send className="w-4 h-4 mr-2 inline" />
                  Submit Additional Context
                </Button>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Final Review</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 text-left">Original Bullet Point</th>
                  <th className="border p-2 text-left">Improved Bullet Point</th>
                </tr>
              </thead>
              <tbody>
                {bulletPoints.map((bullet, index) => (
                  <tr key={index}>
                    <td className="border p-2">{bullet}</td>
                    <td className="border p-2">
                      {improvements[index]?.improvedBulletPoint || "Not improved yet"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button className="bg-green-500 text-white px-4 py-2 rounded mt-6">
              <Download className="w-4 h-4 mr-2 inline" />
              Download Improved Resume
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const renderNavigationButtons = () => {
    if (step === 0) return null;

    const canGoBack = step > 0;
    const canGoForward = step < 3 || (step === 2 && currentBulletIndex < bulletPoints.length - 1);

    return (
      <div className="flex justify-between mt-6 w-full max-w-2xl">
        <Button 
          onClick={() => handleNavigation('back')} 
          className={`px-4 py-2 rounded flex items-center ${canGoBack ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          disabled={!canGoBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {step !== 1 && (
          <Button 
            onClick={() => handleNavigation('forward')} 
            className={`px-4 py-2 rounded flex items-center ${canGoForward ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            disabled={!canGoForward}
          >
            {step === 2 && currentBulletIndex === bulletPoints.length - 1 ? 'Finish' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <div className="w-full max-w-2xl flex flex-col items-center justify-center flex-grow py-8">
        <h1 className="text-3xl font-bold mb-8">Resume Improvement Assistant</h1>
        {renderStep()}
        {renderNavigationButtons()}
      </div>
      <ConfirmationModal 
        isOpen={showConfirmModal}
        onConfirm={handleConfirmReset}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
};

export default ResumeImprovement;