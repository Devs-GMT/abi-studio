// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title PanelRegistry — on-chain index of ABI Studio panels
/// @notice Stores who published a panel for which contract, and the IPFS CID of its ABI + layout.
///         The badge is a claim made by the publishing app; viewers must re-verify it.
contract PanelRegistry {
    struct Panel {
        address publisher;
        address target;
        uint32 chainId;
        string name;
        string cid;
        uint8 badge; // 0 none · 1 owner · 2 deployer
        uint32 opens; // reserved: opens are counted off-chain, always 0 here
        uint64 at;
        bool hidden;
    }

    uint256 public constant MAX_NAME = 40;
    uint256 public constant MAX_CID = 100;

    Panel[] public panels;
    mapping(address => uint256[]) private _panelsOfTarget;
    mapping(address => uint256[]) private _panelsBy;
    address public curator;

    event Published(uint256 indexed id, address indexed publisher, address indexed target);
    event Updated(uint256 indexed id);
    event HiddenSet(uint256 indexed id, bool hidden);
    event CuratorChanged(address indexed previousCurator, address indexed newCurator);

    error ZeroAddress();
    error BadName();
    error BadCid();
    error BadBadge();
    error NoCode();
    error UnknownPanel(uint256 id);
    error NotPublisher();
    error NotCurator();

    modifier onlyCurator() {
        if (msg.sender != curator) revert NotCurator();
        _;
    }

    constructor() {
        curator = msg.sender;
        emit CuratorChanged(address(0), msg.sender);
    }

    // ───────────────────────────── writes ─────────────────────────────

    function publish(address target, uint32 chainId, string calldata name, string calldata cid, uint8 badge)
        external
        returns (uint256 id)
    {
        if (target == address(0)) revert ZeroAddress();
        _checkText(name, cid);
        if (badge > 2) revert BadBadge();
        // Only verifiable for contracts on this chain; panels for other chains (e.g. testnet) skip it.
        if (chainId == block.chainid && target.code.length == 0) revert NoCode();

        id = panels.length;
        panels.push(
            Panel({
                publisher: msg.sender,
                target: target,
                chainId: chainId,
                name: name,
                cid: cid,
                badge: badge,
                opens: 0,
                at: uint64(block.timestamp),
                hidden: false
            })
        );
        _panelsOfTarget[target].push(id);
        _panelsBy[msg.sender].push(id);

        emit Published(id, msg.sender, target);
    }

    function update(uint256 id, string calldata name, string calldata cid) external {
        Panel storage p = _get(id);
        if (msg.sender != p.publisher) revert NotPublisher();
        _checkText(name, cid);
        p.name = name;
        p.cid = cid;
        emit Updated(id);
    }

    function setHidden(uint256 id, bool hidden) external onlyCurator {
        _get(id).hidden = hidden;
        emit HiddenSet(id, hidden);
    }

    function setCurator(address newCurator) external onlyCurator {
        if (newCurator == address(0)) revert ZeroAddress();
        emit CuratorChanged(curator, newCurator);
        curator = newCurator;
    }

    // ───────────────────────────── views ─────────────────────────────

    function total() external view returns (uint256) {
        return panels.length;
    }

    function getPanel(uint256 id) external view returns (Panel memory) {
        return _get(id);
    }

    /// @notice Returns up to `count` panels starting at `from` (inclusive). Includes hidden ones;
    ///         the UI filters them. Out-of-range `from` returns an empty array.
    function getPanels(uint256 from, uint256 count) external view returns (Panel[] memory out) {
        uint256 len = panels.length;
        if (from >= len) return new Panel[](0);
        uint256 end = from + count;
        if (end > len) end = len;
        out = new Panel[](end - from);
        for (uint256 i = from; i < end; i++) {
            out[i - from] = panels[i];
        }
    }

    function panelsFor(address target) external view returns (uint256[] memory) {
        return _panelsOfTarget[target];
    }

    function panelsOfPublisher(address publisher) external view returns (uint256[] memory) {
        return _panelsBy[publisher];
    }

    // ───────────────────────────── internal ─────────────────────────────

    function _get(uint256 id) private view returns (Panel storage) {
        if (id >= panels.length) revert UnknownPanel(id);
        return panels[id];
    }

    function _checkText(string calldata name, string calldata cid) private pure {
        uint256 n = bytes(name).length;
        if (n == 0 || n > MAX_NAME) revert BadName();
        uint256 c = bytes(cid).length;
        if (c == 0 || c > MAX_CID) revert BadCid();
    }
}
