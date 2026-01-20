import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load recharts (réduction bundle ~150KB)
const loadRecharts = () => import('recharts');

interface RechartsWrapperProps {
  children: (components: {
    BarChart: any;
    Bar: any;
    XAxis: any;
    YAxis: any;
    Tooltip: any;
    ResponsiveContainer: any;
    CartesianGrid: any;
  }) => React.ReactNode;
}

export const RechartsWrapper: React.FC<RechartsWrapperProps> = ({ children }) => {
  const [recharts, setRecharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecharts().then((module) => {
      setRecharts({
        BarChart: module.BarChart,
        Bar: module.Bar,
        XAxis: module.XAxis,
        YAxis: module.YAxis,
        Tooltip: module.Tooltip,
        ResponsiveContainer: module.ResponsiveContainer,
        CartesianGrid: module.CartesianGrid,
      });
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="h-[200px] flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-400" size={24} />
      </div>
    );
  }

  return <>{children(recharts)}</>;
};
