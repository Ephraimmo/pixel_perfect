import { describe, expect, it } from "vitest";

import {
  APEX_IP,
  CNAME_TARGET,
  dnsRecords,
  hostnameError,
  isApex,
  newCustomDomain,
  normalizeHostname,
  publicHost,
  rootDomain,
  subdomainError,
  verificationToken,
  verifyRecords,
} from "@/lib/website-domain";

describe("subdomainError", () => {
  it("accepts valid addresses and rejects bad, reserved or taken ones", () => {
    expect(subdomainError("karabo-studio")).toBeNull();
    expect(subdomainError("ab")).toMatch(/at least 3/);
    expect(subdomainError("Karabo")).toMatch(/lowercase/);
    expect(subdomainError("-karabo")).toMatch(/hyphen/);
    expect(subdomainError("admin")).toMatch(/reserved/);
    expect(subdomainError("studio")).toMatch(/taken/);
  });
});

describe("hostnames", () => {
  it("normalizes pasted URLs", () => {
    expect(normalizeHostname("  https://Www.KaraboPhoto.co.za/about?x=1 ")).toBe(
      "www.karabophoto.co.za",
    );
    expect(normalizeHostname("karabo.com:443")).toBe("karabo.com");
    expect(normalizeHostname("karabo.com.")).toBe("karabo.com");
  });

  it("validates domains", () => {
    expect(hostnameError("karabo.com")).toBeNull();
    expect(hostnameError("")).toMatch(/Enter/);
    expect(hostnameError("karabo")).toMatch(/ending/);
    expect(hostnameError("kara_bo.com")).toMatch(/letters, numbers/);
    expect(hostnameError("karabo.c0m")).toMatch(/ending/);
    expect(hostnameError("karabo.pixora.site")).toMatch(/Pixora address/);
  });

  it("finds the root domain, including two-part endings", () => {
    expect(rootDomain("photos.karabo.com")).toBe("karabo.com");
    expect(rootDomain("www.karabo.co.za")).toBe("karabo.co.za");
    expect(isApex("karabo.co.za")).toBe(true);
    expect(isApex("photos.karabo.co.za")).toBe(false);
  });
});

describe("dnsRecords", () => {
  it("uses A + www CNAME + TXT for a root domain", () => {
    const r = dnsRecords("karabo.co.za");
    expect(r.map((x) => [x.type, x.name, x.value])).toEqual([
      ["A", "@", APEX_IP],
      ["CNAME", "www", CNAME_TARGET],
      ["TXT", "_pixora", verificationToken("karabo.co.za")],
    ]);
  });

  it("uses a CNAME + TXT named relative to the root for a subdomain", () => {
    const r = dnsRecords("photos.karabo.com");
    expect(r.map((x) => [x.type, x.name])).toEqual([
      ["CNAME", "photos"],
      ["TXT", "_pixora.photos"],
    ]);
  });

  it("gives each domain a stable, distinct token", () => {
    expect(verificationToken("a.com")).toBe(verificationToken("a.com"));
    expect(verificationToken("a.com")).not.toBe(verificationToken("b.com"));
  });
});

describe("verification and public address", () => {
  const now = new Date("2025-05-01T00:00:00Z");

  it("finds only the records ticked on the checklist", () => {
    const d = { ...newCustomDomain("karabo.com", now), added: ["a", "txt"] };
    const { checks, ok } = verifyRecords(d);
    expect(ok).toBe(false);
    expect(checks.filter((c) => !c.found).map((c) => c.record.key)).toEqual(["www"]);
    expect(verifyRecords({ ...d, added: ["a", "www", "txt"] }).ok).toBe(true);
  });

  it("serves the custom domain only once connected and primary", () => {
    const d = newCustomDomain("karabo.com", now);
    expect(publicHost("karabo", { custom: d })).toBe("karabo.pixora.site");
    const connected = { ...d, status: "connected" as const };
    expect(publicHost("karabo", { custom: connected })).toBe("karabo.com");
    expect(publicHost("karabo", { custom: { ...connected, canonical: "www" } })).toBe(
      "www.karabo.com",
    );
    expect(publicHost("karabo", { custom: { ...connected, primary: false } })).toBe(
      "karabo.pixora.site",
    );
  });
});
