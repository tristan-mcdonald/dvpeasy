import CreateSettlementActions from '../components/CreateSettlement/CreateSettlementActions';
import FlowModal from '../components/FlowModal';
import HeaderLocal from '../components/HeaderLocal';
import SettlementDetailsForm from '../components/CreateSettlement/SettlementDetailsForm';
import SettlementFlows from '../components/SettlementFlows';
import { FormEvent } from 'react';
import { useFlowManagement } from '../hooks/useFlowManagement';
import { useNetworkSync } from '../hooks/useNetworkSync';
import { useSettlementCreation } from '../hooks/useSettlementCreation';
import { useSettlementForm } from '../hooks/useSettlementForm';
import { useTokenMetadata } from '../hooks/useTokenMetadata';
import { useWalletClient } from 'wagmi';

export default function CreateSettlement () {
  const { data: walletClient } = useWalletClient();

  // Handle network/version synchronization from URL with auto-sync enabled.
  useNetworkSync({ autoSync: true });
  // Custom hooks for managing different aspects of the component.
  const flowManagement = useFlowManagement();
  const settlementForm = useSettlementForm();
  const { isLoading, createSettlement, isConnected } = useSettlementCreation();

  // Get token metadata for displaying token info.
  const tokenMetadata = useTokenMetadata(flowManagement.flows);

  /**
   * Handle form submission.
   */
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    await createSettlement(
      flowManagement.flows,
      settlementForm.cutoffDate,
      settlementForm.reference,
      settlementForm.isAutoSettled,
    );
  };

  if (!isConnected) {
    return (
      <HeaderLocal
      centerVertically={true}
      description="Please connect your wallet to create a settlement"
      title="Connect your wallet"/>
    );
  }

  return (
    <div className="w-full pb-12">
      <HeaderLocal
      description="Create a new DVP settlement with multiple token flows"
      title="Create settlement"/>

      {/* Settlement creation guidance */}
      {flowManagement.flows.length === 0 && (
        <div className="mx-auto max-w-5xl bg-card-background border border-interface-border rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-medium mb-1">How to create a DVP settlement</h2>
                <p>DVP settlements allow secure, atomic exchanges between multiple parties.</p>
              </div>

              <ul className="grid md:grid-cols-3 gap-4">
                <li className="flex items-start gap-3">
                  <div className="bg-attention-subtle rounded-full size-6 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5 text-text-heading">1</div>
                  <div>
                    <h4 className="font-medium mb-1">Add token flows</h4>
                    <p className="text-sm">Define who sends which tokens to whom. Each flow specifies a sender, a receiver, a token, and an amount.</p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="bg-attention-subtle rounded-full size-6 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5 text-text-heading">2</div>
                  <div>
                    <h4 className="font-medium mb-1">Define settlement details</h4>
                    <p className="text-sm">Add an optional cutoff date, an optional reference, (publically visible) and choose either auto-settlement or manual execution.</p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="bg-attention-subtle rounded-full size-6 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5 text-text-heading">3</div>
                  <div>
                    <h4 className="font-medium mb-1">Create settlement & share</h4>
                    <p className="text-sm">Create the settlement, and share the URL with other parties so they can approve.</p>
                  </div>
                </li>
              </ul>
              <p>All parties must approve before the settlement can execute.</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <SettlementFlows
          flows={flowManagement.flows}
          isEditMode={true}
          onAddFlow={flowManagement.handleAddFlow}
          onEditFlow={flowManagement.handleEditFlow}
          onRemoveFlow={flowManagement.handleRemoveFlow}
          onReorderFlows={flowManagement.handleReorderFlows}
          tokenMetadata={tokenMetadata}
          walletClient={walletClient} />
        </div>

        <SettlementDetailsForm
        cutoffDate={settlementForm.cutoffDate}
        setCutoffDate={settlementForm.setCutoffDate}
        reference={settlementForm.reference}
        setReference={settlementForm.setReference}
        isAutoSettled={settlementForm.isAutoSettled}
        setIsAutoSettled={settlementForm.setIsAutoSettled} />

        <CreateSettlementActions
        isLoading={isLoading} />
      </form>

      <FlowModal
      flow={flowManagement.editingFlow}
      isOpen={flowManagement.isModalOpen}
      onClose={flowManagement.handleCloseModal}
      onSave={flowManagement.handleSaveFlow}
      title={flowManagement.editingFlowIndex !== null ? 'Edit token flow' : 'Add a token flow'} />
    </div>
  );
}
