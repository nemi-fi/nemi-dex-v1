// Track artifacts to see updates in git diffs.
// This is useful to ensure that the artifacts are staying the same between releases so we don't break the UI unexpectedly.
import { loadContractArtifact } from "@aztec-labs/aztec.js/abi";
import { getContractClassFromArtifact } from "@aztec-labs/aztec.js/contracts";
import arg from "arg";
import { diffString } from "json-diff";
import jsonStringifyDeterministic from "json-stringify-deterministic";
import { intersection, isEqual } from "lodash-es";
import fs from "node:fs";
import path from "node:path";
import { Hash, Hex } from "ox";

const ARTIFACTS_INFO_PATH = path.join(
  import.meta.dirname,
  "../artifacts-info.json",
);

async function main() {
  const args = arg({
    "--action": String,
  });
  switch (args["--action"]) {
    case "generate":
      const table = await getCurrentArtifactsInfo();
      fs.writeFileSync(
        ARTIFACTS_INFO_PATH,
        jsonStringifyDeterministic(table, { space: "  " }) + "\n", // add a newline to satisfy prettier
      );
      break;
    case "check":
      const committedArtifactsInfo = await getCommittedArtifactsInfo();
      const currentArtifactsInfo = await getCurrentArtifactsInfo();
      const isSame = isEqual(committedArtifactsInfo, currentArtifactsInfo);
      if (!isSame) {
        const output = diffString(committedArtifactsInfo, currentArtifactsInfo);
        console.error(output);
        console.error(
          `Artifacts are changed but the changes are not reflected in ${ARTIFACTS_INFO_PATH}`,
        );
        process.exit(1);
      }
      console.log("Artifacts are the same");
      break;
    default:
      throw new Error(`Unknown action: ${args["--action"]}`);
  }
}

async function getCurrentArtifactsInfo() {
  const contractArtifactsDir = path.join(import.meta.dirname, "../target");
  const contractArtifacts = fs
    .readdirSync(contractArtifactsDir)
    .filter((x) => x.endsWith(".json"));

  const circuitArtifactsDir = path.join(
    import.meta.dirname,
    "../src/artifacts",
  );
  const circuitArtifacts = fs
    .readdirSync(circuitArtifactsDir)
    .filter((x) => x.endsWith(".json"));

  const contractsInfo = Object.fromEntries(
    await Promise.all(
      contractArtifacts.map(async (artifact) => {
        // raw nargo output must be loaded first, otherwise private functions and
        // public bytecode are missing and the class id ignores function bodies
        const artifactContent = loadContractArtifact(
          JSON.parse(
            fs.readFileSync(path.join(contractArtifactsDir, artifact), "utf-8"),
          ),
        );
        const contractClass =
          await getContractClassFromArtifact(artifactContent);
        return /** @type {const} */ ([
          artifact,
          {
            id: contractClass.id.toString(),
            artifactHash: contractClass.artifactHash.toString(),
            version: contractClass.version,
            privateFunctions: contractClass.privateFunctions.length,
            packedBytecode: contractClass.packedBytecode.length,
            privateFunctionsRoot: contractClass.privateFunctionsRoot.toString(),
            publicBytecodeCommitment:
              contractClass.publicBytecodeCommitment.toString(),
          },
        ]);
      }),
    ),
  );
  const circuitInfo = Object.fromEntries(
    await Promise.all(
      circuitArtifacts.map(async (artifact) => {
        const artifactContent = JSON.parse(
          fs.readFileSync(path.join(circuitArtifactsDir, artifact), "utf-8"),
        );
        return /** @type {const} */ ([
          artifact,
          {
            bytecodeHash: Hash.sha256(Hex.fromString(artifactContent.bytecode)),
          },
        ]);
      }),
    ),
  );

  const intersectedKeys = intersection(
    Object.keys(contractsInfo),
    Object.keys(circuitInfo),
  );
  if (intersectedKeys.length > 0) {
    throw new Error(
      `Artifacts have common keys: ${intersectedKeys.join(", ")}`,
    );
  }
  return { ...contractsInfo, ...circuitInfo };
}

async function getCommittedArtifactsInfo() {
  const artifactsInfo = JSON.parse(
    fs.readFileSync(ARTIFACTS_INFO_PATH, "utf-8"),
  );
  return artifactsInfo;
}

main();
