import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../api/courseApi', () => ({
  courseApi: {
    getCourse: vi.fn().mockResolvedValue({ data: { id: 1, title: 'Test Course', description: 'Desc', instrument: 'vocal', difficulty: 'beginner', stage: 1, lessons_count: 1 } }),
    getLessons: vi.fn().mockResolvedValue({ data: [{ id: 1, title: 'Lesson 1', order: 1, lesson_type: 'text' }] }),
    getEnrolled: vi.fn().mockResolvedValue({ data: [{ id: 1 }] }),
    enroll: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../api/progressApi', async () => {
  const actual = await vi.importActual('../api/progressApi');
  return {
    ...actual,
    progressApi: {
      ...actual.progressApi,
      getProgress: vi.fn().mockResolvedValue({ data: [{ lesson_id: 1, completed: true }] }),
    },
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Test' } }),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }),
}));

import CourseDetail from '../pages/CourseDetail';
import { progressApi } from '../api/progressApi';

const renderWithRoute = () =>
  render(
    <MemoryRouter initialEntries={['/courses/1']}>
      <Routes>
        <Route path="/courses/:id" element={<CourseDetail />} />
      </Routes>
    </MemoryRouter>
  );

describe('CourseDetail regression: getProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls progressApi.getProgress without crashing', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(progressApi.getProgress).toHaveBeenCalled();
    });
  });

  it('renders course title after loading', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText('Test Course')).toBeTruthy();
    });
  });

  it('shows enrolled status when user is enrolled', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText(/Enrolled/)).toBeTruthy();
    });
  });

  it('renders lesson list from progress data', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText('Lesson 1')).toBeTruthy();
    });
  });
});
