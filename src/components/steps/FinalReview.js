import React from 'react';
import { Download, CheckCircle, ArrowLeft } from 'lucide-react';
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
  Button
} from '../ui';
import { useResumeContext } from '../../contexts/ResumeContext';

/**
 * Final Review component
 * Displays all improved bullet points for final review before export
 */
const FinalReview = ({ onBack }) => {
  const {
    resumeData,
    improvements,
    originalBullets,
    getBulletId,
    handleExportResume,
    loading
  } = useResumeContext();
  
  return (
    <Card className="w-full shadow-md transition-colors duration-200">
      <CardHeader>
        <CardTitle className="text-xl mb-2">Final Review</CardTitle>
        <CardDescription>
          Review all your improved bullet points before downloading your enhanced resume.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {resumeData.bullet_points.map((job, jobIndex) => (
          <div key={jobIndex} className="space-y-4">
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 shadow-sm">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{job.company}</h3>
              <div className="text-gray-700 dark:text-gray-300 mb-1">{job.position}</div>
              {job.time_period && (
                <div className="text-sm text-gray-600 dark:text-gray-400">{job.time_period}</div>
              )}
            </div>
            
            <Table className="w-full table-fixed border border-gray-200 dark:border-gray-700">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Original Bullet Point</TableHead>
                  <TableHead className="w-1/2">Improved Bullet Point</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {job.achievements?.map((bullet, bulletIndex) => {
                  const bulletId = getBulletId(jobIndex, bulletIndex);
                  const improved = improvements[bulletId]?.improvedBulletPoint;
                  // Use the original bullet from our store
                  const originalBullet = originalBullets[bulletId] || bullet;
                  
                  return (
                    <TableRow key={bulletIndex}>
                      <TableCell className="align-top">{originalBullet}</TableCell>
                      <TableCell className={improved ? "align-top bg-green-50 dark:bg-green-900/20" : "align-top bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}>
                        {improved || bullet || "Not improved"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ))}
        
        <div className="flex justify-center pt-6">
          <Button 
            onClick={handleExportResume} 
            variant="primary"
            size="lg"
            loading={loading.export}
            className="mt-4"
          >
            <Download className="w-5 h-5 mr-2" />
            {loading.export ? 'Generating...' : 'Download Improved Resume'}
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <Button 
          onClick={onBack}
          variant="outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Missing Skills
        </Button>
        
        <div className="invisible">
          {/* This empty div helps with spacing */}
          <Button variant="outline">Placeholder</Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default FinalReview;