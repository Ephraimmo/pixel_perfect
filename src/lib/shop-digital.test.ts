import { describe, expect, it } from "vitest";
import { SEED_SETTINGS, migrateShopState, seedShopState } from "./shop-data";
import {
  describeDigital,
  digitalToForm,
  renderDeliveryEmail,
  validateDeliveryEmail,
  validateDigitalForm,
} from "./shop-digital";
import { emptyProductForm, productToForm, validateProductForm } from "./shop-product-form";

const defaults = { ...SEED_SETTINGS.digitalDefaults, files: [] };

describe("digital download settings", () => {
  it("validates limits only when they are switched on", () => {
    const form = {
      ...digitalToForm(defaults),
      downloadLimit: "0",
      expiryDays: "400",
      manualDays: "x",
    };
    const r = validateDigitalForm(form, { requireFiles: true });
    expect(Object.keys(r.errors).sort()).toEqual(["digital.downloadLimit", "digital.expiryDays"]);
    const off = validateDigitalForm(
      { ...form, limitDownloads: false, expires: false },
      { requireFiles: true },
    );
    expect(off.settings).toMatchObject({ downloadLimit: null, expiryDays: null });
    const manual = validateDigitalForm(
      { ...digitalToForm(defaults), delivery: "manual", manualDays: "0" },
      { requireFiles: true },
    );
    expect(manual.errors["digital.manualDays"]).toBeTruthy();
  });

  it("requires files when the product delivers uploaded files", () => {
    const form = { ...digitalToForm(defaults), scope: "files" as const };
    expect(validateDigitalForm(form, { requireFiles: true }).errors["digital.files"]).toBeTruthy();
    const withFile = { ...form, files: [{ id: "f1", name: "presets.zip", size: 1200 }] };
    expect(validateDigitalForm(withFile, { requireFiles: true }).settings?.files).toHaveLength(1);
  });

  it("saves digital settings only for digital products", () => {
    const digital = validateProductForm({
      ...emptyProductForm("digital"),
      name: "Web set",
      price: "40",
    });
    expect(digital.ok && digital.product.digital).toMatchObject({
      scope: "single",
      downloadLimit: 3,
    });
    const print = validateProductForm({
      ...emptyProductForm("package"),
      name: "Package",
      price: "40",
    });
    expect(print.ok && print.product.digital).toBeNull();
    const p6 = seedShopState().products.find((p) => p.id === "p6")!;
    const again = validateProductForm(productToForm(p6));
    expect(again.ok && again.product.digital).toEqual(p6.digital);
  });

  it("describes delivery in plain language", () => {
    expect(describeDigital(defaults)).toEqual([
      "One photo · Original resolution",
      "Download link emailed as soon as payment clears",
      "3 downloads per purchase · link expires after 30 days",
      "Includes a personal-use print release",
    ]);
  });

  it("fills email placeholders and requires the download link", () => {
    const { subject, body } = renderDeliveryEmail(SEED_SETTINGS.deliveryEmail, {
      clientName: "Sarah",
      productName: "Full Gallery Download",
      studioName: "Karabo Photography",
      downloadLink: "https://example.test/d/1",
      expiresOn: "2025-05-20",
    });
    expect(subject).toBe("Your Full Gallery Download is ready to download");
    expect(body).toContain("Hi Sarah,");
    expect(body).toContain("https://example.test/d/1");
    expect(body).toContain("This link expires on May 20, 2025.");
    expect(body).not.toMatch(/\{[a-z_]+\}/);
    const bad = validateDeliveryEmail({
      ...SEED_SETTINGS.deliveryEmail,
      replyTo: "nope",
      body: "Hi",
    });
    expect(Object.keys(bad).sort()).toEqual(["body", "replyTo"]);
  });

  it("gives digital products saved before v3 the store defaults", () => {
    const v2 = {
      version: 2,
      products: [
        {
          id: "x1",
          name: "Old digital",
          category: "digital",
          price: 5,
          image: "a",
          active: true,
          popular: false,
        },
      ],
      orders: [],
    };
    const migrated = migrateShopState(v2)!;
    expect(migrated.products[0]!.digital).toMatchObject({ scope: "single", files: [] });
    expect(migrated.settings.deliveryEmail.subject).toBeTruthy();
  });
});
