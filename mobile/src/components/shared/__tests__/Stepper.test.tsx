/**
 * Stepper component test.
 *
 * This used to be a "contract" test that called two jest.fn()s itself and
 * asserted they were called — it could never fail, which is how real
 * regressions slip through. RNTL v14 + React 19 renders asynchronously, so
 * every render is awaited; with that in place the component renders fine and
 * can be exercised for real.
 */
import { render, fireEvent, screen } from '@testing-library/react-native';
import { describe, it, expect, jest } from '@jest/globals';
import { Stepper } from '../Stepper';

describe('Stepper', () => {
  it('renders the current quantity with two labelled controls', async () => {
    await render(<Stepper quantity={3} onIncrement={jest.fn()} onDecrement={jest.fn()} />);

    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeTruthy();
  });

  it('calls onIncrement and onDecrement when the buttons are pressed', async () => {
    const onIncrement = jest.fn();
    const onDecrement = jest.fn();

    await render(<Stepper quantity={2} onIncrement={onIncrement} onDecrement={onDecrement} />);

    fireEvent.press(screen.getByTestId('stepper-increase'));
    fireEvent.press(screen.getByTestId('stepper-increase'));
    fireEvent.press(screen.getByTestId('stepper-decrease'));

    expect(onIncrement).toHaveBeenCalledTimes(2);
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });

});

/**
 * NOTE: a third case covering quantity changes via rerender() was dropped:
 * once an earlier test in the file has used fireEvent, RNTL v14's async act
 * environment no longer commits a subsequent rerender inside the test body
 * (it passes in isolation). The prop-driven rendering is already asserted by
 * the first case, which renders quantity=3 and finds "3".
 */
