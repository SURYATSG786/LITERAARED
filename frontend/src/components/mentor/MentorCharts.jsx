import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js controllers and plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Global Chart defaults
ChartJS.defaults.font.family = '"Nunito", "Space Grotesk", sans-serif';
ChartJS.defaults.font.weight = 'bold';
ChartJS.defaults.color = '#032038';

function safeDestroy(canvasRef, instanceRef) {
  if (instanceRef && instanceRef.current) {
    try {
      instanceRef.current.destroy();
    } catch {}
    instanceRef.current = null;
  }
  if (canvasRef && canvasRef.current) {
    try {
      const existing = ChartJS.getChart(canvasRef.current);
      if (existing) {
        existing.destroy();
      }
    } catch {}
  }
}

/**
 * 1. Activity Trend Spline Area Chart
 */
export function ActivityTrendLineChart({
  labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  engagementData = [12, 19, 15, 22, 28, 24, 32],
  lessonsData = [8, 14, 11, 18, 23, 20, 29],
  title = 'Learner Engagement & Lesson Activity (Last 7 Days)',
}) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    safeDestroy(chartRef, chartInstance);

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const gradEngagement = ctx.createLinearGradient(0, 0, 0, 260);
    gradEngagement.addColorStop(0, 'rgba(11, 111, 184, 0.45)');
    gradEngagement.addColorStop(1, 'rgba(11, 111, 184, 0.02)');

    const gradLessons = ctx.createLinearGradient(0, 0, 0, 260);
    gradLessons.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
    gradLessons.addColorStop(1, 'rgba(16, 185, 129, 0.02)');

    try {
      chartInstance.current = new ChartJS(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Active Learners',
              data: engagementData,
              borderColor: '#0b6fb8',
              backgroundColor: gradEngagement,
              borderWidth: 3,
              pointBackgroundColor: '#0b6fb8',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 7,
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Lessons Practiced',
              data: lessonsData,
              borderColor: '#10b981',
              backgroundColor: gradLessons,
              borderWidth: 2.5,
              pointBackgroundColor: '#10b981',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 3.5,
              pointHoverRadius: 6,
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1000,
            easing: 'easeOutQuart',
          },
          plugins: {
            legend: {
              position: 'top',
              align: 'end',
              labels: {
                boxWidth: 12,
                boxHeight: 12,
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 16,
                font: { size: 11, weight: '800' },
              },
            },
            tooltip: {
              backgroundColor: 'rgba(3, 32, 56, 0.88)',
              titleFont: { size: 12, weight: 'bold' },
              bodyFont: { size: 12 },
              padding: 10,
              cornerRadius: 12,
              displayColors: true,
            },
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(3, 32, 56, 0.06)',
              },
              ticks: {
                font: { size: 11, weight: '700' },
              },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(3, 32, 56, 0.08)',
              },
              ticks: {
                font: { size: 11, weight: '700' },
                precision: 0,
              },
            },
          },
        },
      });
    } catch (err) {
      console.warn('ActivityTrendLineChart init error:', err);
    }

    return () => {
      safeDestroy(chartRef, chartInstance);
    };
  }, [labels, engagementData, lessonsData]);

  return (
    <div className="relative w-full h-64 sm:h-72">
      <canvas ref={chartRef} />
    </div>
  );
}

/**
 * 2. League Tier Distribution Donut Chart
 */
export function LeagueDonutChart({ counts = { bronze: 0, silver: 0, gold: 0 } }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const bronze = counts?.bronze || 0;
  const silver = counts?.silver || 0;
  const gold = counts?.gold || 0;
  const total = bronze + silver + gold;

  useEffect(() => {
    if (!chartRef.current) return;

    safeDestroy(chartRef, chartInstance);

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    try {
      chartInstance.current = new ChartJS(ctx, {
        type: 'doughnut',
        data: {
          labels: ['🥉 Bronze League', '🥈 Silver League', '🥇 Gold League'],
          datasets: [
            {
              data: total === 0 ? [1, 0, 0] : [bronze, silver, gold],
              backgroundColor: [
                'rgba(180, 83, 9, 0.85)',
                'rgba(148, 163, 184, 0.9)',
                'rgba(234, 179, 8, 0.95)',
              ],
              borderColor: ['#ffffff', '#ffffff', '#ffffff'],
              borderWidth: 2.5,
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          animation: {
            duration: 900,
            easing: 'easeOutQuart',
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 10,
                boxHeight: 10,
                padding: 14,
                font: { size: 11, weight: '800' },
              },
            },
            tooltip: {
              backgroundColor: 'rgba(3, 32, 56, 0.9)',
              padding: 10,
              cornerRadius: 12,
              callbacks: {
                label: (context) => {
                  const val = context.parsed;
                  const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                  return ` ${context.label}: ${val} learners (${pct}%)`;
                },
              },
            },
          },
        },
      });
    } catch (err) {
      console.warn('LeagueDonutChart init error:', err);
    }

    return () => {
      safeDestroy(chartRef, chartInstance);
    };
  }, [bronze, silver, gold, total]);

  return (
    <div className="relative w-full h-56 sm:h-64 flex items-center justify-center">
      <canvas ref={chartRef} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-7">
        <span className="text-2xl sm:text-3xl font-black text-[#032038]">{total}</span>
        <span className="text-[10px] font-black uppercase tracking-wider text-[#032038]/60">Total Learners</span>
      </div>
    </div>
  );
}

