// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AbiPlayground — a testnet contract that exercises every input type ABI Studio supports.
/// @notice For manual testing only (BOT Chain testnet). Not audited, holds only test BOT.
contract AbiPlayground {
    struct Config {
        address recipient;
        uint96 amount;
        bool active;
    }

    address public owner;
    string public name = "ABI Playground";
    bool public isOpen = true;
    uint64 public closesAt;
    uint256 public totalVotes;
    uint256[4] private _results;
    mapping(address => uint256) public votesOf;
    uint256[] private _values;
    Config private _config;
    bytes32 public lastTag;
    string[4] private _options = ["Nasi goreng", "Mie ayam", "Sate", "Bakso"];

    event Voted(address indexed voter, uint8 option);
    event Signed(address indexed who, string note);
    event Tipped(address indexed from, uint256 amount);
    event ValuesSet(address indexed who, uint256 count);
    event ConfigSet(address indexed recipient, uint96 amount, bool active);
    event Tagged(bytes32 tag);
    event OpenChanged(bool isOpen);

    error InvalidOption(uint8 option);
    error NotOpen(uint64 closesAt);
    error NotOwner();
    error EmptyNote();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
        closesAt = uint64(block.timestamp + 30 days);
    }

    // ───────── reads ─────────
    function options(uint8 index) external view returns (string memory) {
        if (index > 3) revert InvalidOption(index);
        return _options[index];
    }

    function results() external view returns (uint256[4] memory) {
        return _results;
    }

    function values() external view returns (uint256[] memory) {
        return _values;
    }

    function config() external view returns (Config memory) {
        return _config;
    }

    function info() external view returns (string memory title, uint256 votes, bool open, uint64 deadline, address admin) {
        return (name, totalVotes, isOpen, closesAt, owner);
    }

    // ───────── writes ─────────
    function vote(uint8 option) external {
        if (!isOpen) revert NotOpen(closesAt);
        if (option > 3) revert InvalidOption(option);
        _results[option]++;
        votesOf[msg.sender]++;
        totalVotes++;
        emit Voted(msg.sender, option);
    }

    function sign(string calldata note) external {
        if (bytes(note).length == 0) revert EmptyNote();
        emit Signed(msg.sender, note);
    }

    function tip() external payable {
        emit Tipped(msg.sender, msg.value);
    }

    function setValues(uint256[] calldata newValues) external {
        _values = newValues;
        emit ValuesSet(msg.sender, newValues.length);
    }

    function setConfig(Config calldata c) external {
        _config = c;
        emit ConfigSet(c.recipient, c.amount, c.active);
    }

    function tag(bytes32 t) external {
        lastTag = t;
        emit Tagged(t);
    }

    function failWithReason() external pure {
        revert("This always fails: plain require message");
    }

    function failWithPanic(uint256 a) external pure returns (uint256) {
        return 10 / a; // a = 0 → Panic 0x12
    }

    // ───────── admin (owner only) ─────────
    function setOpen(bool open) external onlyOwner {
        isOpen = open;
        emit OpenChanged(open);
    }

    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
