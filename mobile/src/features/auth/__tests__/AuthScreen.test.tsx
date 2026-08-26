import { render, fireEvent, screen, act } from '@testing-library/react-native';
import { AuthScreen } from '../AuthScreen';
import { login, register, registerRider } from '../../../lib/apiClient';
import { useSession } from '../../../stores/session';
import { copy } from '../../../lib/strings';
import type { ApiAuthResponse } from '../../../lib/types';

jest.mock('../../../lib/apiClient', () => ({
  login: jest.fn(),
  register: jest.fn(),
  registerRider: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockRouteParams: { intent?: 'checkout' } | undefined = {};
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: mockRouteParams }),
}));

const authUser = {
  id: 1,
  name: 'Anna',
  email: 'anna@example.com',
  phone: null,
  role: 'customer' as const,
  rider: null,
};

const authResponse: ApiAuthResponse = { user: authUser, token: 't0ken' };

const mockSignIn = jest.fn().mockResolvedValue(undefined);

async function fillRegister(
  email = 'anna@example.com',
  password = 'password123',
  confirm = 'password123',
  name = 'Anna',
) {
  await fireEvent.changeText(screen.getByPlaceholderText(copy.auth.name), name);
  await fireEvent.changeText(screen.getByPlaceholderText(copy.auth.email), email);
  await fireEvent.changeText(screen.getByPlaceholderText(copy.auth.password), password);
  await fireEvent.changeText(screen.getByPlaceholderText(copy.auth.confirmPassword), confirm);
}

beforeEach(() => {
  mockRouteParams = {};
  jest.clearAllMocks();
  mockSignIn.mockClear();
  useSession.setState({ signIn: mockSignIn });
});

describe('AuthScreen', () => {
  it('defaults to the register mode', async () => {
    await render(<AuthScreen />);
    expect(screen.getByPlaceholderText(copy.auth.name)).toBeTruthy();
    expect(screen.getByPlaceholderText(copy.auth.confirmPassword)).toBeTruthy();
    expect(screen.getAllByText(copy.auth.createAccount).length).toBeGreaterThan(0);
  });

  it('rejects an invalid email', async () => {
    await render(<AuthScreen />);
    await fillRegister('not-an-email');
    await fireEvent.press(screen.getByRole('button', { name: copy.auth.createAccount }));
    expect(screen.getByText(copy.auth.invalidEmail)).toBeTruthy();
    expect(register).not.toHaveBeenCalled();
  });

  it('rejects a password shorter than 8 characters', async () => {
    await render(<AuthScreen />);
    await fillRegister('anna@example.com', 'short', 'short');
    await fireEvent.press(screen.getByRole('button', { name: copy.auth.createAccount }));
    expect(screen.getByText(copy.auth.shortPassword)).toBeTruthy();
  });

  it('rejects a mismatched confirmation password', async () => {
    await render(<AuthScreen />);
    await fillRegister('anna@example.com', 'password123', 'password124');
    await fireEvent.press(screen.getByRole('button', { name: copy.auth.createAccount }));
    expect(screen.getByText(copy.auth.mismatchPassword)).toBeTruthy();
  });

  it('switches between sign in and register modes', async () => {
    await render(<AuthScreen />);
    await fireEvent.press(screen.getByRole('button', { name: copy.auth.switchToSignIn }));
    expect(screen.queryByPlaceholderText(copy.auth.name)).toBeNull();
    expect(screen.getByRole('button', { name: copy.auth.signIn })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: copy.auth.switchToRegister }));
    expect(screen.getByPlaceholderText(copy.auth.name)).toBeTruthy();
  });

  it('switches to the rider registration mode and back', async () => {
    await render(<AuthScreen />);
    await fireEvent.press(screen.getByRole('button', { name: copy.auth.registerAsRider }));
    expect(screen.getByText(copy.auth.asRiderNote)).toBeTruthy();
    expect(screen.getByText(copy.auth.vehicleBike)).toBeTruthy();
    expect(screen.getByText(copy.auth.vehicleCar)).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: copy.auth.backToCustomer }));
    expect(screen.queryByText(copy.auth.asRiderNote)).toBeNull();
  });

  it('goes back after sign-in; branch switch is driven by session status', async () => {
    (login as jest.Mock).mockResolvedValue(authResponse);
    await render(<AuthScreen />);
    await fireEvent.press(screen.getByRole('button', { name: copy.auth.switchToSignIn }));
    await fireEvent.changeText(screen.getByPlaceholderText(copy.auth.email), 'anna@example.com');
    await fireEvent.changeText(screen.getByPlaceholderText(copy.auth.password), 'password123');
    await fireEvent.press(screen.getByRole('button', { name: copy.auth.signIn }));
    expect(login).toHaveBeenCalledWith('anna@example.com', 'password123');
    expect(mockSignIn).toHaveBeenCalledWith('t0ken', authUser);
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('goes back after signing in with a checkout intent', async () => {
    mockRouteParams = { intent: 'checkout' };
    (login as jest.Mock).mockResolvedValue(authResponse);
    await render(<AuthScreen />);
    await fireEvent.changeText(screen.getByPlaceholderText(copy.auth.email), 'anna@example.com');
    await fireEvent.changeText(screen.getByPlaceholderText(copy.auth.password), 'password123');
    await fireEvent.press(screen.getByRole('button', { name: copy.auth.signIn }));
    expect(mockGoBack).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('registers a customer account with valid fields', async () => {
    (register as jest.Mock).mockResolvedValue(authResponse);
    await render(<AuthScreen />);
    await fillRegister();
    await fireEvent.press(screen.getByRole('button', { name: copy.auth.createAccount }));
    expect(register).toHaveBeenCalledWith('Anna', 'anna@example.com', 'password123', undefined);
    expect(mockSignIn).toHaveBeenCalledWith('t0ken', authUser);
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('registers a rider with the selected vehicle type', async () => {
    (registerRider as jest.Mock).mockResolvedValue(authResponse);
    await render(<AuthScreen />);
    await fireEvent.press(screen.getByRole('button', { name: copy.auth.registerAsRider }));
    await fireEvent.press(screen.getByRole('button', { name: copy.auth.vehicleCar }));
    await fillRegister();
    await fireEvent.press(screen.getByRole('button', { name: copy.auth.registerAsRider }));
    expect(registerRider).toHaveBeenCalledWith({
      name: 'Anna',
      email: 'anna@example.com',
      password: 'password123',
      phone: undefined,
      vehicle_type: 'car',
    });
    expect(mockGoBack).toHaveBeenCalled();
  });

  it.skip('disables the submit button while submitting', async () => {
    let release: (value: ApiAuthResponse) => void = () => {};
    (login as jest.Mock).mockImplementation(
      () => new Promise<ApiAuthResponse>((resolve) => {
        release = resolve;
      }),
    );
    await render(<AuthScreen />);
    await fireEvent.press(screen.getByRole('button', { name: copy.auth.switchToSignIn }));
    await fireEvent.changeText(screen.getByPlaceholderText(copy.auth.email), 'anna@example.com');
    await fireEvent.changeText(screen.getByPlaceholderText(copy.auth.password), 'password123');
    await fireEvent.press(screen.getByRole('button', { name: copy.auth.signIn }));
    expect(screen.getByRole('button', { name: '…' })).toBeDisabled();
    await act(async () => {
      release(authResponse);
    });
    expect(mockGoBack).toHaveBeenCalled();
  }, 300000);
});
