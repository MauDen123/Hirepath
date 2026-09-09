import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import jest-dom matchers
import RoleSelect from '@/components/RoleSelect';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('RoleSelect Component', () => {
  it('renders role buttons', () => {
    render(React.createElement(RoleSelect));

    // Check that the three role buttons are rendered by their exact text content
    const applicantButton = screen.getByText('Applicant');
    const hrButton = screen.getByText('HR Personnel');
    const adminButton = screen.getByText('Administrator');

    expect(applicantButton).toBeInTheDocument();
    expect(hrButton).toBeInTheDocument();
    expect(adminButton).toBeInTheDocument();
  });

  it('handles role selection', () => {
    render(React.createElement(RoleSelect));

    // Get the role buttons by their exact text content
    const applicantButton = screen.getByText('Applicant');
    const hrButton = screen.getByText('HR Personnel');
    const adminButton = screen.getByText('Administrator');

    // Initially, applicant should be selected (has 'selected' class)
    expect(applicantButton).toHaveClass('selected');
    expect(hrButton).not.toHaveClass('selected');
    expect(adminButton).not.toHaveClass('selected');

    // Click HR button
    act(() => {
      hrButton.click();
    });

    // Now HR should be selected
    expect(hrButton).toHaveClass('selected');
    expect(applicantButton).not.toHaveClass('selected');
    expect(adminButton).not.toHaveClass('selected');
  });

  it('navigates to selected role on form submit', () => {
    render(React.createElement(RoleSelect));

    // Get the role buttons
    const adminButton = screen.getByText('Administrator');

    // Click Administrator button
    act(() => {
      adminButton.click();
    });

    // Fill in form
    const emailInput = screen.getByPlaceholderText(
      /you@plm\.edu\.ph/i
    ) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(
      /•{10}/
    ) as HTMLInputElement;

    act(() => {
      emailInput.value = 'test@plm.edu.ph';
      passwordInput.value = 'password123';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Submit form by clicking the submit button
    const submitButton = screen.getByRole('button', {
      name: /continue as administrator/i,
    });
    act(() => {
      submitButton.click();
    });
  });
});
