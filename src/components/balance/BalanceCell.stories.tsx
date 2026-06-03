import type { Meta, StoryObj } from '@storybook/react';
import BalanceCell from './BalanceCell';

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
};
