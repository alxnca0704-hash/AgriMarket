import { anyApi, cronJobs } from "convex/server";

const crons = cronJobs();
crons.interval("enforce stall deposit deadlines", { hours: 1 }, anyApi.deposits.expireStalls, { paginationOpts: { numItems: 100, cursor: null } });
crons.cron("issue weekly seller commission invoices", "0 9 * * 1", anyApi.commissions.issueWeeklyInvoices, {});
crons.interval("process commission invoice reminders", { hours: 12 }, anyApi.commissions.processInvoiceReminders, {});
crons.interval("process COD refund deadlines", { hours: 1 }, anyApi.refunds.processCodRefundDeadlines, {});

export default crons;
