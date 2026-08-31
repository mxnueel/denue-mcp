import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveIndicador } from "./indicadores.js";

test("resuelve indicadores conocidos por nombre", () => {
  assert.equal(resolveIndicador("poblacion").codigo, "1002000001");
  assert.equal(resolveIndicador("Inflación").codigo, "910396");
  assert.equal(resolveIndicador("INPC").codigo, "910396");
});

test("acepta un codigo numerico directo", () => {
  const r = resolveIndicador("123456");
  assert.equal(r.codigo, "123456");
  assert.equal(r.banco, "BIE-BISE");
});

test("lanza error claro para un indicador desconocido", () => {
  assert.throws(() => resolveIndicador("cosa inventada"), /Indicador no reconocido/);
});
