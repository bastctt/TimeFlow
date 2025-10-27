import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import ClockButton from './ClockButton';
import * as ClockContext from '@/context/ClockContext';

describe('ClockButton Component', () => {
  const mockCheckIn = vi.fn();
  const mockCheckOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders check-in button when not clocked in', () => {
    vi.spyOn(ClockContext, 'useClock').mockReturnValue({
      isCheckedIn: false,
      lastClockEntry: null,
      checkIn: mockCheckIn,
      checkOut: mockCheckOut,
      loading: false,
    });

    render(<ClockButton />);

    const checkInButton = screen.getByRole('button', { name: /check in/i });
    expect(checkInButton).toBeInTheDocument();
    expect(checkInButton).not.toBeDisabled();
  });

  it('renders check-out button when clocked in', () => {
    vi.spyOn(ClockContext, 'useClock').mockReturnValue({
      isCheckedIn: true,
      lastClockEntry: {
        id: 1,
        user_id: 1,
        clock_time: new Date().toISOString(),
        status: 'check-in',
        created_at: new Date().toISOString(),
      },
      checkIn: mockCheckIn,
      checkOut: mockCheckOut,
      loading: false,
    });

    render(<ClockButton />);

    const checkOutButton = screen.getByRole('button', { name: /check out/i });
    expect(checkOutButton).toBeInTheDocument();
    expect(checkOutButton).not.toBeDisabled();
  });

  it('disables button when loading', () => {
    vi.spyOn(ClockContext, 'useClock').mockReturnValue({
      isCheckedIn: false,
      lastClockEntry: null,
      checkIn: mockCheckIn,
      checkOut: mockCheckOut,
      loading: true,
    });

    render(<ClockButton />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('calls checkIn when check-in button is clicked', async () => {
    const user = userEvent.setup();
    mockCheckIn.mockResolvedValue(undefined);

    vi.spyOn(ClockContext, 'useClock').mockReturnValue({
      isCheckedIn: false,
      lastClockEntry: null,
      checkIn: mockCheckIn,
      checkOut: mockCheckOut,
      loading: false,
    });

    render(<ClockButton />);

    const checkInButton = screen.getByRole('button', { name: /check in/i });
    await user.click(checkInButton);

    expect(mockCheckIn).toHaveBeenCalled();
  });

  it('calls checkOut when check-out button is clicked', async () => {
    const user = userEvent.setup();
    mockCheckOut.mockResolvedValue(undefined);

    vi.spyOn(ClockContext, 'useClock').mockReturnValue({
      isCheckedIn: true,
      lastClockEntry: {
        id: 1,
        user_id: 1,
        clock_time: new Date().toISOString(),
        status: 'check-in',
        created_at: new Date().toISOString(),
      },
      checkIn: mockCheckIn,
      checkOut: mockCheckOut,
      loading: false,
    });

    render(<ClockButton />);

    const checkOutButton = screen.getByRole('button', { name: /check out/i });
    await user.click(checkOutButton);

    expect(mockCheckOut).toHaveBeenCalled();
  });
});
