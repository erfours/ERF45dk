import { toHex } from '../api/util';
import {
  RawContractBaseNft,
  RawGetNftSalesResponse,
  RawNft,
  RawNftCollection,
  RawNftContract,
  RawNftContractForNft,
  RawNftContractForOwner,
  RawOwnedBaseNft
} from '../internal/raw-interfaces';
import {
  BaseNft,
  GetNftSalesResponse,
  Nft,
  NftCollection,
  NftCollectionMarketplace,
  NftContract,
  NftContractForNft,
  NftContractForOwner,
  NftSaleMarketplace,
  NftSaleTakerType,
  NftSpamClassification,
  NftTokenType
} from '../types/nft-types';
import { OpenSeaSafelistRequestStatus } from '../types/types';

export function formatBlock(block: string | number): string {
  if (typeof block === 'string') {
    return block;
  } else if (Number.isInteger(block)) {
    return toHex(block);
  }
  return block.toString();
}

function stringToEnum<T extends string>(
  x: string,
  enumb: Record<string, T>
): T | null {
  return Object.values(enumb).includes(x as T) ? (x as T) : null;
}

export function getNftContractForNftFromRaw(
  rawNftContract: RawNftContractForNft
): NftContractForNft {
  return nullsToUndefined<NftContractForNft>({
    ...getNftContractFromRaw(rawNftContract),
    spamClassifications: rawNftContract.spamClassifications.map(
      parseNftSpamClassification
    )
  });
}

export function getNftContractsForOwnerFromRaw(
  rawNftContract: RawNftContractForOwner
): NftContractForOwner {
  return nullsToUndefined<NftContractForOwner>({
    ...getNftContractFromRaw(rawNftContract),
    displayNft: rawNftContract.displayNft,
    image: rawNftContract.image,
    totalBalance: rawNftContract.totalBalance,
    numDistinctTokensOwned: rawNftContract.numDistinctTokensOwned,
    isSpam: rawNftContract.isSpam
  });
}

export function getNftContractFromRaw(
  rawNftContract: RawNftContract
): NftContract {
  return nullsToUndefined<NftContract>({
    ...rawNftContract,
    tokenType: parseNftTokenType(rawNftContract.tokenType),
    openSeaMetadata: {
      ...rawNftContract.openSeaMetadata,
      safelistRequestStatus:
        rawNftContract.openSeaMetadata.safelistRequestStatus !== null
          ? stringToEnum(
              rawNftContract.openSeaMetadata.safelistRequestStatus,
              OpenSeaSafelistRequestStatus
            )
          : null
    }
  });
}

export function getNftCollectionFromRaw(
  rawNftCollection: RawNftCollection
): NftCollection {
  return nullsToUndefined<NftCollection>({
    ...rawNftCollection,
    floorPrice: {
      ...rawNftCollection.floorPrice,
      marketplace: parseNftCollectionMarketplace(
        rawNftCollection.floorPrice.marketplace
      )
    }
  });
}

export function getBaseNftFromRaw(rawBaseNft: RawOwnedBaseNft): BaseNft;
export function getBaseNftFromRaw(
  rawContractBaseNft: RawContractBaseNft,
  contractAddress: string
): BaseNft;
export function getBaseNftFromRaw(
  rawBaseNft: RawOwnedBaseNft | RawContractBaseNft,
  contractAddress?: string
): BaseNft {
  return {
    contractAddress: contractAddress
      ? contractAddress
      : (rawBaseNft as RawOwnedBaseNft).contractAddress,
    tokenId: rawBaseNft.tokenId
  };
}

export function getNftFromRaw(rawNft: RawNft): Nft {
  return nullsToUndefined<Nft>({
    ...rawNft,
    contract: getNftContractForNftFromRaw(rawNft.contract),
    tokenType: parseNftTokenType(rawNft.tokenType),
    acquiredAt: rawNft.acquiredAt,
    collection: rawNft.collection,
    mint: rawNft.mint
  });
}

export function getNftSalesFromRaw(
  rawNftSales: RawGetNftSalesResponse
): GetNftSalesResponse {
  return nullsToUndefined<GetNftSalesResponse>({
    nftSales: rawNftSales.nftSales.map(rawNftSale => ({
      ...rawNftSale,
      marketplace: parseNftSaleMarketplace(rawNftSale.marketplace),
      taker: parseNftTaker(rawNftSale.taker)
    })),
    validAt: rawNftSales.validAt,
    pageKey: rawNftSales.pageKey
  });
}

function parseNftSaleMarketplace(marketplace: string): NftSaleMarketplace {
  switch (marketplace) {
    case 'looksrare':
      return NftSaleMarketplace.LOOKSRARE;
    case 'seaport':
      return NftSaleMarketplace.SEAPORT;
    case 'x2y2':
      return NftSaleMarketplace.X2Y2;
    case 'wyvern':
      return NftSaleMarketplace.WYVERN;
    case 'cryptopunks':
      return NftSaleMarketplace.CRYPTOPUNKS;
    case 'blur':
      return NftSaleMarketplace.BLUR;
    default:
      return NftSaleMarketplace.UNKNOWN;
  }
}

function parseNftCollectionMarketplace(
  marketplace: string | null
): NftCollectionMarketplace | undefined {
  switch (marketplace) {
    case 'OpenSea':
      return NftCollectionMarketplace.OPENSEA;
    default:
      return undefined;
  }
}

function parseNftTaker(taker: string): NftSaleTakerType {
  // The `.toLowerCase()` call is needed because the API returns the capitalized values
  switch (taker.toLowerCase()) {
    case 'buyer':
      return NftSaleTakerType.BUYER;
    case 'seller':
      return NftSaleTakerType.SELLER;
    default:
      throw new Error(`Unsupported NftSaleTakerType ${taker}`);
  }
}

function parseNftSpamClassification(s: string): NftSpamClassification {
  const res = stringToEnum(s, NftSpamClassification);
  if (res == null) {
    return NftSpamClassification.Unknown;
  }

  return res;
}

function parseNftTokenType(tokenType: string | undefined): NftTokenType {
  switch (tokenType) {
    case 'erc721':
    case 'ERC721':
      return NftTokenType.ERC721;
    case 'erc1155':
    case 'ERC1155':
      return NftTokenType.ERC1155;
    case 'no_supported_nft_standard':
    case 'NO_SUPPORTED_NFT_STANDARD':
      return NftTokenType.NO_SUPPORTED_NFT_STANDARD;
    case 'not_a_contract':
    case 'NOT_A_CONTRACT':
      return NftTokenType.NOT_A_CONTRACT;
    default:
      return NftTokenType.UNKNOWN;
  }
}

export const IS_BROWSER = typeof window !== 'undefined' && window !== null;

type WithNullableFields<T> = T extends undefined
  ? null | undefined
  : T extends (infer U)[]
  ? WithNullableFields<U>[]
  : T extends object
  ? {
      [K in keyof T]: WithNullableFields<T[K]>;
    }
  : T;

export function nullsToUndefined<U>(obj: WithNullableFields<U>): U {
  if (obj === null || obj === undefined) {
    return undefined as any;
  }

  if ((obj as any).constructor.name === 'Object' || Array.isArray(obj)) {
    for (const key in obj) {
      (obj as any)[key] = nullsToUndefined((obj as any)[key]);
    }
  }
  return obj as any;
}
