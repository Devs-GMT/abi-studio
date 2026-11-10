/** Template ABIs in human-readable form (parsed with lib/abi/parse). */

export interface AbiTemplate {
  id: 'erc20' | 'erc721' | 'ownable' | 'launchpad'
  name: string
  description: string
  lines: string[]
}

export const TEMPLATES: AbiTemplate[] = [
  {
    id: 'erc20',
    name: 'ERC-20',
    description: 'Fungible token: balances, transfers, allowances',
    lines: [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)',
      'function totalSupply() view returns (uint256)',
      'function balanceOf(address account) view returns (uint256)',
      'function allowance(address owner, address spender) view returns (uint256)',
      'function transfer(address to, uint256 amount) returns (bool)',
      'function approve(address spender, uint256 amount) returns (bool)',
      'function transferFrom(address from, address to, uint256 amount) returns (bool)',
      'event Transfer(address indexed from, address indexed to, uint256 value)',
      'event Approval(address indexed owner, address indexed spender, uint256 value)',
    ],
  },
  {
    id: 'erc721',
    name: 'ERC-721',
    description: 'NFT collection: owners, approvals, transfers',
    lines: [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function balanceOf(address owner) view returns (uint256)',
      'function ownerOf(uint256 tokenId) view returns (address)',
      'function tokenURI(uint256 tokenId) view returns (string)',
      'function getApproved(uint256 tokenId) view returns (address)',
      'function isApprovedForAll(address owner, address operator) view returns (bool)',
      'function supportsInterface(bytes4 interfaceId) view returns (bool)',
      'function approve(address to, uint256 tokenId)',
      'function setApprovalForAll(address operator, bool approved)',
      'function transferFrom(address from, address to, uint256 tokenId)',
      'function safeTransferFrom(address from, address to, uint256 tokenId)',
      'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
      'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
      'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
    ],
  },
  {
    id: 'ownable',
    name: 'Ownable',
    description: 'Owner checks and ownership transfer',
    lines: [
      'function owner() view returns (address)',
      'function transferOwnership(address newOwner)',
      'function renounceOwnership()',
      'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
      'error OwnableUnauthorizedAccount(address account)',
      'error OwnableInvalidOwner(address owner)',
    ],
  },
  {
    id: 'launchpad',
    name: 'Launchpad',
    description: 'Token sale: buy with BOT, claim, finalize',
    lines: [
      'function token() view returns (address)',
      'function owner() view returns (address)',
      'function price() view returns (uint256)',
      'function hardCap() view returns (uint256)',
      'function totalRaised() view returns (uint256)',
      'function startTime() view returns (uint64)',
      'function endTime() view returns (uint64)',
      'function contributions(address buyer) view returns (uint256)',
      'function claimable(address buyer) view returns (uint256)',
      'function finalized() view returns (bool)',
      'function buy() payable',
      'function claim()',
      'function finalize()',
      'function withdrawRaised(address to)',
      'event Bought(address indexed buyer, uint256 paid, uint256 tokens)',
      'event Claimed(address indexed buyer, uint256 tokens)',
      'event Finalized(uint256 totalRaised)',
      'error SaleNotActive(uint64 startTime, uint64 endTime)',
      'error HardCapReached(uint256 hardCap)',
      'error NothingToClaim()',
    ],
  },
]

export function getTemplate(id: string) {
  return TEMPLATES.find((t) => t.id === id)
}
