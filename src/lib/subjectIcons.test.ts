import { describe, expect, it } from "vitest";
import { SUBJECTS } from "../config/site";
import { SUBJECT_ICON_PATHS, subjectIconPaths } from "./subjectIcons";

describe("SUBJECT_ICON_PATHS", () => {
  it("ships exactly one icon per registered subject", () => {
    const expected = SUBJECTS.map((s) => s.id).sort();
    const actual = Object.keys(SUBJECT_ICON_PATHS).sort();
    expect(actual).toEqual(expected);
  });

  it.each(SUBJECTS.map((s) => s.id))("has non-empty stroke geometry for %s", (id) => {
    const markup = SUBJECT_ICON_PATHS[id];
    expect(markup, `${id} icon is missing`).toBeTruthy();
    // Найслабший контракт: гліф містить хоча б одну SVG-фігуру. Якщо хтось
    // випадково очистить запис — тест впаде.
    expect(/<(path|circle|ellipse|rect|polygon|polyline)\b/.test(markup)).toBe(true);
  });

  it.each(SUBJECTS.map((s) => s.id))("does not nest a stray <svg> for %s", (id) => {
    // SubjectIcon.astro вже відкриває власне <svg viewBox="0 0 24 24">. Якщо
    // запис у реєстрі теж принесе свій <svg>, ми отримаємо вкладений документ
    // і поламаємо стилі. Захищаємось просто на рівні рядка.
    expect(SUBJECT_ICON_PATHS[id]).not.toMatch(/<svg\b/);
  });

  it("subjectIconPaths is a thin lookup over the same registry", () => {
    for (const s of SUBJECTS) {
      expect(subjectIconPaths(s.id)).toBe(SUBJECT_ICON_PATHS[s.id]);
    }
  });
});
