import { randomBytes, randomInt, pbkdf2Sync } from "crypto";

const PBKDF2_ITERATIONS = 100_000;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const verify = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, "sha512").toString("hex");
  return hash === verify;
}

function generateRandomPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;
  const arr = [
    upper[randomInt(upper.length)],
    lower[randomInt(lower.length)],
    digits[randomInt(digits.length)],
    special[randomInt(special.length)],
  ];
  for (let i = 4; i < 12; i++) {
    arr.push(all[randomInt(all.length)]);
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

function generateNumericPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let pw = "";
  for (let i = 0; i < length; i++) {
    pw += chars[randomInt(chars.length)];
  }
  return pw;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, ".")
    .replace(/\.+/g, ".");
}

function generateCompanyEmail(fullName: string): string {
  const domain = "@ptpgp.co.id";
  const slug = slugify(fullName);
  return `${slug}${domain}`;
}

function generateCompanyEmailUnique(
  fullName: string,
  existingEmails: string[]
): string {
  const domain = "@ptpgp.co.id";
  const slug = slugify(fullName);
  const base = `${slug}${domain}`;
  if (!existingEmails.includes(base)) return base;
  let counter = 2;
  while (existingEmails.includes(`${slug}${counter}${domain}`)) {
    counter++;
  }
  return `${slug}${counter}${domain}`;
}

export {
  hashPassword,
  verifyPassword,
  generateRandomPassword,
  generateNumericPassword,
  generateCompanyEmail,
  generateCompanyEmailUnique,
};
