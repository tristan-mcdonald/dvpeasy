import Address from './scaffold-eth/Address';
import { NETWORKS } from '../config/networks';
import { useContractConfig } from '../hooks/useContractConfig';

/**
 * Component that displays smart contract addresses for verification.
 * Shows DVP and DVP Helper contract addresses with links to block explorers.
 */
export default function ContractVerificationInfo () {
  const { config } = useContractConfig();
  const network = config.networkId ? NETWORKS[config.networkId] : undefined;

  if (!network || !config.version) {
    return null;
  }


  const contractLinks = [
    {
      name: 'DVP Contract',
      address: config.dvpAddress,
      description: 'Main settlement contract handling all DVP logic',
    },
    {
      name: 'DVP Helper Contract',
      address: config.dvpHelperAddress,
      description: 'Helper contract for batch operations and utilities',
    },
  ];

  return (
    <div className="mt-6 shadow-standard border border-interface-border rounded-lg bg-card-background p-6">
      <h3>Contract details</h3>
      <dl className="mt-4">
        <div className="flex flex-row gap-2">
          <dt className="flex-[0_0_6rem] font-medium">Network:</dt>
          <dd>{network.displayName}</dd>
        </div>
        <div className="mt-2 flex flex-row gap-2">
          <dt className="flex-[0_0_6rem] font-medium">Version:</dt>
          <dd>{config.version.tag}</dd>
        </div>
        <div className="mt-2 flex flex-row gap-2">
          <dt className="flex-[0_0_6rem] font-medium">Deployed:</dt>
          <dd>{config.version.deploymentDate}</dd>
        </div>
      </dl>

      {contractLinks.map((contract) => (
        <div
        className="mt-6"
        key={contract.name}>
          <h4>{contract.name}</h4>
          <p className="mt-2 leading-relaxed w-full max-w-ch">{contract.description}.</p>
          <div className="mt-2">
            <Address
            address={contract.address}
            showFull={true} />
          </div>
        </div>
      ))}

      <div className="mt-6">
        <h3>How to verify</h3>
        <ul className="mt-2 list-inside list-disc">
          <li className="leading-relaxed">Click "View on explorer" to open the contract on the block explorer</li>
          <li className="mt-1 leading-relaxed">Check that the contract is verified (green checkmark)</li>
          <li className="mt-1 leading-relaxed">Review the contract source code and constructor parameters</li>
          <li className="mt-1 leading-relaxed">Ensure that the deployment date matches the version information above</li>
          <li className="mt-1 leading-relaxed">Never interact with unverified contracts</li>
        </ul>
      </div>
    </div>
  );
}
