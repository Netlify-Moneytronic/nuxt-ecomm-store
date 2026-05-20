CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY,
	"session_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" serial PRIMARY KEY,
	"session_id" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now()
);
