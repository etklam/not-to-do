CREATE TABLE "challenge_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"not_to_do_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "challenge_participants_challenge_id_user_id_unique" UNIQUE("challenge_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text DEFAULT '',
	"slug" varchar(255) NOT NULL,
	"share_code" varchar(32) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"creator_id" uuid NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "challenges_slug_unique" UNIQUE("slug"),
	CONSTRAINT "challenges_share_code_unique" UNIQUE("share_code")
);
--> statement-breakpoint
CREATE TABLE "checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"not_to_do_id" uuid NOT NULL,
	"date" date NOT NULL,
	"status" varchar(20) NOT NULL,
	"resist_count" integer DEFAULT 0 NOT NULL,
	"temptation_level" varchar(20),
	"trigger_tags" text DEFAULT '[]' NOT NULL,
	"note" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkins_not_to_do_id_date_unique" UNIQUE("not_to_do_id","date")
);
--> statement-breakpoint
CREATE TABLE "daily_resists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"not_to_do_id" uuid NOT NULL,
	"date" date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_resists_not_to_do_id_date_unique" UNIQUE("not_to_do_id","date")
);
--> statement-breakpoint
CREATE TABLE "not_to_dos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text DEFAULT '',
	"streak" integer DEFAULT 0 NOT NULL,
	"best_streak" integer DEFAULT 0 NOT NULL,
	"last_checkin" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"mode" varchar(20) DEFAULT 'personal' NOT NULL,
	"challenge_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_not_to_do_id_not_to_dos_id_fk" FOREIGN KEY ("not_to_do_id") REFERENCES "public"."not_to_dos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_not_to_do_id_not_to_dos_id_fk" FOREIGN KEY ("not_to_do_id") REFERENCES "public"."not_to_dos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_resists" ADD CONSTRAINT "daily_resists_not_to_do_id_not_to_dos_id_fk" FOREIGN KEY ("not_to_do_id") REFERENCES "public"."not_to_dos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "not_to_dos" ADD CONSTRAINT "not_to_dos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "not_to_dos" ADD CONSTRAINT "not_to_dos_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;