import { anyApi, cronJobs } from "convex/server";

const crons = cronJobs();
crons.interval("enforce stall deposit deadlines", { hours: 1 }, anyApi.deposits.expireStalls, {});
crons.cron("issue weekly seller commission invoices", "0 9 * * 1", anyApi.commissions.issueWeeklyInvoices, {});
crons.interval("process commission invoice reminders", { hours: 12 }, anyApi.commissions.processInvoiceReminders, {});

export default crons;
