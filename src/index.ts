/**
 * Demo Package - Clean Version
 * This package demonstrates cache poisoning vulnerability
 */

export function greet(name: string): string {
  return `Hello, ${name}!`;
}

export function getVersion(): string {
  return "1.0.0";
}

// Main execution
if (require.main === module) {
  console.log("========================================");
  console.log("  Demo Package - Clean Version");
  console.log("========================================");
  console.log();
  console.log(greet("World"));
  console.log(`Version: ${getVersion()}`);
  console.log();
  console.log("✓ Package is CLEAN (not compromised)");
}
