import LogoHeader from './LogoHeader';
import NavigationLink from './NavigationLink';
import SettingsNetworkWalletSection from './SettingsNetworkWalletSection';
import { getNavigationItems } from '../config/navigation';
import { Menu, X } from 'lucide-react';
import { useCurrentNetworkPath } from '../hooks/useCurrentNetworkPath';
import { useMobileMenu } from '../hooks/useMobileMenu';

export default function HeaderGlobal () {
  const { isMobileMenuOpen, openMobileMenu, closeMobileMenu } = useMobileMenu();
  const currentDashboardPath = useCurrentNetworkPath();

  // Build create settlement path from dashboard path.
  const pathSegments = currentDashboardPath.split('/').filter(Boolean);
  const createSettlementPath = pathSegments.length === 2
    ? `/${pathSegments[0]}/${pathSegments[1]}/create`
    : '/create';

  const navigationItems = getNavigationItems(currentDashboardPath, createSettlementPath);

  return (
    <>
      <header className="container mx-auto border-b border-interface-border pt-[3px]">

        {/* Large viewport header */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_auto_1fr] gap-6 items-center">
          <LogoHeader className="justify-self-start text-xl" to={currentDashboardPath} />
          <nav
          aria-label="Primary navigation"
          className="flex items-center justify-center"
          role="navigation">
            {navigationItems.map((item) => (
              <NavigationLink
              key={item.to}
              to={item.to}
              icon={item.icon}
              isActivePathPredicate={item.isActivePathPredicate}
              variant="desktop">
                {item.label}
              </NavigationLink>
            ))}
          </nav>
          <SettingsNetworkWalletSection />
        </div>

        {/* Small viewport header */}
        <div className="flex lg:hidden items-center justify-between py-4">
          <LogoHeader to={currentDashboardPath} />
          <button
          aria-controls="mobile-nav-modal"
          aria-expanded={isMobileMenuOpen}
          aria-haspopup="dialog"
          className="text-primary"
          onClick={openMobileMenu}
          type="button">
            <Menu className="size-8"/>
          </button>
        </div>
      </header>

      {/* Small viewport navigation dialog */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6"
          onClick={closeMobileMenu}>
          <div
            className="shadow-standard border border-interface-border rounded-lg w-full max-w-md bg-body-background px-6"
            onClick={(event) => event.stopPropagation()}>

            {/* Logo & close button */}
            <div className="flex justify-between items-center border-b border-interface-border py-6">
              <LogoHeader size="mobile" className="" to={currentDashboardPath} />
              <button
                type="button"
                className="transition-colors cursor-pointer text-primary hover:text-primary-interaction p-1"
                aria-label="Close"
                onClick={closeMobileMenu}>
                <X className="size-6"/>
              </button>
            </div>

            {/* Navigation */}
            <nav
              aria-label="Mobile navigation"
              className="flex flex-col space-y-6 py-6"
              role="navigation">
              {navigationItems.map((item) => (
                <NavigationLink
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  isActivePathPredicate={item.isActivePathPredicate}
                  variant="mobile">
                  {item.label}
                </NavigationLink>
              ))}
            </nav>

            {/* Settings, network selection & wallet connection */}
            <SettingsNetworkWalletSection className="flex items-center border-t border-interface-border py-6" />
          </div>
        </div>
      )}
    </>
  );
}