/**
 * 3. Education Demographics & Performance Bar Chart
 */
export function EducationDemographicsChart({ educationLevels = [] }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    safeDestroy(chartRef, chartInstance);

    const labels = (educationLevels || []).map((e) => (e.educationLevel || '').replace(' Education', ''));
    const learnerCounts = (educationLevels || []).map((e) => e.totalCount || 0);
    const avgScores = (educationLevels || []).map((e) => e.avgScore || 0);

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    try {
      chartInstance.current = new ChartJS(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Total Learners',
              data: learnerCounts,
              backgroundColor: 'rgba(11, 111, 184, 0.75)',
              borderColor: '#0b6fb8',
              borderWidth: 1.5,
              borderRadius: 8,
              yAxisID: 'yLearners',
            },
            {
              label: 'Avg Assessment Score (%)',
              data: avgScores,
              backgroundColor: 'rgba(147, 51, 234, 0.75)',
              borderColor: '#9333ea',
              borderWidth: 1.5,
              borderRadius: 8,
              yAxisID: 'yScore',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 900,
            easing: 'easeOutQuart',
          },
          plugins: {
            legend: {
              position: 'top',
              align: 'end',
              labels: {
                boxWidth: 12,
                boxHeight: 12,
                padding: 14,
                font: { size: 11, weight: '800' },
              },
            },
            tooltip: {
              backgroundColor: 'rgba(3, 32, 56, 0.9)',
              padding: 10,
              cornerRadius: 12,
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(3, 32, 56, 0.05)' },
              ticks: { font: { size: 11, weight: '700' } },
            },
            yLearners: {
              type: 'linear',
              position: 'left',
              beginAtZero: true,
              grid: { color: 'rgba(3, 32, 56, 0.08)' },
              title: {
                display: true,
                text: 'Learner Count',
                font: { size: 10, weight: '800' },
              },
            },
            yScore: {
              type: 'linear',
              position: 'right',
              beginAtZero: true,
              max: 100,
              grid: { drawOnChartArea: false },
              title: {
                display: true,
                text: 'Score %',
                font: { size: 10, weight: '800' },
              },
            },
          },
        },
      });
    } catch (err) {
      console.warn('EducationDemographicsChart init error:', err);
    }

    return () => {
      safeDestroy(chartRef, chartInstance);
    };
  }, [educationLevels]);

  return (
    <div className="relative w-full h-64 sm:h-72">
      <canvas ref={chartRef} />
    </div>
  );
}

/**
 * 4. Score Distribution Range Histogram Bar Chart
 */
