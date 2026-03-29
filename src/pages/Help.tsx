import ContractVerificationInfo from '../components/ContractVerificationInfo';
import HeaderLocal from '../components/HeaderLocal';

export default function Help () {
  return (
    <div className="mx-auto max-w-5xl pb-12">
      <HeaderLocal
      description="Learn about DVP settlements and how to use this application safely"
      title="Help & information" />

      {/* Explanation of DVP */}
      <section className="mt-10 border-t border-interface-border pt-8 reading-content">
        <h2>What is Delivery Versus Payment (DVP)?</h2>
        <p className="mt-3 leading-relaxed w-full max-w-ch">Delivery Versus Payment is a financial settlement mechanism which ensures the simultaneous exchange of assets between multiple parties. It eliminates counterparty risk by guaranteeing that asset transfers only happen when all conditions are met.</p>
        <ul className="grid md:grid-cols-3 gap-4 mt-6">
          <li className="shadow-standard border border-interface-border bg-card-background p-6 rounded-lg">
            <h3 className="text-base font-medium">Multi-party</h3>
            <p className="mt-1 leading-relaxed">Many participants can be involved in a single settlement.</p>
          </li>
          <li className="shadow-standard border border-interface-border bg-card-background p-6 rounded-lg">
            <h3 className="text-base font-medium">Atomic</h3>
            <p className="mt-1 leading-relaxed">Either all transfers succeed together, or none happen at all.</p>
          </li>
          <li className="shadow-standard border border-interface-border bg-card-background p-6 rounded-lg">
            <h3 className="text-base font-medium">Secure</h3>
            <p className="mt-1 leading-relaxed">Assets are only transferred when every involved party approves.</p>
          </li>
        </ul>
      </section>

      {/* Why DVP? */}
      <section className="mt-10 border-t border-interface-border pt-8 reading-content">
        <h2>Why DVP?</h2>
        <h3 className="mt-8">The problem: Settlement risk</h3>
        <p className="mt-2 leading-relaxed w-full max-w-ch">Settlement risk occurs when one party fails to fulfill their side of a transaction. A famous example happened in 1974 with Germany's Herstatt Bank. The bank lost its banking license at 3:30pm German time, after receiving Deutsche Marks from US banks but before sending the corresponding US dollars. The US banks lost their money with no recourse.</p>
        <h3 className="mt-8">The blockchain solution</h3>
        <p className="mt-2 leading-relaxed w-full max-w-ch">Smart contracts act as a neutral escrow, linking asset transfers in one indivisible operation. This enables atomic swaps where either everyone gets exactly what they agreed to, or no transaction happens at all. If any part fails, the entire deal is automatically cancelled.</p>
        <h3 className="mt-8">No middlemen needed</h3>
        <p className="mt-2 leading-relaxed w-full max-w-ch">Unlike traditional DVP systems that require trusted intermediaries, blockchain-based DVP operates through publicly auditable, permissionless smart contracts. This brings risk mitigation to crypto markets without centralization or administrative control.</p>
      </section>

      {/* DVPeasy Features */}
      <section className="mt-10 border-t border-interface-border pt-8 reading-content">
        <h2>DVPeasy features</h2>
        <ul className="mt-6 grid md:grid-cols-2 gap-4">
          <li className="shadow-standard border border-interface-border bg-card-background p-6 rounded-lg">
            <h3 className="text-base font-medium">Permissionless & decentralized</h3>
            <p className="mt-1 leading-relaxed">Smart contracts have no owners, administrators, or privileged roles. Anyone can create and execute settlements.</p>
          </li>
          <li className="shadow-standard border border-interface-border bg-card-background p-6 rounded-lg">
            <h3 className="text-base font-medium">Non-upgradeable</h3>
            <p className="mt-1 leading-relaxed">The contract cannot be changed or removed as long as the blockchain continues running.</p>
          </li>
          <li className="shadow-standard border border-interface-border bg-card-background p-6 rounded-lg">
            <h3 className="text-base font-medium">No fees</h3>
            <p className="mt-1 leading-relaxed">Only blockchain gas fees apply. There are no protocol fees or charges from DVPeasy.</p>
          </li>
          <li className="shadow-standard border border-interface-border bg-card-background p-6 rounded-lg">
            <h3 className="text-base font-medium">Multi-asset support</h3>
            <p className="mt-1 leading-relaxed">Supports native tokens (ETH), ERC-20 tokens, and ERC-721 NFTs in a single settlement.</p>
          </li>
          <li className="shadow-standard border border-interface-border bg-card-background p-6 rounded-lg">
            <h3 className="text-base font-medium">Many potential parties</h3>
            <p className="mt-1 leading-relaxed">An arbitrary number of parties and assets (limited only by blockchain gas limits).</p>
          </li>
          <li className="shadow-standard border border-interface-border bg-card-background p-6 rounded-lg">
            <h3 className="text-base font-medium">Open source</h3>
            <p className="mt-1 leading-relaxed">The code for this app is available on <a className="link link-primary link-animated" href="https://github.com/tristan-mcdonald/dvpeasy" rel="noopener noreferrer" target="_blank">GitHub</a> for complete transparency.</p>
          </li>
        </ul>
      </section>

      {/* How DVP works */}
      <section className="mt-10 border-t border-interface-border pt-8 reading-content">
        <h2>How DVP settlements work</h2>
        <ol className="mt-2 list-decimal ml-4 marker:font-medium marker:text-text-label">
          <li className="mt-8">
            <h3 className="inline">Create settlement</h3>
            <p className="mt-2 leading-relaxed w-full max-w-ch">Add multiple token flows between different parties, to define who sends what to whom. Supported assets are native tokens (like ETH), ERC-20 tokens, and ERC-721 NFTs.</p>
          </li>
          <li className="mt-8">
            <h3 className="inline">Parties approve</h3>
            <p className="mt-2 leading-relaxed w-full max-w-ch">Each party confirms their participation and approves the amount of tokens that the DVP smart contract will spend to settle. If a party is promising to transfer a native token such as Ether, then that must be transferred to the DVP contract at approval time. The DVP contract holds this in escrow until the settlement is processed or expires (when it can be claimed back).</p>
          </li>
          <li className="mt-8">
            <h3 className="inline">Automatic execution</h3>
            <p className="mt-2 leading-relaxed w-full max-w-ch">Once all parties approve, the settlement executes automatically (or manually if configured).</p>
          </li>
          <li className="mt-8">
            <h3 className="inline">Assets transferred</h3>
            <p className="mt-2 leading-relaxed w-full max-w-ch">All token transfers happen simultaneously, in a single blockchain transaction.</p>
          </li>
        </ol>
      </section>

      {/* Getting started */}
      <section className="mt-10 border-t border-interface-border pt-8 reading-content">
        <h2>Getting started</h2>
        <ol className="mt-2 list-decimal ml-4 marker:font-medium marker:text-text-label">
          <li className="mt-8">
            <h3 className="inline">Connect your wallet</h3>
            <ol className="mt-2 list-decimal ml-4">
              <li className="mt-1 leading-relaxed">Click "Connect wallet" in the header</li>
              <li className="mt-1 leading-relaxed">Choose your wallet provider abstraction (MetaMask, WalletConnect, etc.)</li>
              <li className="mt-1 leading-relaxed">Ensure that you have gas tokens for transaction fees</li>
            </ol>
          </li>
          <li className="mt-8">
            <h3 className="inline">Select network</h3>
            <ol className="mt-2 list-decimal ml-4">
              <li className="mt-1 leading-relaxed">Click the network button in the header to select a network</li>
              <li className="mt-1 leading-relaxed">Use testnet for practice transactions (Sepolia, Arbitrum Sepolia)</li>
              <li className="mt-1 leading-relaxed">Use mainnet for real settlements (Polygon, Avalanche)</li>
            </ol>
          </li>
          <li className="mt-8">
            <h3 className="inline">Create your first settlement</h3>
            <ol className="mt-2 list-decimal ml-4">
              <li className="mt-1 leading-relaxed">Navigate to the "Create settlement" page from the link in the header navigation</li>
              <li className="mt-1 leading-relaxed">Add token flows specifying tokens, amounts, senders, and recipients</li>
              <li className="mt-1 leading-relaxed">Set an optional cutoff date after which the settlement expires and cannot be settled</li>
              <li className="mt-1 leading-relaxed">Review and create the settlement</li>
              <li className="mt-1 leading-relaxed">Share the settlement link with other involved parties so that they can review and settle</li>
            </ol>
          </li>
        </ol>
      </section>

      {/* Security best practices */}
      <section className="mt-10 border-t border-interface-border pt-8 reading-content">
        <h2>Security best practices</h2>
        <ul>
          <li>
            <h3 className="mt-8">Always verify smart contracts</h3>
            <ul className="mt-2 list-inside list-disc marker:text-text-label">
              <li className="leading-relaxed">Check that the DVP smart contract addresses match the official ones in the contract verification section below</li>
              <li className="mt-1 leading-relaxed">Use a third-party tool like <a className="link link-primary link-animated" href="https://etherscan.io" rel="noopener noreferrer" target="_blank">Etherscan</a> to verify the legitimacy of these smart contracts</li>
              <li className="mt-1 leading-relaxed">Verify that contracts are audited and open source</li>
              <li className="mt-1 leading-relaxed">Never interact with unverified contracts</li>
            </ul>
          </li>
          <li>
            <h3 className="mt-8">Review transactions carefully</h3>
            <ul className="mt-2 list-inside list-disc marker:text-text-label">
              <li className="leading-relaxed">Double-check recipient addresses before approving</li>
              <li className="mt-1 leading-relaxed">Verify token addresses and amounts</li>
              <li className="mt-1 leading-relaxed">Understand what you're approving in your wallet</li>
            </ul>
          </li>
          <li>
            <h3 className="mt-8">Start small</h3>
            <ul className="mt-2 list-inside list-disc marker:text-text-label">
              <li className="leading-relaxed">Test with small amounts of tokens first</li>
              <li className="mt-1 leading-relaxed">Use testnets for practice in using DVPeasy</li>
            </ul>
          </li>
        </ul>
      </section>

      {/* Contract verification */}
      <section className="mt-10 border-t border-interface-border pt-10">
        <h2>Contract verification</h2>
        <div
        className="mt-8 shadow-standard rounded-lg border border-attention bg-card-background py-5 px-6"
        role="alert">
          <p className="text-text-body">Always verify contract addresses against the official list of deployed addresses on <a className="link link-primary link-animated" href="https://github.com/tristan-mcdonald/dvpeasy#supported-networks" rel="noopener noreferrer" target="_blank">GitHub</a>.</p>
        </div>
        <ContractVerificationInfo />
      </section>

      {/* FAQ */}
      <section className="mt-10 border-t border-interface-border pt-8 reading-content">
        <h2>Frequently asked questions</h2>
        <ul>
          <li>
            <h3 className="mt-8">What happens if someone doesn't approve?</h3>
            <p className="mt-2 leading-relaxed w-full max-w-ch">The settlement will remain in pending status until all parties approve or the cutoff date is reached. After the cutoff date, parties can withdraw their approved tokens on the settlement page.</p>
          </li>
          <li>
            <h3 className="mt-8">Can I revoke my approval?</h3>
            <p className="mt-2 leading-relaxed w-full max-w-ch">Yes, you can revoke your token approvals at any time before the settlement executes. Use the "Revoke approval" button on the settlement page.</p>
          </li>
          <li>
            <h3 className="mt-8">What networks are supported?</h3>
            <p className="mt-2 leading-relaxed w-full max-w-ch">Currently DVPeasy supports the testnets Ethereum Sepolia and Base Sepolia, and the mainnets Ethereum and Base. If you'd like support for a new chain, please <a className="link link-primary link-animated" href="https://github.com/tristan-mcdonald/dvpeasy/issues" rel="noopener noreferrer" target="_blank">request it on GitHub</a></p>
          </li>
          <li>
            <h3 className="mt-8">Who is behind DVPeasy?</h3>
            <p className="mt-2 leading-relaxed w-full max-w-ch">DVPeasy is an open source project maintained by <a className="link link-primary link-animated" href="https://github.com/tristan-mcdonald" rel="noopener noreferrer" target="_blank">Tristan McDonald</a>. Contributions are welcome on <a className="link link-primary link-animated" href="https://github.com/tristan-mcdonald/dvpeasy" rel="noopener noreferrer" target="_blank">GitHub</a>.</p>
          </li>
        </ul>
      </section>

      {/* Support */}
      <section className="mt-10 border-t border-interface-border pt-8 reading-content">
        <h2>Need more help?</h2>
        <p className="mt-2 leading-relaxed w-full max-w-ch">If you encounter issues or have questions not covered here:</p>
        <ul className="mt-2 list-inside list-disc marker:text-text-label">
          <li className="leading-relaxed">Ensure that your wallet is connected to the correct network and contract</li>
          <li className="mt-1 leading-relaxed">Verify that you have sufficient gas tokens for transactions</li>
          <li className="mt-1 leading-relaxed">Check the browser console for error messages</li>
          <li className="mt-1 leading-relaxed">Try refreshing the page and reconnecting your wallet </li>
          <li className="mt-1 leading-relaxed">Raise an issue on <a className="link link-primary link-animated" href="https://github.com/tristan-mcdonald/dvpeasy/issues" rel="noopener noreferrer" target="_blank">GitHub</a></li>
        </ul>
      </section>
    </div>
  );
}
