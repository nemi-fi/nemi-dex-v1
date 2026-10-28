import { LoadingBlock } from "#/components/ui/spinner.js";
import { clientOnly } from "#/lib/client-only.js";
import { PoolActionPage } from "#/modules/pool/ui/components/PoolActionPage.js";

const RemoveLiquiditySection = clientOnly(
  () =>
    import("#/modules/pool/ui/components/remove-liquidity/RemoveLiquiditySection.js").then(
      (mod) => mod.RemoveLiquiditySection,
    ),
  { loading: () => <LoadingBlock /> },
);

export default function RemoveLiquidityPage() {
  return <PoolActionPage section={RemoveLiquiditySection} />;
}
