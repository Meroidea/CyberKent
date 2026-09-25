import pg from "pg";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResilientPool, isTransientConnectError } from "@/lib/prisma";

const full = () => Object.assign(new Error("(EMAXCONN) max client connections reached, limit: 200"), { code: "XX000" });

describe("database pool under a full pooler", () => {
  afterEach(() => vi.restoreAllMocks());

  it("recognises the pooler's momentary refusals and nothing else", () => {
    expect(isTransientConnectError(full())).toBe(true);
    expect(isTransientConnectError(new Error("(EMAXCONNSESSION) max clients reached in session mode"))).toBe(true);
    expect(isTransientConnectError(Object.assign(new Error("sorry, too many clients already"), { code: "53300" }))).toBe(true);
    expect(isTransientConnectError(new Error("password authentication failed"))).toBe(false);
  });

  it("waits and retries a refused connection, for both connect forms", async () => {
    const client = { release: vi.fn() } as unknown as pg.PoolClient;
    const connect = vi.spyOn(pg.Pool.prototype, "connect")
      .mockRejectedValueOnce(full())
      .mockRejectedValueOnce(full())
      .mockResolvedValue(client as never);
    const pool = new ResilientPool({ connectionString: "postgresql://unused@localhost:1/none" });

    await expect(pool.connect()).resolves.toBe(client);
    expect(connect).toHaveBeenCalledTimes(3);

    connect.mockRejectedValueOnce(full());
    const viaCallback = await new Promise<pg.PoolClient | undefined>((resolve, reject) =>
      pool.connect((error, got) => (error ? reject(error) : resolve(got))),
    );
    expect(viaCallback).toBe(client);
  });

  it("gives up after a few tries, and never retries a real failure", async () => {
    const connect = vi.spyOn(pg.Pool.prototype, "connect").mockRejectedValue(full());
    const pool = new ResilientPool({ connectionString: "postgresql://unused@localhost:1/none" });
    await expect(pool.connect()).rejects.toThrow(/EMAXCONN/);
    expect(connect).toHaveBeenCalledTimes(4);

    connect.mockReset().mockRejectedValue(new Error("password authentication failed"));
    await expect(pool.connect()).rejects.toThrow(/password/);
    expect(connect).toHaveBeenCalledTimes(1);
  });
});
