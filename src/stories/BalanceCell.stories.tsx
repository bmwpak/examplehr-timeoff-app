import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import BalanceCell from '@/components/balance/BalanceCell';

const meta = {
  title: 'Balance/BalanceCell',
  component: BalanceCell,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BalanceCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    balance: {
      employeeId: 'emp-001',
      locationId: 'LOC-NY',
      available: 10,
      updatedAt: new Date().toISOString(),
    },
    isLoading: false,
    isStale: false,
    isOptimisticPending: false,
    wasRolledBack: false,
    lastVerifiedAt: Date.now(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const balanceText = canvas.getByText('10');
    await expect(balanceText).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    balance: null,
    isLoading: true,
    isStale: false,
    isOptimisticPending: false,
    wasRolledBack: false,
    lastVerifiedAt: null,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement).toBeInTheDocument();
  },
};

export const OptimisticPending: Story = {
  args: {
    balance: {
      employeeId: 'emp-001',
      locationId: 'LOC-NY',
      available: 7,
      updatedAt: new Date().toISOString(),
    },
    isLoading: false,
    isStale: false,
    isOptimisticPending: true,
    wasRolledBack: false,
    lastVerifiedAt: Date.now() - 30_000,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Pending confirmation');
    await expect(badge).toBeInTheDocument();
  },
};

export const Stale: Story = {
  args: {
    balance: {
      employeeId: 'emp-001',
      locationId: 'LOC-NY',
      available: 10,
      updatedAt: new Date(Date.now() - 150_000).toISOString(),
    },
    isLoading: false,
    isStale: true,
    isOptimisticPending: false,
    wasRolledBack: false,
    lastVerifiedAt: Date.now() - 150_000,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const staleText = canvas.getByText(/Updated/i);
    await expect(staleText).toBeInTheDocument();
  },
};

export const RolledBack: Story = {
  args: {
    balance: {
      employeeId: 'emp-001',
      locationId: 'LOC-NY',
      available: 10,
      updatedAt: new Date().toISOString(),
    },
    isLoading: false,
    isStale: false,
    isOptimisticPending: false,
    wasRolledBack: true,
    lastVerifiedAt: Date.now(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rollbackText = canvas.getByText(/rejected/i);
    await expect(rollbackText).toBeInTheDocument();
  },
};
