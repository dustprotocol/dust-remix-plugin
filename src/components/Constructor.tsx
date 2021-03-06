import React, { useEffect, useState } from "react";
import { Contract } from "ethers";
import { useDispatch, useSelector } from "react-redux";
import { StateType } from "../store/reducers";
import Deploy from "./Deploy";
import DeployedContracts from "./DeployedContracts";
import Copy from "./common/Copy";
import { formatEther } from "ethers/lib/utils";
import { BigNumber } from "ethers";
import { signersSelect } from "../store/actions/signers";
import { findSigner } from "../utils";
import { ContractHolder, RemixSigner } from "../store/localState";
import { CompiledContractReducer } from "../store/reducers/compiledContracts";
import {
  contractAddMultiple,
  contractRemoveAll,
} from "../store/actions/contracts";

const bigNumberToString = (num: BigNumber): string => {
  const value = formatEther(num);
  const point = value.indexOf(".");
  return value.slice(0, point + 3);
};

const updateContracts = (
  signer: RemixSigner,
  oldContracts: ContractHolder[],
  compiledContracts: CompiledContractReducer
): ContractHolder[] =>
  oldContracts.map(({ name, contract }) => ({
    name,
    contract: new Contract(
      contract.address,
      compiledContracts.contracts[name].payload.abi,
      signer.signer
    ),
  }));

const Constructor = () => {
  const dispatch = useDispatch();
  const { signers, index } = useSelector((state: StateType) => state.signers);
  const { contracts: oldContracts } = useSelector(
    (state: StateType) => state.contracts
  );
  const compiledContracts = useSelector(
    (state: StateType) => state.compiledContracts
  );
  const { contracts } = compiledContracts;
  const [selectedContract, setSelectedContract] = useState("");

  const account = index === -1 ? "" : signers[index].address;
  const evmAddress = index === -1 ? "" : signers[index].evmAddress;
  const isClaimed = index === -1 ? false : signers[index].isEvmClaimed;

  const setAccount = (value: string) => {
    const signerIndex = findSigner(signers, value);
    dispatch(signersSelect(signerIndex));
    const newContracts = updateContracts(
      signers[signerIndex],
      oldContracts,
      compiledContracts
    );
    dispatch(contractRemoveAll());
    dispatch(contractAddMultiple(newContracts));
  };

  useEffect(() => {
    const names = Object.keys(contracts);
    if (names.length > 0) {
      setSelectedContract(names[0]);
    }
  }, [contracts]);

  const signerOptions = signers.map(({ name, address, balance }, index) => (
    <option value={address} key={index}>
      {name} - ({bigNumberToString(balance)} REEF)
    </option>
  ));

  const contractOptions = Object.keys(contracts).map((contract, index) => (
    <option value={contract} key={index}>
      {contract}
    </option>
  ));

  return (
    <div className="m-3">
      <div>
        <label>Accounts:</label>

        <div className="d-flex flex-row align-items-center">
          <select
            id="accountSelector"
            className="form-control select_3rUxUe custom-select flex-fill mr-1"
            value={account}
            onChange={(event) => setAccount(event.target.value)}
          >
            {signerOptions}
          </select>
          <Copy value={evmAddress} />
        </div>
        {!isClaimed && (
          <a
            href="https://reefswap.com/bind"
            className="text text-decoration-none"
            target="_blank"
          >
            Bind EVM account
          </a>
        )}
      </div>
      <div>
        <label>Compiled contracts:</label>

        <select
          className="form-control select_3rUxUe custom-select"
          value={selectedContract}
          onChange={(event) => setSelectedContract(event.target.value)}
        >
          {contractOptions}
        </select>
      </div>

      {index !== -1 ? (
        <>
          <Deploy contractName={selectedContract} />
          <DeployedContracts />
        </>
      ) : (
        <div className="text-danger pt-3 text">
          Sign in with one of your wallets under the settings!
        </div>
      )}
    </div>
  );
};

export default Constructor;
