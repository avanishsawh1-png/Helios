const assert = require("node:assert/strict");
const path = require("node:path");

async function main() {
  const { assertDatabasePasswordRotated } = await import(
    path.resolve(__dirname, "./password-guard.mjs")
  );
  assert.equal(assertDatabasePasswordRotated("postgres://u:helios@localhost/db", { NODE_ENV: "test" }).skipped, true);
  assert.throws(() =>
    assertDatabasePasswordRotated("postgres://u:change_me_in_production@localhost/db", { NODE_ENV: "production" }),
  );
  assert.equal(
    assertDatabasePasswordRotated("postgres://u:rotated_s3cret@localhost/db", { NODE_ENV: "production" }).ok,
    true,
  );
  console.log("Password guard unit checks: PASS imported_password-guard.mjs");
}

main();
