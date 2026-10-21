import { Navigate, useParams } from 'react-router-dom';
import { savedSelection } from '../lib/saved-selection';
import { urlManager } from '../lib/url-manager';

/**
 * Redirect to default dashboard route.
 */
export function RedirectToDefaultDashboard () {
  const { networkId, version } = savedSelection.initial();
  return <Navigate to={urlManager.buildDashboardUrl(networkId, version)} replace />;
}

/**
 * Redirect to default create settlement route.
 */
export function RedirectToDefaultCreate () {
  const { networkId, version } = savedSelection.initial();
  return <Navigate to={urlManager.buildCreateUrl(networkId, version)} replace />;
}

/**
 * Redirect to default settlement details route, preserving the settlement ID.
 */
export function RedirectToDefaultSettlement () {
  const { id } = useParams<{ id: string }>();
  const { networkId, version } = savedSelection.initial();
  return <Navigate to={urlManager.buildSettlementUrl(networkId, version, id!)} replace />;
}
