/**
 * The A2UI catalog used by the harness.
 *
 * Assembled from A2UI's own published component APIs (`CardApi`, `ColumnApi`,
 * `RowApi`, `TextApi`, `ButtonApi`), each of which carries the Zod schema the
 * A2UI renderer validates against. Nothing here is a redefinition: the schemas
 * are the ones shipped in `@a2ui/web_core`.
 *
 * Schema-only on purpose. A `Catalog` holding component *APIs* rather than Lit
 * implementations runs under Node, which lets the protocol suite exercise the
 * real message processor without a DOM. The browser host swaps in the full
 * `basicCatalog` with the custom elements attached.
 */

import {
  ButtonApi,
  CardApi,
  Catalog,
  ColumnApi,
  RowApi,
  TextApi,
} from "@a2ui/web_core/v0_9";
import type { ComponentApi, FunctionApi } from "@a2ui/web_core/v0_9";

export const CATALOG_ID = "harness/basic";

export function createHarnessCatalog(): Catalog<ComponentApi, FunctionApi> {
  return new Catalog(CATALOG_ID, [
    CardApi,
    ColumnApi,
    RowApi,
    TextApi,
    ButtonApi,
  ]) as unknown as Catalog<ComponentApi, FunctionApi>;
}
