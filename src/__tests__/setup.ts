import '@testing-library/jest-dom';
import React from 'react';

// Mock Next.js Image component
jest.mock('next/image', () => {
  const MockImage = (props: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => {
    const { src, alt, ...rest } = props;
    return React.createElement('img', { src, alt, ...rest });
  };
  MockImage.displayName = 'MockImage';
  return MockImage;
});

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => {
    return React.createElement('a', { href, ...props }, children);
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});
