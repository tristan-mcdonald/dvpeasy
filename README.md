# DVPeasy

🚀 **[Try it live](https://dvpeasy.trade)** - DVP settlements on multiple blockchain networks

A decentralized application for creating and managing Delivery Versus Payment settlements on Ethereum-compatible blockchains. This application allows users to create multi-party, multi-asset settlements with atomic execution guarantees.

## Architecture overview

**Delivery Versus Payment (DVP)** is a financial settlement mechanism that ensures the simultaneous exchange of assets between parties. This eliminates counterparty risk by guaranteeing that:

- Assets are only transferred when **all conditions are met**
- **All parties have approved** the settlement
- The exchange happens **atomically** - either all transfers succeed or none do
- **Multi-party settlements** can involve many participants
- **Multi-asset settlements** can include ERC20 tokens, NFTs, and ETH

## Key features

- Create settlements with multiple token flows (ERC20 and ERC721/NFTs)
- Specify cutoff dates for settlement expiration
- Auto-settlement option when all parties approve
- Real-time settlement status tracking
- Secure wallet connection and transaction signing
- Multi-chain support (Ethereum, Arbitrum, Polygon)

## Supported networks

| Network | Environment | Current Contract Version | Contract Address |
|---------|-------------|-------------------------|------------------|
| **Ethereum Sepolia** | Development | v1.0 | `0x0DB7eb1E62514625E03AdE35E60df74Fb8e4E36a` |
| **Arbitrum Sepolia** | Development | v1.0 | `0xA19B617507fef9866Fc7465933f7e3D48C7Ca03C` |
| **Polygon Mainnet** | Production | v1.0 | `0xFBdA0E404B429c878063b3252A2c2da14fe28e7f` |
| **Avalanche** | Production | v1.0 | `0xE87c95AB6a3e11e16E72A2b6234454Bb29130C95` |
| **Avalanche Fuji** | Development | v1.0 | `0xa70404d8ca272bE8bAA48A4b83ED94Db17068e05` |

## Technology stack

- **Frontend framework**: React with TypeScript
- **Build tool**: Vite
- **CSS**: TailwindCSS
- **Code Organization**: Manager classes for related functionality (ContractConfigManager, NetworkManager, ChainManager, TokenManager, UrlManager, ErrorManager)
- **Blockchain Interaction**:
  - Wagmi (React Hooks for Ethereum)
  - Viem (TypeScript Interface for Ethereum)
  - AppKit/Reown (Wallet connection)
- **Routing**: React Router
- **State management**: React Query
- **UI components**: Headless UI, Lucide React icons
- **Data visualization**: D3.js
- **Date handling**: Flatpickr
- **Notifications**: React Hot Toast
- **Token icons**: Cryptocurrency Icons
- **Drag & drop**: DnD Kit

## Prerequisites

- **Node.js** (23.11.x; per package.json "engines")
- **Yarn 4** (managed via Corepack — run `corepack enable`)
- **MetaMask** or another Ethereum wallet
- **Test ETH** for gas fees on testnets, or **real ETH/MATIC** for mainnet

## Installation

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/tristan-mcdonald/dvpeasy.git
   cd dvpeasy
   yarn install
   ```

2. (Optional) Create a `.env` file with your Alchemy API key:
   ```env
   VITE_ALCHEMY_API_KEY=your-api-key-here
   ```

   **Note**: The application includes fallback RPC endpoints, so this is optional. Adding your own API key may improve performance and avoid rate limits.

## Running the application

Start the development server:

```bash
yarn dev
```

The application will be available at `http://localhost:5173`.

## Usage guide

### Connecting your wallet

1. Click **"Connect wallet"** in the navigation bar
2. Select your preferred wallet provider (MetaMask, WalletConnect, etc.)
3. Choose your desired network from the supported options
4. Ensure you have sufficient gas tokens for the selected network

### Creating a settlement

1. Navigate to **"Create settlement"**
2. Add token flows by specifying:
   - **Token address** (or select from popular tokens)
   - **Sender address** (who sends the asset)
   - **Receiver address** (who receives the asset)
   - **Amount** (for ERC20) or **Token ID** (for NFTs)
3. Set a **cutoff date** for settlement expiration
4. Add an optional **reference** for identification
5. Enable **auto-settlement** if desired (executes automatically when all approve)
6. Review and **submit the transaction**

### Viewing settlements

- **Dashboard**: See all settlements you're involved in
- **Settlement Details**: Click any settlement for comprehensive information
- **Status Tracking**: Monitor approval progress and execution status

### Approving & executing settlements

1. Navigate to the **Settlement Details** page
2. Review all token flows and parties involved
3. **Approve** the settlement by signing the transaction
4. Once **all parties approve**, the settlement becomes executable
5. **Execute** manually or wait for auto-execution (if enabled)

## Smart contract functions

### Core functions
- `createSettlement()` - Create a new DVP settlement
- `approveSettlements()` - Approve one or more settlements
- `executeSettlement()` - Execute a fully approved settlement
- `revokeApprovals()` - Revoke previously granted approvals

### Data retrieval
Settlement data is accessed through manager objects that handle contract interactions:
- **ContractConfigManager** - Manages contract configurations and network switching
- **Settlement queries** - Retrieve complete settlement details and party status
- **Approval status** - Check if settlements are ready for execution

## Contract versioning system

The application supports multiple versions of smart contracts per network, allowing users to access older contract versions for existing settlements.

### Adding a new contract version

Every contract address is in `src/config/contracts/deployments.ts`, by network and version. To add
a version, add a deployment to the network's list, newest first:

```typescript
sepolia: {
  defaultVersion: 'v2.0', // Update the default if the new version should be used by default.
  deployments: [
    {
      version: {
        tag: 'v2.0',
        name: 'Feature update',
        isDeprecated: false,
        deploymentDate: '2026-11-01',
      },
      dvpAddress: '0xYourNewContractAddress',
      dvpHelperAddress: '0xYourNewHelperAddress',
    },
    // ... existing deployments ...
  ],
},
```

Set `isDeprecated: true` on an older version to mark it as deprecated in the version picker. Every
version shares the ABIs in `src/config/contracts/abis/`; a contract with a different ABI needs them
to be given per version.

### Version persistence

- Version selections are **saved per network** in localStorage
- Selections **persist across sessions**
- Switching networks **loads the appropriate version** for that network
- Invalid versions **fallback to the default** version automatically

## Development

### Available scripts

| Command                         | Description                                                         |
|---------------------------------|---------------------------------------------------------------------|
| `yarn dev`                      | Start development server                                            |
| `yarn build`                    | Build for production (includes icon sync, linting, and compilation) |
| `yarn sync-icons`               | Sync cryptocurrency icons from the library                          |
| `yarn lint`                     | Run ESLint to check code quality                                    |
| `yarn lint:fix`                 | Auto-fix linting issues where possible                              |
| `yarn preview`                  | Preview production build locally                                    |
| `yarn test:e2e:install-browser` | Install the Chromium browser for Playwright                         |
| `yarn test:e2e:setup-wallet`    | Configure the MetaMask extension for Synpress                       |
| `yarn test:e2e`                 | Run playwright e2e tests                                            |

### Build process

The build process includes several steps:
1. **Icon Synchronization** - Updates token icons from cryptocurrency-icons library
2. **Linting** - Ensures code quality standards
3. **TypeScript Compilation** - Type checking
4. **Vite Build** - Optimized production bundle

### Code quality standards

- **ESLint** with TypeScript support for code quality
- **Automatic formatting** and error detection
- **Build fails** if linting errors exist (ensures quality)
- **TypeScript strict mode** for type safety

```bash
# Development workflow
yarn lint          # Check for issues
yarn lint:fix      # Fix auto-fixable issues
yarn build         # Full build with all checks
```

### Git hooks (pre-commit)

This repository uses pre-commit to enforce repository hygiene and run ESLint on staged files.

Installed hooks:
- check-yaml
- check-toml
- end-of-file-fixer
- trailing-whitespace
- check-merge-conflict
- check-added-large-files
- ESLint (project ESLint via Yarn)

Setup:
1. Install pre-commit
   - pipx: `pipx install pre-commit`
   - pip (user): `pip install --user pre-commit`
   - Homebrew (macOS): `brew install pre-commit`
2. Enable Corepack and install dependencies
   ```bash
   corepack enable
   yarn install
   ```
3. Install the Git hook
   ```bash
   pre-commit install
   ```
4. Optional: run hooks on the entire repository
   ```bash
   pre-commit run --all-files
   ```

Notes:
- The ESLint hook uses `yarn eslint` with `--max-warnings=0`, so warnings will fail the commit.
- Hooks run only on staged files by default; use the optional command above to check all files.

### Requirements
- **Web3 wallet extension** (MetaMask, etc.) or **WalletConnect** support
- **Modern JavaScript support** (ES2020+)
- **Local storage** enabled for wallet connection persistence

### Development setup
1. Fork the repository
2. Install dependencies: `yarn install`
3. Create a feature branch: `git checkout -b feature-name`
4. Make your changes following our code standards
5. Run tests: `yarn lint` and `yarn build`
6. Configure synpress (playwright + metamask) for e2e tests: `yarn test:e2e:install-browser && yarn test:e2e:setup-wallet`
7. Run e2e tests: `yarn test:e2e`
8. Submit a pull request

### Development workflow
- Test changes locally with `yarn dev`
- Ensure all builds pass: `yarn build`
- Check code quality: `yarn lint`

### E2E Test Coverage

Core test suites:
- `dashboard.spec.ts` - Dashboard functionality and wallet connection
- `settlement-create.spec.ts` - Settlement creation flow

### Implement e2e tests
1. go to tests/e2e
2. create a file specific to a page if it doesn't exist, e.g. `create-settlement.test.ts`
3. copy the structure from `tests/e2e/dashboard.spec.ts` and modify for your page
4. run tests with `yarn test:e2e` or `yarn test:e2e:debug` for enhanced dev experience

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
