const { EndpointId } = require('@layerzerolabs/lz-definitions');

// Try to see what DVNs are registered
async function main() {
  try {
    const metadata = require('@layerzerolabs/metadata-tools');
    console.log("Metadata tools available methods:");
    console.log(Object.keys(metadata));
  } catch (e) {
    console.log("Error loading metadata-tools:", e.message);
  }
}

main();
