import { urlManager } from '../lib/url-manager';
import { Navigate, useParams } from 'react-router-dom';

/**
 * Redirect to default dashboard route.
 */
export function RedirectToDefaultDashboard () {
  const { networkId, version } = urlManager.defaultNetworkAndVersion();
  return <Navigate to={`/${networkId}/${version}`} replace />;
}

/**
 * Redirect to default create settlement route.
 */
export function RedirectToDefaultCreate () {
  const { networkId, version } = urlManager.defaultNetworkAndVersion();
  return <Navigate to={`/${networkId}/${version}/create`} replace />;
}

/**
 * Redirect to default settlement details route, preserving the settlement ID.
 */
export function RedirectToDefaultSettlement () {
  const { id } = useParams<{ id: string }>();
  const { networkId, version } = urlManager.defaultNetworkAndVersion();
  return <Navigate to={`/${networkId}/${version}/settlement/${id}`} replace />;
}
