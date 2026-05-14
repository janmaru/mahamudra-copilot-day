import { existsSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";

const VALID_PROFILES = ["local", "remote"] as const;
type Context7Profile = (typeof VALID_PROFILES)[number];

function readArg(prefix: string): string | undefined {
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function resolveEnvSelection(): {
  envFilePath: string;
  profile: Context7Profile | null;
} {
  const explicitEnvFile = process.env.CONTEXT7_ENV_FILE?.trim() || readArg("--env-file=");

  if (explicitEnvFile) {
    return {
      envFilePath: path.resolve(process.cwd(), explicitEnvFile),
      profile: null,
    };
  }

  const requestedProfile =
    process.env.CONTEXT7_PROFILE?.trim() || readArg("--profile=") || "local";

  if (!VALID_PROFILES.includes(requestedProfile as Context7Profile)) {
    throw new Error("CONTEXT7_PROFILE must be either 'local' or 'remote'.");
  }

  const profile = requestedProfile as Context7Profile;
  return {
    envFilePath: path.resolve(process.cwd(), `.env.${profile}`),
    profile,
  };
}

function loadContext7Env(): void {
  const { envFilePath, profile } = resolveEnvSelection();

  if (!existsSync(envFilePath)) {
    throw new Error(`Missing env file: ${envFilePath}`);
  }

  const result = config({
    path: envFilePath,
    override: true,
  });

  if (result.error) {
    throw result.error;
  }

  process.env.CONTEXT7_ACTIVE_ENV_FILE = envFilePath;
  if (profile) {
    process.env.CONTEXT7_ACTIVE_PROFILE = profile;
  }
}

loadContext7Env();
