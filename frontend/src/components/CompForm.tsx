import { useState } from 'react';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { useCalculate } from '../hooks/useCalculate';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { CompRequest, CompResult } from '../api/client';

// Schema definition for the form data
const schema = z.object({
  employee_id: z.number().int().positive(),
  revenue_actual: z.number().positive(),
  qualitative_scores: z.preprocess(
    (val) => (typeof val === 'object' ? val : {}),
    z.record(z.string(), z.number().min(0).max(100))
  ),
});

interface Props {
  onResult: (result: CompResult) => void;
}

export const CompForm = ({ onResult }: Props) => {
  const [employeeId, setEmployeeId] = useState('');
  const [revenue, setRevenue] = useState('');
  const [scores, setScores] = useState<Array<{ metric: string; score: number }>>([
    { metric: 'risk', score: 50 },
    { metric: 'compliance', score: 50 },
  ]);

  const { mutate, isPending: isLoading } = useCalculate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create and validate data with safer conversions
    const data: CompRequest = {
      employee_id: parseInt(employeeId, 10),
      revenue_actual: parseFloat(revenue),
      qualitative_scores: Object.fromEntries(
        scores.map(({ metric, score }) => {
          const numericScore = Number(score);
          // Validate score is actually a number (not NaN)
          if (isNaN(numericScore)) {
            return [metric, 0]; // Default to 0 for invalid scores
          }
          return [metric, numericScore];
        })
      ),
    };

    try {
      schema.parse(data);
      mutate(data, {
        onSuccess: (result: CompResult) => onResult(result),
        onError: (error: Error) => {
          // Handle errors from the mutation (API calls, etc.)
          console.log('[CompForm] Caught error during submit:', error);
          console.log('[CompForm] Is ZodError:', error instanceof z.ZodError);
        },
      });
    } catch (error) {
      // This will primarily catch Zod validation errors and any other synchronous errors
      console.log('[CompForm] Caught error during submit:', error);
      console.log('[CompForm] Is ZodError:', error instanceof z.ZodError);
      if (error instanceof z.ZodError) {
        // Handle validation errors
        console.error('[CompForm] Zod validation errors:', error.errors);
      }
    }
  };

  const addScore = () => {
    setScores([...scores, { metric: '', score: 50 }]);
  };

  const removeScore = (index: number) => {
    setScores(scores.filter((_, i) => i !== index));
  };

  const updateScore = (
    index: number,
    field: 'metric' | 'score',
    value: string | number
  ) => {
    const newScores = [...scores];
    newScores[index] = {
      ...newScores[index],
      [field]: field === 'score' ? Number(value) : value,
    };
    setScores(newScores);
  };

  return (
    <Card className="w-full animate-fade-in-up shadow-lg bg-zinc-900 border-zinc-800">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold text-white">Calculate Compensation</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8" data-testid="comp-form">
          <div className="space-y-3">
            <Label htmlFor="employee-id" className="text-lg text-center block text-white">Employee ID</Label>
            <Input
              id="employee-id"
              type="number"
              placeholder="Enter employee ID"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmployeeId(e.target.value)}
              required
              className="text-lg text-center bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="revenue" className="text-lg text-center block text-white">Revenue</Label>
            <Input
              id="revenue"
              type="number"
              step="0.01"
              value={revenue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRevenue(e.target.value)}
              required
              className="text-lg text-center bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <Label className="text-xl font-medium text-white">Qualitative Scores</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addScore}
                className="gap-2 bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
              >
                <PlusCircle className="h-4 w-4" />
                Add Score
              </Button>
            </div>

            <motion.div className="space-y-6" layout>
              {scores.map((score, index) => (
                <motion.div
                  key={index}
                  className="grid grid-cols-[1fr_auto] gap-6 items-center bg-zinc-800/50 rounded-lg p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex gap-4">
                    <Input
                      type="text"
                      value={score.metric}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateScore(index, 'metric', e.target.value)}
                      placeholder="Metric"
                      required
                    />
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        value={score.score}
                        onChange={(e) => updateScore(index, 'score', e.target.value)}
                        min="0"
                        max="100"
                        className="w-32 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                        aria-label={`${score.metric} score`}
                      />
                      <span className="w-12 text-center tabular-nums text-lg text-white">{score.score}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeScore(index)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <Button
            type="submit"
            className="w-full text-lg bg-white text-black hover:bg-white/90"
            disabled={isLoading}
          >
            {isLoading ? 'Calculating...' : 'Calculate Compensation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
