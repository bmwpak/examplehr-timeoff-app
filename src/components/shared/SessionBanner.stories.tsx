import type { Meta, StoryObj } from '@storybook/react';
import SessionBanner from './SessionBanner';

const meta = {
  title: 'Shared/SessionBanner',
  component: SessionBanner,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SessionBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
