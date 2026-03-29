import { Flow } from '../types/settlement';
import { useState } from 'react';

/**
 * Hook for managing flows in settlement creation.
 * Handles CRUD operations and modal state for flows.
 */
export function useFlowManagement (initialFlows: Flow[] = []) {
  const [flows, setFlows] = useState<Flow[]>(initialFlows);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlowIndex, setEditingFlowIndex] = useState<number | null>(null);

  /**
   * Handle opening modal for adding new flow.
   */
  const handleAddFlow = () => {
    setEditingFlowIndex(null);
    setIsModalOpen(true);
  };

  /**
   * Handle opening modal for editing existing flow.
   */
  const handleEditFlow = (index: number) => {
    setEditingFlowIndex(index);
    setIsModalOpen(true);
  };

  /**
   * Handle saving flow from modal.
   */
  const handleSaveFlow = (flow: Flow) => {
    if (editingFlowIndex !== null) {
      // Update existing flow.
      setFlows(flows.map((f, i) => i === editingFlowIndex ? flow : f));
    } else {
      // Add new flow.
      setFlows([...flows, flow]);
    }
    setIsModalOpen(false);
    setEditingFlowIndex(null);
  };

  /**
   * Handle removing flow.
   */
  const handleRemoveFlow = (index: number) => {
    setFlows(flows.filter((_, i) => i !== index));
  };

  /**
   * Handle reordering flows.
   */
  const handleReorderFlows = (reorderedFlows: Flow[]) => {
    setFlows(reorderedFlows);
  };

  /**
   * Close modal without saving.
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFlowIndex(null);
  };

  return {
    // State
    flows,
    isModalOpen,
    editingFlowIndex,

    // Actions
    handleAddFlow,
    handleEditFlow,
    handleSaveFlow,
    handleRemoveFlow,
    handleReorderFlows,
    handleCloseModal,

    // Computed values
    editingFlow: editingFlowIndex !== null ? flows[editingFlowIndex] : undefined,
  };
}
