import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";

// Mock signIn from next-auth
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

describe("LoginForm", () => {
  it("should render login form with all providers", () => {
    render(<LoginForm />);

    // Check title
    expect(screen.getByRole("heading", { name: /ログイン/i })).toBeInTheDocument();

    // Check OAuth provider buttons
    expect(screen.getByRole("button", { name: /Google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /LINE/i })).toBeInTheDocument();

    // Check email form
    expect(screen.getByPlaceholderText(/メールアドレス/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /メールでログイン/i })).toBeInTheDocument();
  });

  it("should call signIn with google provider when Google button clicked", async () => {
    const { signIn } = await import("next-auth/react");
    render(<LoginForm />);

    const googleButton = screen.getByRole("button", { name: /Google/i });
    await userEvent.click(googleButton);

    expect(signIn).toHaveBeenCalledWith("google", expect.any(Object));
  });

  it("should call signIn with line provider when LINE button clicked", async () => {
    const { signIn } = await import("next-auth/react");
    render(<LoginForm />);

    const lineButton = screen.getByRole("button", { name: /LINE/i });
    await userEvent.click(lineButton);

    expect(signIn).toHaveBeenCalledWith("line", expect.any(Object));
  });

  it("should validate email before submitting magic link", async () => {
    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText(/メールアドレス/i);
    const submitButton = screen.getByRole("button", { name: /メールでログイン/i });

    // Submit with invalid email
    await userEvent.type(emailInput, "invalid-email");
    await userEvent.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/有効なメールアドレス/i)).toBeInTheDocument();
    });
  });

  it("should call signIn with email provider for valid email", async () => {
    const { signIn } = await import("next-auth/react");
    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText(/メールアドレス/i);
    const submitButton = screen.getByRole("button", { name: /メールでログイン/i });

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("resend", {
        email: "test@example.com",
        callbackUrl: expect.any(String),
      });
    });
  });

  it("should show loading state during submission", async () => {
    const { signIn } = await import("next-auth/react");
    vi.mocked(signIn).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText(/メールアドレス/i);
    const submitButton = screen.getByRole("button", { name: /メールでログイン/i });

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it("should pass callbackUrl to signIn", async () => {
    const { signIn } = await import("next-auth/react");
    render(<LoginForm callbackUrl="/admin/tenants" />);

    const googleButton = screen.getByRole("button", { name: /Google/i });
    await userEvent.click(googleButton);

    expect(signIn).toHaveBeenCalledWith("google", {
      callbackUrl: "/admin/tenants",
    });
  });
});

describe("LoginForm - Error Handling", () => {
  it("should display error message on authentication failure", async () => {
    render(<LoginForm error="OAuthAccountNotLinked" />);

    expect(
      screen.getByText(/このメールアドレスは別の認証方法で登録されています/i)
    ).toBeInTheDocument();
  });

  it("should display generic error for unknown errors", async () => {
    render(<LoginForm error="UnknownError" />);

    expect(screen.getByText(/ログインに失敗しました/i)).toBeInTheDocument();
  });
});
