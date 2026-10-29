import React from 'react';
import { ContractVersion } from '../config/contracts/deployments';

interface ContractDeploymentDateProps {
  version: ContractVersion;
}

/**
 * The date a contract version was deployed, as recorded in its configuration.
 */
export default function ContractDeploymentDate ({ version }: ContractDeploymentDateProps) {
  if (!version.deploymentDate) {
    return null;
  }

  const displayDate = new Date(version.deploymentDate).toLocaleDateString();

  return (
    <div className="flex gap-2">
      <dt className="flex-[0_0_5.8rem] font-medium">Deployed:</dt>
      <dd>{displayDate}</dd>
    </div>
  );
}
