/** PanelRegistry ABI (human-readable; verified to parse with ethers v6). See docs/CONTRACT.md. */
const PANEL = 'tuple(address publisher, address target, uint32 chainId, string name, string cid, uint8 badge, uint32 opens, uint64 at, bool hidden)'

export const REGISTRY_ABI = [
  'function publish(address target, uint32 chainId, string name, string cid, uint8 badge) returns (uint256 id)',
  'function update(uint256 id, string name, string cid)',
  'function setHidden(uint256 id, bool hidden)',
  'function setCurator(address newCurator)',
  'function total() view returns (uint256)',
  'function curator() view returns (address)',
  `function getPanel(uint256 id) view returns (${PANEL})`,
  `function getPanels(uint256 from, uint256 count) view returns (${PANEL}[])`,
  'function panelsFor(address target) view returns (uint256[])',
  'function panelsOfPublisher(address publisher) view returns (uint256[])',
  'function MAX_NAME() view returns (uint256)',
  'function MAX_CID() view returns (uint256)',
  'event Published(uint256 indexed id, address indexed publisher, address indexed target)',
  'event Updated(uint256 indexed id)',
  'event HiddenSet(uint256 indexed id, bool hidden)',
  'event CuratorChanged(address indexed previousCurator, address indexed newCurator)',
  'error ZeroAddress()',
  'error BadName()',
  'error BadCid()',
  'error BadBadge()',
  'error NoCode()',
  'error UnknownPanel(uint256 id)',
  'error NotPublisher()',
  'error NotCurator()',
] as const
