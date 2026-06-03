import type { Meta, StoryObj } from '@storybook/react';
import RequestForm from './RequestForm';

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
};

export const LowBalance: Story = {
  args: {
    employeeId: 'emp-001',
    locationId: 'LOC-NY',
    availableBalance: 1,
  },
};

export const EmptyBalance: Story = {
  args: {
    employeeId: 'emp-001',
    locationId: 'LOC-NY',
    availableBalance: 0,
  },
};