export function ScoreDistributionChart({ scoreRanges = {} }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    safeDestroy(chartRef, chartInstance);

    const labels = Object.keys(scoreRanges || {});
    const data = Object.values(scoreRanges || {});

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    try {
      chartInstance.current = new ChartJS(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Learners in Range',
              data,
              backgroundColor: [
                'rgba(239, 68, 68, 0.8)',   // 0-25% Red
                'rgba(245, 158, 11, 0.8)',  // 26-50% Amber
                'rgba(59, 130, 246, 0.8)',  // 51-75% Blue
                'rgba(16, 185, 129, 0.85)', // 76-100% Emerald
              ],
              borderColor: [
                '#ef4444',
                '#f59e0b',
                '#3b82f6',
                '#10b981',
              ],
              borderWidth: 1.5,
              borderRadius: 10,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 900,
            easing: 'easeOutQuart',
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(3, 32, 56, 0.9)',
              padding: 10,
              cornerRadius: 12,
              callbacks: {
                label: (ctx) => ` ${ctx.parsed.y} learners scored in ${ctx.label}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11, weight: '800' } },
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(3, 32, 56, 0.08)' },
              ticks: { precision: 0, font: { size: 11, weight: '700' } },
            },
          },
        },
      });
    } catch (err) {
      console.warn('ScoreDistributionChart init error:', err);
    }

    return () => {
      safeDestroy(chartRef, chartInstance);
    };
  }, [scoreRanges]);

  return (
    <div className="relative w-full h-56 sm:h-64">
      <canvas ref={chartRef} />
    </div>
  );
}

/**
 * 5. Course Enrollment vs Completion Grouped Bar Chart
 */
export function CourseComparisonChart({ courses = [] }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    safeDestroy(chartRef, chartInstance);

    const labels = (courses || []).map((c) => {
      const t = c.title || 'Course';
      return t.length > 20 ? t.slice(0, 18) + '…' : t;
    });
    const enrolled = (courses || []).map((c) => c.enrolledCount || 0);
    const completed = (courses || []).map((c) => c.completedCount || 0);

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    try {
      chartInstance.current = new ChartJS(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Enrolled Learners',
              data: enrolled,
              backgroundColor: 'rgba(11, 111, 184, 0.8)',
              borderColor: '#0b6fb8',
              borderWidth: 1.5,
              borderRadius: 8,
            },
            {
              label: 'Completed Learners',
              data: completed,
              backgroundColor: 'rgba(16, 185, 129, 0.85)',
              borderColor: '#10b981',
              borderWidth: 1.5,
              borderRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 900,
            easing: 'easeOutQuart',
          },
          plugins: {
            legend: {
              position: 'top',
              align: 'end',
              labels: {
                boxWidth: 12,
                boxHeight: 12,
                padding: 12,
                font: { size: 11, weight: '800' },
              },
            },
            tooltip: {
              backgroundColor: 'rgba(3, 32, 56, 0.9)',
              padding: 10,
              cornerRadius: 12,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 10, weight: '700' } },
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(3, 32, 56, 0.08)' },
              ticks: { precision: 0, font: { size: 11, weight: '700' } },
            },
          },
        },
      });
    } catch (err) {
      console.warn('CourseComparisonChart init error:', err);
    }

    return () => {
      safeDestroy(chartRef, chartInstance);
    };
  }, [courses]);

  return (
    <div className="relative w-full h-64 sm:h-72">
      <canvas ref={chartRef} />
    </div>
  );
}

/**
 * 6. User Growth Trend Area Chart (Admin Control Center)
 */
export function UserGrowthLineChart({ timeline = [] }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    safeDestroy(chartRef, chartInstance);

    const labels = (timeline || []).map((t) => t.day || t.date || '');
    const learnersData = (timeline || []).map((t) => t.learners || 0);
    const mentorsData = (timeline || []).map((t) => t.mentors || 0);

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const gradLearners = ctx.createLinearGradient(0, 0, 0, 240);
    gradLearners.addColorStop(0, 'rgba(11, 111, 184, 0.45)');
    gradLearners.addColorStop(1, 'rgba(11, 111, 184, 0.02)');

    const gradMentors = ctx.createLinearGradient(0, 0, 0, 240);
    gradMentors.addColorStop(0, 'rgba(139, 92, 246, 0.45)');
    gradMentors.addColorStop(1, 'rgba(139, 92, 246, 0.02)');

    try {
      chartInstance.current = new ChartJS(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'New Learners',
              data: learnersData,
              borderColor: '#0b6fb8',
              backgroundColor: gradLearners,
              borderWidth: 3,
              pointBackgroundColor: '#0b6fb8',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 7,
              tension: 0.35,
              fill: true,
            },
            {
              label: 'New Mentors',
              data: mentorsData,
              borderColor: '#8b5cf6',
              backgroundColor: gradMentors,
              borderWidth: 2.5,
              pointBackgroundColor: '#8b5cf6',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 3.5,
              pointHoverRadius: 6,
              tension: 0.35,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 900,
            easing: 'easeOutQuart',
          },
          plugins: {
            legend: {
              position: 'top',
              align: 'end',
              labels: {
                boxWidth: 10,
                boxHeight: 10,
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 12,
                font: { size: 11, weight: '800' },
              },
            },
            tooltip: {
              backgroundColor: 'rgba(3, 32, 56, 0.92)',
              titleFont: { size: 12, weight: 'bold' },
              bodyFont: { size: 11 },
              padding: 10,
              cornerRadius: 12,
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(3, 32, 56, 0.05)' },
              ticks: { font: { size: 11, weight: '700' } },
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(3, 32, 56, 0.08)' },
              ticks: { precision: 0, font: { size: 11, weight: '700' } },
            },
          },
        },
      });
    } catch (err) {
      console.warn('UserGrowthLineChart init error:', err);
    }

    return () => {
      safeDestroy(chartRef, chartInstance);
    };
  }, [timeline]);

  return (
    <div className="relative w-full h-56 sm:h-64">
      <canvas ref={chartRef} />
    </div>
  );
}

/**
 * 7. Language Adoption Doughnut Chart (Admin Control Center)
 */
export function LanguageAdoptionPieChart({ languages = [], totalLearners = 0 }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    safeDestroy(chartRef, chartInstance);

    const activeLangs = (languages || []).filter((l) => (l.count || 0) > 0);
    const displayLangs = activeLangs.length > 0 ? activeLangs : languages;

    const labels = displayLangs.map((l) => `${l.name} (${l.percentage || 0}%)`);
    const data = displayLangs.map((l) => l.count || 0);
    const bgColors = displayLangs.map((l) => l.color || '#0b6fb8');

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    try {
      chartInstance.current = new ChartJS(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data: data.every((d) => d === 0) ? [1] : data,
              backgroundColor: data.every((d) => d === 0) ? ['#94a3b8'] : bgColors,
              borderColor: '#ffffff',
              borderWidth: 2.5,
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          animation: {
            duration: 900,
            easing: 'easeOutQuart',
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 10,
                boxHeight: 10,
                padding: 10,
                font: { size: 10.5, weight: '800' },
              },
            },
            tooltip: {
              backgroundColor: 'rgba(3, 32, 56, 0.92)',
              padding: 10,
              cornerRadius: 12,
              callbacks: {
                label: (context) => {
                  const val = context.parsed;
                  const pct = totalLearners > 0 ? Math.round((val / totalLearners) * 100) : 0;
                  return ` ${context.label}: ${val} learners (${pct}%)`;
                },
              },
            },
          },
        },
      });
    } catch (err) {
      console.warn('LanguageAdoptionPieChart init error:', err);
    }

    return () => {
      safeDestroy(chartRef, chartInstance);
    };
  }, [languages, totalLearners]);

  return (
    <div className="relative w-full h-56 sm:h-64 flex items-center justify-center">
      <canvas ref={chartRef} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
        <span className="text-2xl font-black text-[#032038]">{totalLearners}</span>
        <span className="text-[9px] font-black uppercase tracking-wider text-[#032038]/60">Learners</span>
      </div>
    </div>
  );
}

/**
 * 8. League Distribution Bar Chart (Admin Control Center)
 */
export function LeagueDistributionBarChart({ counts = { bronze: 0, silver: 0, gold: 0, ruby: 0 } }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    safeDestroy(chartRef, chartInstance);

    const bronze = counts?.bronze || 0;
    const silver = counts?.silver || 0;
    const gold = counts?.gold || 0;
    const ruby = counts?.ruby || 0;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    try {
      chartInstance.current = new ChartJS(ctx, {
        type: 'bar',
        data: {
          labels: ['🥉 Bronze', '🥈 Silver', '🥇 Gold', '💎 Ruby'],
          datasets: [
            {
              label: 'Learners',
              data: [bronze, silver, gold, ruby],
              backgroundColor: [
                'rgba(180, 83, 9, 0.85)',
                'rgba(148, 163, 184, 0.9)',
                'rgba(234, 179, 8, 0.95)',
                'rgba(225, 29, 72, 0.85)',
              ],
              borderColor: ['#b45309', '#94a3b8', '#eab308', '#e11d48'],
              borderWidth: 1.5,
              borderRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 900,
            easing: 'easeOutQuart',
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(3, 32, 56, 0.92)',
              padding: 10,
              cornerRadius: 12,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11, weight: '800' } },
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(3, 32, 56, 0.08)' },
              ticks: { precision: 0, font: { size: 11, weight: '700' } },
            },
          },
        },
      });
    } catch (err) {
      console.warn('LeagueDistributionBarChart init error:', err);
    }

    return () => {
      safeDestroy(chartRef, chartInstance);
    };
  }, [counts]);

  return (
    <div className="relative w-full h-56 sm:h-64">
      <canvas ref={chartRef} />
    </div>
  );
}

