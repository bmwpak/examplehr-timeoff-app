import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import RequestReviewCard from '@/components/manager/RequestReviewCard';

const meta = {
  title: 'Manager/RequestReviewCard',
  component: RequestReviewCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RequestReviewCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    request: {
      id: 'req-abc12345',
      employeeId: 'emp-001',
      locationId: 'LOC-NY',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
      daysRequested: 3,
      reason: 'Family trip to Yosemite',
      status: 'pending',
      submittedAt: new Date().toISOString(),
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toBeInTheDocument();
  },
};

export const MultiDay: Story = {
  args: {
    request: {
      id: 'req-xyz54321',
      employeeId: 'emp-002',
      locationId: 'LOC-NY',
      startDate: '2026-07-01',
      endDate: '2026-07-05',
      daysRequested: 5,
      reason: 'Summer break vacation',
      status: 'pending',
      submittedAt: new Date(Date.now() - 3600_000).toISOString(),
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toBeInTheDocument();
  },
};
