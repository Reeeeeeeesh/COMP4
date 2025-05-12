import { useState } from 'react';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import type { CompResult } from '../api/client';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface Props {
  result: CompResult;
}

export const ResultCard = ({ result }: Props) => {
  const [activeTab, setActiveTab] = useState<'pie' | 'bar'>('pie');

  // Helper function to safely get numeric values
  const getNumericValue = (value: number | undefined): number => {
    return typeof value === 'number' && !isNaN(value) ? value : 0;
  };

  const formatCurrency = (value: number): string => {
    const absValue = Math.abs(value);
    return value < 0 ? `-$${absValue.toLocaleString()}` : `$${value.toLocaleString()}`;
  };

  const pieData = [
    { name: 'Base', value: getNumericValue(result.base) },
    { name: 'Bonus', value: getNumericValue(result.bonus) },
    { name: 'Revenue Adj', value: getNumericValue(result.revenue_adjustment) },
    { name: 'Qual Adj', value: getNumericValue(result.qualitative_adjustment) },
  ];

  const barData = [
    { name: 'Total', value: getNumericValue(result.total_comp) },
    { name: 'Base', value: getNumericValue(result.base) },
    { name: 'Bonus', value: getNumericValue(result.bonus) },
    { name: 'Rev Adj', value: getNumericValue(result.revenue_adjustment) },
    { name: 'Qual Adj', value: getNumericValue(result.qualitative_adjustment) },
  ];

  return (
    <div className="rounded-lg border p-6 shadow-sm">
      <div className="mb-4 flex justify-between">
        <h2 className="text-2xl font-bold">Compensation Breakdown</h2>
        <div className="flex gap-2">
          <button
            className={`rounded px-3 py-1 ${
              activeTab === 'pie' ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
            onClick={() => setActiveTab('pie')}
          >
            Pie
          </button>
          <button
            className={`rounded px-3 py-1 ${
              activeTab === 'bar' ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
            onClick={() => setActiveTab('bar')}
          >
            Bar
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Compensation</p>
            <p className="text-2xl font-bold">
              {formatCurrency(getNumericValue(result.total_comp))}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Base Salary</p>
            <p className="text-xl">{formatCurrency(getNumericValue(result.base))}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Bonus</p>
            <p className="text-xl">{formatCurrency(getNumericValue(result.bonus))}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Adjustments</p>
            <p className="text-xl">
              {formatCurrency(
                getNumericValue(result.revenue_adjustment) +
                  getNumericValue(result.qualitative_adjustment)
              )}
            </p>
          </div>
        </div>
      </div>

      {result.breaches.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-red-500">Breaches</h3>
          <ul className="list-inside list-disc">
            {result.breaches.map((breach, index) => (
              <li key={index} className="text-red-600">
                {breach}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-center" data-testid="chart-container">
        {activeTab === 'pie' ? (
          <PieChart width={400} height={300}>
            <Pie
              data={pieData}
              cx={200}
              cy={150}
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        ) : (
          <BarChart width={400} height={300} data={barData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value">
              {barData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        )}
      </div>
    </div>
  );
};
