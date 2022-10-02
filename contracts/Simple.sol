
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Box is Ownable {
  uint public storedValue;

  constructor() {
    storedValue = 0;
  }

  function setValue(uint newValue) external onlyOwner {
    storedValue = newValue;
  }
}

contract BoxUpgradeable is OwnableUpgradeable {
  uint public storedValue;

  function initialize() public initializer {
    storedValue = 0;
  }

  function setValue(uint newValue) external onlyOwner {
    storedValue = newValue;
  }
}

contract BoxUpgradeableV2 is OwnableUpgradeable {
  uint public storedValue;

  function initialize() public initializer {
    storedValue = 0;
  }

  function setValue(uint newValue) external onlyOwner {
    storedValue = newValue;
  }

  function getDoubleValue() external view returns (uint) {
    return storedValue * 2;
  }
}
