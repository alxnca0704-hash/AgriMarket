import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import schema from "./schema";

const migrations = new Migrations(components.migrations, { schema, internalMutation });

export const addDefaultProductVariants = migrations.define({
  table: "products",
  migrateOne: async (ctx, product) => {
    if (product.variants !== undefined) return;
    await ctx.db.patch(product._id, {
      variants: [{
        id: `legacy-${product._id}`,
        name: product.unit || "Standard",
        price: product.price,
        stock: product.stockQty,
        sortOrder: 0,
      }],
    });
  },
});

export const runProductVariantMigration = migrations.runner(
  internal.migrations.addDefaultProductVariants,
);
