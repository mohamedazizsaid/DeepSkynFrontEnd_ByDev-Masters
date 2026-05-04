import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SkinHealthDashboard } from './SkinHealthDashboard';

const mockFetchSkinLogs = vi.fn();
const mockFetchSeasonalPrediction = vi.fn();

vi.mock('../../hooks/useContextualAnalysis', () => ({
  useContextualAnalysis: () => ({
    skinLogs: [
      { date: '2026-05-01', conditionScore: 8 },
      { date: '2026-05-02', conditionScore: 7 },
      { date: '2026-05-03', conditionScore: 7.5 },
      { date: '2026-05-04', conditionScore: 8.2 },
      { date: '2026-05-05', conditionScore: 6.8 },
      { date: '2026-05-06', conditionScore: 7.1 },
      { date: '2026-05-07', conditionScore: 7.9 },
    ],
    seasonalPrediction: null,
    fetchSkinLogs: mockFetchSkinLogs,
    fetchSeasonalPrediction: mockFetchSeasonalPrediction,
  }),
}));

describe('SkinHealthDashboard', () => {
  it('renders and triggers data fetch', () => {
    render(<SkinHealthDashboard />);
    expect(mockFetchSkinLogs).toHaveBeenCalledWith(30);
    expect(mockFetchSeasonalPrediction).toHaveBeenCalled();
  });
});
