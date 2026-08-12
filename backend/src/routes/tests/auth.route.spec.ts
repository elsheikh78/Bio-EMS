import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../errors/app-error";
import { errorMiddleware } from "../../middleware/error.middleware";

const mocks = vi.hoisted(() => {
  process.env.BIOEMS_JWT_SECRET = "s".repeat(32);
  return { login: vi.fn() };
});

vi.mock("../../services/auth.service", () => ({
  AuthService: class {
    login = mocks.login;
  },
}));

vi.mock("../../repositories/user.repository", () => ({
  UserRepository: class {},
}));

vi.mock("../../services/token.service", () => ({
  TokenService: class {},
}));

import authRouter from "../auth.route";

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  if (req.method === "GET" && req.path === "/api/v1/auth/me") {
    req.user = { id: 7, username: "current-user", role: "OPERATOR" };
  }
  next();
});
app.use("/api/v1/auth", authRouter);
app.use(errorMiddleware);

describe("Login REST API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the approved HTTP 200 response without wrappers or sensitive fields", async () => {
    mocks.login.mockResolvedValue({
      access_token: "signed-token",
      token_type: "bearer",
      expires_in: 1800,
      user: { id: 1, username: "admin", role: "ADMIN" },
    });

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: " Admin ", password: " weak password " })
      .expect(200);

    expect(mocks.login).toHaveBeenCalledWith({
      username: "admin",
      password: " weak password ",
    });
    expect(response.body).toEqual({
      access_token: "signed-token",
      token_type: "bearer",
      expires_in: 1800,
      user: { id: 1, username: "admin", role: "ADMIN" },
    });
    expect(response.body).not.toHaveProperty("refresh_token");
    expect(JSON.stringify(response.body)).not.toMatch(/password_hash|password|secret/i);
  });

  it("returns the approved generic credential failure", async () => {
    mocks.login.mockRejectedValue(new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS"));

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "admin", password: "wrong" })
      .expect(401);

    expect(response.body).toEqual({
      success: false,
      error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" },
    });
  });

  it.each([
    {},
    { username: "admin", password: "" },
    { username: "admin", password: "password", unknown: true },
    { username: "admin", password: "😀".repeat(19) },
  ])("returns 400 without invoking AuthService for invalid input", async (body) => {
    const response = await request(app).post("/api/v1/auth/login").send(body).expect(400);

    expect(response.body).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid request body" },
    });
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it("preserves the malformed JSON contract", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .set("Content-Type", "application/json")
      .send('{"username":')
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid request body" },
    });
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it("does not log the response token or submitted credentials", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.login.mockResolvedValue({
      access_token: "sensitive-token",
      token_type: "bearer",
      expires_in: 1800,
      user: { id: 1, username: "admin", role: "ADMIN" },
    });

    await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "admin", password: "submitted-password" })
      .expect(200);

    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    log.mockRestore();
    error.mockRestore();
  });
});

describe("Current User REST API", () => {
  it("returns only the sanitized principal resolved before the route", async () => {
    const response = await request(app).get("/api/v1/auth/me").expect(200);

    expect(response.body).toEqual({
      user: { id: 7, username: "current-user", role: "OPERATOR" },
    });
    expect(Object.keys(response.body.user)).toEqual(["id", "username", "role"]);
    expect(JSON.stringify(response.body)).not.toMatch(
      /access_token|authorization|claim|email|password|status/i
    );
  });
});
