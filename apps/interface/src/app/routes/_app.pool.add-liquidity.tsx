import { LoadingBlock } from "#/components/ui/spinner.js";
import { clientOnly } from "#/lib/client-only.js";
import { PoolActionPage } from "#/modules/pool/ui/components/PoolActionPage.js";

const AddLiquiditySection = clientOnly(
  () =>
    import("#/modules/pool/ui/components/add-liquidity/AddLiquiditySection.js").then(
      (mod) => mod.AddLiquiditySection,
    ),
  { loading: () => <LoadingBlock /> },
);

export default function AddLiquidityPage() {
  return <PoolActionPage section={AddLiquiditySection} />;
}
