/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as cart from "../cart.js";
import type * as commissions from "../commissions.js";
import type * as crons from "../crons.js";
import type * as deposits from "../deposits.js";
import type * as finance from "../finance.js";
import type * as market from "../market.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as payouts from "../payouts.js";
import type * as products from "../products.js";
import type * as receivableHelpers from "../receivableHelpers.js";
import type * as reviews from "../reviews.js";
import type * as sales from "../sales.js";
import type * as shared from "../shared.js";
import type * as stalls from "../stalls.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  cart: typeof cart;
  commissions: typeof commissions;
  crons: typeof crons;
  deposits: typeof deposits;
  finance: typeof finance;
  market: typeof market;
  messages: typeof messages;
  notifications: typeof notifications;
  orders: typeof orders;
  payouts: typeof payouts;
  products: typeof products;
  receivableHelpers: typeof receivableHelpers;
  reviews: typeof reviews;
  sales: typeof sales;
  shared: typeof shared;
  stalls: typeof stalls;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
