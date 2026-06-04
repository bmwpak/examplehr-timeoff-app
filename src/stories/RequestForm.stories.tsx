import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import RequestForm from '@/components/request/RequestForm';

const meta = {
  title: 'Request/RequestForm',
  component: RequestForm,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RequestForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    employeeId: 'emp-001',
    locationId: 'LOC-NY',
    availableBalance: 10,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toBeInTheDocument();
  },
};

export const LowBalance: Story = {
  args: {
    employeeId: 'emp-001',
    locationId: 'LOC-NY',
    availableBalance: 1,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toBeInTheDocument();
  },
};

export const EmptyBalance: Story = {
  args: {
    employeeId: 'emp-001',
    locationId: 'LOC-NY',
    availableBalance: 0,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toBeInTheDocument();
  },
};
