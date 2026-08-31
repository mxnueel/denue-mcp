import { test } from "node:test";
import assert from "node:assert/strict";
import { buscarCercania, buscarPorEstado, buscarPorNombre, obtenerFicha } from "./denue.js";

test("cada funcion rechaza claramente si falta INEGI_DENUE_TOKEN", async () => {
  const original = process.env.INEGI_DENUE_TOKEN;
  delete process.env.INEGI_DENUE_TOKEN;
  try {
    await assert.rejects(() => buscarCercania("oxxo", 20.6, -103.3, 1000), /INEGI_DENUE_TOKEN/);
    await assert.rejects(() => buscarPorEstado("oxxo", "14"), /INEGI_DENUE_TOKEN/);
    await assert.rejects(() => buscarPorNombre("oxxo"), /INEGI_DENUE_TOKEN/);
    await assert.rejects(() => obtenerFicha("123"), /INEGI_DENUE_TOKEN/);
  } finally {
    if (original !== undefined) process.env.INEGI_DENUE_TOKEN = original;
  }
});
