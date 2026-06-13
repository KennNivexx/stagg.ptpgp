import { randomBytes, randomInt, pbkdf2Sync } from "crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const verify = pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return hash === verify;
}

function generateRandomPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;
  let pw = "";
  pw += upper[randomInt(upper.length)];
  pw += lower[randomInt(lower.length)];
  pw += digits[randomInt(digits.length)];
  pw += special[randomInt(special.length)];
  for (let i = 4; i < 12; i++) {
    pw += all[randomInt(all.length)];
  }
  return pw.split("").sort(() => randomInt(3) - 1).join("");
}

function generateNumericPassword(length = 8): string {
  let pw = "";
  for (let i = 0; i < length; i++) {
    pw += randomInt(10).toString();
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
