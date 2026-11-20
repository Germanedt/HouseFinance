CREATE TYPE "public"."actor_type" AS ENUM('person', 'bank', 'company', 'other');--> statement-breakpoint
CREATE TYPE "public"."bill_direction" AS ENUM('payable', 'receivable');--> statement-breakpoint
CREATE TYPE "public"."bill_status" AS ENUM('pending', 'paid', 'collected');--> statement-breakpoint
CREATE TYPE "public"."due_day_rule" AS ENUM('first_business_day', 'last_business_day', 'fixed_day');--> statement-breakpoint
CREATE TYPE "public"."frequency" AS ENUM('monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual', 'one_time');--> statement-breakpoint
CREATE TYPE "public"."income_type" AS ENUM('salary', 'gift', 'donation', 'other');--> statement-breakpoint
CREATE TYPE "public"."movement_type" AS ENUM('extra_payment', 'balance_adjustment');--> statement-breakpoint
CREATE TYPE "public"."notice_type" AS ENUM('register_fixed_income');--> statement-breakpoint
CREATE TYPE "public"."obligation_status" AS ENUM('pending_confirmation', 'active', 'closed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."obligation_type" AS ENUM('loan', 'service', 'receivable', 'credit_card');--> statement-breakpoint
CREATE TABLE "job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job" text NOT NULL,
	"run_date" date NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"result" jsonb
);
--> statement-breakpoint
ALTER TABLE "job_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "job_runs_job_run_date_unique" ON "job_runs" USING btree ("job","run_date");