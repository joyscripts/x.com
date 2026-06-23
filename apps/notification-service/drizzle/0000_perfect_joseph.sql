CREATE TABLE "device_installations" (
	"installation_id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"platform" text NOT NULL,
	"push_provider" text NOT NULL,
	"device_token" text NOT NULL,
	"app_variant" text NOT NULL,
	"app_version" text,
	"device_name" text,
	"device_model" text,
	"os_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_registered_at" timestamp with time zone DEFAULT now() NOT NULL
);
