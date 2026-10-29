import { Navigate, useParams } from 'react-router-dom';
import { savedSelection } from '../lib/saved-selection';
import { urlManager } from '../lib/url-manager';

/**
 * Redirects for paths without a network, to the same page on the user's last network and version.
 */

export function RedirectToDefaultDashboard () {
  const { networkId, version } = savedSelection.initial();
  return <Navigate to={urlManager.buildDashboardUrl(networkId, version)} replace />;
}

export function RedirectToDefaultCreate () {
  const { networkId, version } = savedSelection.initial();
  return <Navigate to={urlManager.buildCreateUrl(networkId, version)} replace />;
}

export function RedirectToDefaultSettlement () {
  const { id } = useParams<{ id: string }>();
  const { networkId, version } = savedSelection.initial();
  return <Navigate to={urlManager.buildSettlementUrl(networkId, version, id!)} replace />;
}
