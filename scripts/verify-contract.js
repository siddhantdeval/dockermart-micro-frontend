const fs = require('fs');
const path = require('path');

function verifyContract() {
  const contractPath = process.argv[2];
  if (!contractPath) {
    console.error("Usage: node verify-contract.js <path-to-contract-json>");
    process.exit(1);
  }

  if (!fs.existsSync(contractPath)) {
    console.error(`Contract file not found at: ${contractPath}`);
    process.exit(1);
  }

  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const provider = contract.provider;

  const providerMap = {
    checkoutApp: 'checkout-mfe',
    cartApp: 'cart-mfe'
  };

  const providerDirName = providerMap[provider];
  if (!providerDirName) {
    console.error(`Unknown provider: ${provider}`);
    process.exit(1);
  }

  const providerDir = path.resolve(__dirname, '..', providerDirName);
  const webpackConfigPath = path.join(providerDir, 'webpack.config.js');

  if (!fs.existsSync(webpackConfigPath)) {
    console.error(`Webpack config not found at: ${webpackConfigPath}`);
    process.exit(1);
  }

  const webpackConfigContent = fs.readFileSync(webpackConfigPath, 'utf8');

  // Parse exposes block
  const exposesMatch = webpackConfigContent.match(/exposes:\s*\{([\s\S]*?)\}/);
  const exposesBlock = exposesMatch ? exposesMatch[1] : '';

  // Helper to recursively collect files
  function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getFiles(filePath));
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(filePath);
      }
    });
    return results;
  }

  const srcDir = path.join(providerDir, 'src');
  let providerSourceFiles = [];
  if (fs.existsSync(srcDir)) {
    providerSourceFiles = getFiles(srcDir);
  }

  // Concatenate all source files into a single string for grep searching
  const sourceContents = providerSourceFiles
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');

  for (const interaction of contract.interactions) {
    if (interaction.type === 'exposes') {
      const cleanExposes = exposesBlock.replace(/\s/g, '');
      const keySingle = `'${interaction.module}':`;
      const keyDouble = `"${interaction.module}":`;
      const keyBare = `${interaction.module}:`;
      
      const hasExposed = cleanExposes.includes(keySingle) || 
                         cleanExposes.includes(keyDouble) || 
                         cleanExposes.includes(keyBare);
      
      if (!hasExposed) {
        console.error(`Contract Violation: Module "${interaction.module}" is NOT exposed in ${contract.provider}'s webpack.config.js`);
        process.exit(1);
      }
      console.log(`✓ Verified exposed module: ${interaction.module}`);
    } else if (interaction.type === 'fires_event') {
      const eventName = interaction.event;
      if (!sourceContents.includes(eventName)) {
        console.error(`Contract Violation: Event "${eventName}" is NOT fired anywhere in ${contract.provider}'s src/ folder`);
        process.exit(1);
      }
      
      // Also verify detail keys exist in the event payload
      for (const key of interaction.detail_keys) {
        if (!sourceContents.includes(key)) {
          console.error(`Contract Violation: Key "${key}" for event "${eventName}" was NOT found in provider source files`);
          process.exit(1);
        }
      }
      console.log(`✓ Verified event: ${eventName} (with keys: ${interaction.detail_keys.join(', ')})`);
    }
  }

  console.log(`\n🎉 Contract successfully verified for ${contract.provider}!`);
}

verifyContract();
