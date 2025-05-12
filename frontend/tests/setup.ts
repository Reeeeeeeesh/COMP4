console.log('Loading test setup file...');

import { vi, expect, afterEach } from 'vitest';
import React from 'react';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      'div',
      { 'data-testid': 'mock-responsive-container' },
      children
    ),
  PieChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'mock-pie-chart' }, children),
  Pie: (props: any) =>
    React.createElement('div', { 'data-testid': 'mock-pie', ...props }, 'Pie Slice'),
  BarChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'mock-bar-chart' }, children),
  Bar: (props: any) =>
    React.createElement('div', { 'data-testid': 'mock-bar', ...props }, 'Bar Element'),
  XAxis: (props: any) =>
    React.createElement('div', { 'data-testid': 'mock-xaxis', ...props }),
  YAxis: (props: any) =>
    React.createElement('div', { 'data-testid': 'mock-yaxis', ...props }),
  Tooltip: (props: any) =>
    React.createElement('div', { 'data-testid': 'mock-tooltip', ...props }),
  Cell: (props: any) =>
    React.createElement('div', { 'data-testid': 'mock-cell', ...props }),
}));

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock SVG elements for recharts
class SVGPathElement extends HTMLElement {}
class SVGElement extends HTMLElement {}

Object.defineProperty(window, 'SVGPathElement', {
  writable: true,
  value: SVGPathElement,
});

Object.defineProperty(window, 'SVGElement', {
  writable: true,
  value: SVGElement,
});

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
