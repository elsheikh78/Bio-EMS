import "dotenv/config";

export function runBootstrapSystemOwnerCommand(): number {
  console.error(
    "Direct System Owner bootstrap is disabled. Use a manufacturer-signed commissioning package."
  );
  return 1;
}

if (require.main === module) {
  process.exitCode = runBootstrapSystemOwnerCommand();
}
