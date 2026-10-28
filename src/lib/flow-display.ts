import { Flow, FlowDraft, FlowForDisplay } from '../types/settlement';
import { TokenMetadata } from './token-metadata';
import { tokenManager } from './token-manager';

/**
 * Building the flows which the flow cards and the graph show, from a settlement or from the form.
 */
export const flowDisplay = {
  fromContract (flow: Flow, metadata: TokenMetadata | undefined): FlowForDisplay {
    return {
      token: flow.token,
      from: flow.from,
      to: flow.to,
      amount: tokenManager.formatAmount(flow.amountOrId, metadata),
      nftId: this.nftId(flow),
    };
  },

  fromDraft ({ token, from, to, amount, isNFT }: FlowDraft): FlowForDisplay {
    return { token, from, to, amount, nftId: isNFT ? amount : undefined };
  },

  nftId (flow: Flow): string | undefined {
    return flow.isNFT ? flow.amountOrId.toString() : undefined;
  },

  /**
   * The first NFT's ID in each collection, by the collection's address in lower case, to show as
   * the collection's image.
   */
  collectionPreviews (flows: Pick<FlowForDisplay, 'token' | 'nftId'>[]): Record<string, string> {
    const collectionPreviews: Record<string, string> = {};
    for (const { token, nftId } of flows) {
      if (nftId !== undefined) collectionPreviews[token.toLowerCase()] ??= nftId;
    }
    return collectionPreviews;
  },
};
