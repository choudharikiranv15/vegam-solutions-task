import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserActions } from './UserActions';
import { describe, it, expect, vi } from 'vitest';
import type { User } from '@/types';

// Mock user data
const mockUser: User = {
    userId: '1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
    createdAt: '2023-01-01',
    groups: [],
};

describe('UserActions Component', () => {
    it('renders activation button for inactive user', () => {
        const onToggleStatus = vi.fn();
        const inactiveUser = { ...mockUser, status: 'inactive' as const };

        render(<UserActions user={inactiveUser} onToggleStatus={onToggleStatus} />);

        const button = screen.getByRole('button', { name: /activate user/i });
        expect(button).toBeInTheDocument();
    });

    it('renders deactivation button for active user', () => {
        const onToggleStatus = vi.fn();

        render(<UserActions user={mockUser} onToggleStatus={onToggleStatus} />);

        const button = screen.getByRole('button', { name: /deactivate user/i });
        expect(button).toBeInTheDocument();
    });

    it('calls onToggleStatus with "active" when activating an inactive user', () => {
        const onToggleStatus = vi.fn();
        const inactiveUser = { ...mockUser, status: 'inactive' as const };

        render(<UserActions user={inactiveUser} onToggleStatus={onToggleStatus} />);

        const button = screen.getByRole('button', { name: /activate user/i });
        fireEvent.click(button);

        expect(onToggleStatus).toHaveBeenCalledWith('1', 'active');
    });

    it('opens confirmation dialog when clicking deactivate', () => {
        const onToggleStatus = vi.fn();

        render(<UserActions user={mockUser} onToggleStatus={onToggleStatus} />);

        const button = screen.getByRole('button', { name: /deactivate user/i });
        fireEvent.click(button);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/are you sure you want to deactivate/i)).toBeInTheDocument();
        expect(onToggleStatus).not.toHaveBeenCalled();
    });

    it('calls onToggleStatus with "inactive" when confirming deactivation', () => {
        const onToggleStatus = vi.fn();

        render(<UserActions user={mockUser} onToggleStatus={onToggleStatus} />);

        const button = screen.getByRole('button', { name: /deactivate user/i });
        fireEvent.click(button);

        // Within the dialog
        const confirmButton = screen.getByRole('button', { name: 'Deactivate' });
        fireEvent.click(confirmButton);

        expect(onToggleStatus).toHaveBeenCalledWith('1', 'inactive');
    });

    it('closes dialog when cancel is clicked', async () => {
        const onToggleStatus = vi.fn();

        render(<UserActions user={mockUser} onToggleStatus={onToggleStatus} />);

        const button = screen.getByRole('button', { name: /deactivate user/i });
        fireEvent.click(button);

        const cancelButton = screen.getByRole('button', { name: 'Cancel' });
        fireEvent.click(cancelButton);

        // Wait for dialog to disappear (handling transitions)
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
        expect(onToggleStatus).not.toHaveBeenCalled();
    });

    it('renders spinner when isUpdating is true', () => {
        const onToggleStatus = vi.fn();

        render(<UserActions user={mockUser} onToggleStatus={onToggleStatus} isUpdating={true} />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        // CircularProgress has role="progressbar" usually, but code says role="status"
        expect(screen.getByRole('status')).toBeInTheDocument();
    });
});
