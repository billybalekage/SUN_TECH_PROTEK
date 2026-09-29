import { beforeEach, describe, expect, it, vi } from "vitest";
import projectRepository from "../../../src/features/projects/repository/project.repository.js";

const prismaClient = { $transaction: vi.fn() };
const transaction = {
  project: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  prismaClient.$transaction.mockImplementation((callback) =>
    callback(transaction),
  );
});

describe("project validation date", () => {
  it("sets the date when the project is marked completed", async () => {
    transaction.project.findUnique.mockResolvedValue({
      status: "IN_PROGRESS",
      validatedAt: null,
    });
    transaction.project.update.mockImplementation(({ data }) => data);

    const updated = await projectRepository.updateProject(
      "project-1",
      { status: "COMPLETED" },
      prismaClient,
    );

    expect(updated.validatedAt).toBeInstanceOf(Date);
    expect(transaction.project.update).toHaveBeenCalledWith({
      where: { id: "project-1" },
      data: expect.objectContaining({
        status: "COMPLETED",
        validatedAt: expect.any(Date),
      }),
    });
  });

  it("preserves the validation date when editing a completed project", async () => {
    const validatedAt = new Date("2026-09-28T12:00:00.000Z");
    transaction.project.findUnique.mockResolvedValue({
      status: "COMPLETED",
      validatedAt,
    });
    transaction.project.update.mockImplementation(({ data }) => data);

    const updated = await projectRepository.updateProject(
      "project-1",
      { status: "COMPLETED", address: "Nouvelle adresse" },
      prismaClient,
    );

    expect(updated.validatedAt).toBe(validatedAt);
  });

  it("clears the validation date when the project is reopened", async () => {
    transaction.project.findUnique.mockResolvedValue({
      status: "COMPLETED",
      validatedAt: new Date("2026-09-28T12:00:00.000Z"),
    });
    transaction.project.update.mockImplementation(({ data }) => data);

    const updated = await projectRepository.updateProject(
      "project-1",
      { status: "IN_PROGRESS" },
      prismaClient,
    );

    expect(updated.validatedAt).toBeNull();
  });
});
