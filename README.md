# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Unit tests aim for 100% coverage. Tests that are not covered:
- Setting a 0 address in Escrow constructor (too difficult to test, since deploy scripts are run before testing suite)
- loseItem function in Escrow (unsure if this modifier is relevant/needed in final implementation, but wanted to limit to some degree for testing other functions)
- 
