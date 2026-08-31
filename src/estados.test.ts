import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveEstadoCode } from "./estados.js";

test("resuelve nombres de estado completos", () => {
  assert.equal(resolveEstadoCode("Jalisco"), "14");
  assert.equal(resolveEstadoCode("Ciudad de Mexico"), "09");
  assert.equal(resolveEstadoCode("cdmx"), "09");
});

test("resuelve nombres con acentos y mayusculas distintas", () => {
  assert.equal(resolveEstadoCode("Querétaro"), "22");
  assert.equal(resolveEstadoCode("YUCATAN"), "31");
});

test("acepta codigos numericos directamente", () => {
  assert.equal(resolveEstadoCode("14"), "14");
  assert.equal(resolveEstadoCode("1"), "01");
});

test("resuelve 'nacional' al codigo 00", () => {
  assert.equal(resolveEstadoCode("nacional"), "00");
});

test("lanza error claro para un estado desconocido", () => {
  assert.throws(() => resolveEstadoCode("Narnia"), /Estado no reconocido/);
});
