import { arrayMove } from '@dnd-kit/sortable';
import { FlowDraft } from '../types/settlement';
import { useState } from 'react';

/**
 * The create form's list of flows, and which one the flow dialog is adding or editing.
 */
export function useFlowManagement (initialFlows: FlowDraft[] = []) {
  const [flows, setFlows] = useState<FlowDraft[]>(initialFlows);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlowIndex, setEditingFlowIndex] = useState<number | null>(null);

  const handleAddFlow = () => {
    setEditingFlowIndex(null);
    setIsModalOpen(true);
  };

  const handleEditFlow = (index: number) => {
    setEditingFlowIndex(index);
    setIsModalOpen(true);
  };

  const handleSaveFlow = (flow: FlowDraft) => {
    if (editingFlowIndex !== null) {
      setFlows(flows.map((f, i) => i === editingFlowIndex ? flow : f));
    } else {
      setFlows([...flows, flow]);
    }
    setIsModalOpen(false);
    setEditingFlowIndex(null);
  };

  const handleRemoveFlow = (index: number) => {
    setFlows(flows.filter((_, i) => i !== index));
  };

  const handleReorderFlows = (oldIndex: number, newIndex: number) => {
    setFlows(arrayMove(flows, oldIndex, newIndex));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFlowIndex(null);
  };

  return {
    flows,
    isModalOpen,
    editingFlowIndex,

    handleAddFlow,
    handleEditFlow,
    handleSaveFlow,
    handleRemoveFlow,
    handleReorderFlows,
    handleCloseModal,

    editingFlow: editingFlowIndex !== null ? flows[editingFlowIndex] : undefined,
  };
}
