import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WeatherDashboard from './weather-dashboard';

const mockRefreshWeather = vi.fn();

vi.mock('@/lib/hooks/useWeather', () => ({
  useWeather: () => ({
    weather: {
      temperature: 22,
      feelsLike: 21,
      weatherCode: 0,
      city: 'Tunis',
      humidity: 45,
      windSpeed: 3,
      uvIndex: 5,
      sunrise: '06:10',
      sunset: '19:40',
    },
    advice: null,
    loading: false,
    error: null,
    refreshWeather: mockRefreshWeather,
  }),
}));

vi.mock('@/stores/accessibility.store', () => ({
  useAccessibilityStore: () => ({
    theme: 'light',
    contrastMode: 'normal',
    reduceMotion: true,
    t: (key: string) => (key === 'nav.weather' ? 'Meteo' : key),
  }),
}));

vi.mock('./weather-advice-toast', () => ({
  showWeatherAdviceToast: vi.fn(),
}));

describe('WeatherDashboard', () => {
  it('renders weather title and temperature', () => {
    render(<WeatherDashboard />);
    expect(screen.getByText(/Meteo/)).toBeInTheDocument();
    expect(screen.getByText(/22/)).toBeInTheDocument();
  });
});
