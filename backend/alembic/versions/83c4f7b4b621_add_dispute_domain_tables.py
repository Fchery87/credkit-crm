"""Add dispute domain tables"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "83c4f7b4b621"
down_revision = "3b9f0a4f3a2b"
branch_labels = None
depends_on = None


dispute_case_status = sa.Enum(
    "open", "in_review", "resolved", "archived", name="dispute_case_status"
)
dispute_case_priority = sa.Enum(
    "low", "medium", "high", "urgent", name="dispute_case_priority"
)
credit_bureau = sa.Enum(
    "experian", "equifax", "transunion", "innovis", "other", name="credit_bureau"
)
dispute_item_type = sa.Enum(
    "account",
    "inquiry",
    "public_record",
    "personal_information",
    "custom",
    name="dispute_item_type",
)
dispute_item_status = sa.Enum(
    "draft",
    "ready",
    "sent",
    "pending_response",
    "resolved",
    "escalated",
    name="dispute_item_status",
)
letter_template_category = sa.Enum(
    "general",
    "dispute",
    "follow_up",
    "escalation",
    "compliance",
    name="letter_template_category",
)
letter_delivery_channel = sa.Enum(
    "mail", "email", "fax", name="letter_delivery_channel"
)
generated_letter_status = sa.Enum(
    "draft", "rendered", "queued", "sent", "delivered", "failed", name="generated_letter_status"
)
suggestion_engine = sa.Enum(
    "rules", "gpt", "claude", "custom", name="suggestion_engine"
)
suggestion_run_status = sa.Enum(
    "queued", "running", "completed", "failed", name="suggestion_run_status"
)


def upgrade() -> None:
    bind = op.get_bind()
    dispute_case_status.create(bind, checkfirst=True)
    dispute_case_priority.create(bind, checkfirst=True)
    credit_bureau.create(bind, checkfirst=True)
    dispute_item_type.create(bind, checkfirst=True)
    dispute_item_status.create(bind, checkfirst=True)
    letter_template_category.create(bind, checkfirst=True)
    letter_delivery_channel.create(bind, checkfirst=True)
    generated_letter_status.create(bind, checkfirst=True)
    suggestion_engine.create(bind, checkfirst=True)
    suggestion_run_status.create(bind, checkfirst=True)

    op.create_table(
        "dispute_cases",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("clients.id"), nullable=False),
        sa.Column("case_number", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column(
            "status",
            dispute_case_status,
            nullable=False,
            server_default=sa.text("'open'::dispute_case_status"),
        ),
        sa.Column(
            "priority",
            dispute_case_priority,
            nullable=False,
            server_default=sa.text("'medium'::dispute_case_priority"),
        ),
        sa.Column("opened_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("closed_at", sa.DateTime()),
        sa.Column("last_activity_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime()),
        sa.UniqueConstraint("tenant_id", "case_number", name="uq_dispute_case_number_per_tenant"),
    )
    op.create_index(
        "ix_dispute_cases_tenant_client",
        "dispute_cases",
        ["tenant_id", "client_id"],
    )

    op.create_table(
        "dispute_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("clients.id"), nullable=False),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dispute_cases.id"), nullable=False),
        sa.Column("label", sa.String(), nullable=False),
        sa.Column("bureau", credit_bureau, nullable=False),
        sa.Column("item_type", dispute_item_type, nullable=False),
        sa.Column(
            "status",
            dispute_item_status,
            nullable=False,
            server_default=sa.text("'draft'::dispute_item_status"),
        ),
        sa.Column("account_number", sa.String()),
        sa.Column("amount", sa.Numeric(12, 2)),
        sa.Column("position", sa.Integer()),
        sa.Column("notes", sa.Text()),
        sa.Column("dispute_reason_codes", postgresql.ARRAY(sa.Integer())),
        sa.Column(
            "details",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("data_snapshot", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime()),
    )
    op.create_index(
        "ix_dispute_items_tenant_case",
        "dispute_items",
        ["tenant_id", "case_id"],
    )
    op.create_index(
        "ix_dispute_items_tenant_client",
        "dispute_items",
        ["tenant_id", "client_id"],
    )
    op.create_index(
        "ix_dispute_items_reason_codes",
        "dispute_items",
        ["dispute_reason_codes"],
        postgresql_using="gin",
    )
    op.create_index(
        "ix_dispute_items_details",
        "dispute_items",
        ["details"],
        postgresql_using="gin",
    )

    op.create_table(
        "letter_templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column(
            "category",
            letter_template_category,
            nullable=False,
            server_default=sa.text("'dispute'::letter_template_category"),
        ),
        sa.Column(
            "channel",
            letter_delivery_channel,
            nullable=False,
            server_default=sa.text("'mail'::letter_delivery_channel"),
        ),
        sa.Column("version", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("locale", sa.String(), nullable=False, server_default=sa.text("'en-US'")),
        sa.Column("subject", sa.String()),
        sa.Column("preview_text", sa.String()),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column(
            "variables",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime()),
    )
    op.create_index(
        "ix_letter_templates_tenant_slug",
        "letter_templates",
        ["tenant_id", "slug"],
        unique=True,
    )
    op.create_index(
        "ix_letter_templates_tenant",
        "letter_templates",
        ["tenant_id"],
    )

    op.create_table(
        "generated_letters",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("clients.id"), nullable=False),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dispute_cases.id"), nullable=False),
        sa.Column("item_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dispute_items.id")),
        sa.Column("template_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("letter_templates.id")),
        sa.Column("reference_code", sa.String(), nullable=False),
        sa.Column(
            "status",
            generated_letter_status,
            nullable=False,
            server_default=sa.text("'draft'::generated_letter_status"),
        ),
        sa.Column("subject", sa.String()),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column(
            "render_context",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "attachments",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("sent_at", sa.DateTime()),
        sa.Column("delivered_at", sa.DateTime()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime()),
    )
    op.create_index(
        "ix_generated_letters_tenant_case",
        "generated_letters",
        ["tenant_id", "case_id"],
    )
    op.create_index(
        "ix_generated_letters_tenant_client",
        "generated_letters",
        ["tenant_id", "client_id"],
    )
    op.create_index(
        "ix_generated_letters_render_context",
        "generated_letters",
        ["render_context"],
        postgresql_using="gin",
    )

    op.create_table(
        "suggestion_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("clients.id"), nullable=False),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dispute_cases.id"), nullable=False),
        sa.Column("item_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dispute_items.id")),
        sa.Column("letter_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("generated_letters.id")),
        sa.Column(
            "engine",
            suggestion_engine,
            nullable=False,
            server_default=sa.text("'rules'::suggestion_engine"),
        ),
        sa.Column(
            "status",
            suggestion_run_status,
            nullable=False,
            server_default=sa.text("'queued'::suggestion_run_status"),
        ),
        sa.Column("prompt", sa.Text()),
        sa.Column(
            "result",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "suggestions",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("score", sa.Float()),
        sa.Column("started_at", sa.DateTime()),
        sa.Column("completed_at", sa.DateTime()),
        sa.Column("error", sa.Text()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime()),
    )
    op.create_index(
        "ix_suggestion_runs_tenant_case",
        "suggestion_runs",
        ["tenant_id", "case_id"],
    )
    op.create_index(
        "ix_suggestion_runs_tenant_client",
        "suggestion_runs",
        ["tenant_id", "client_id"],
    )
    op.create_index(
        "ix_suggestion_runs_result",
        "suggestion_runs",
        ["result"],
        postgresql_using="gin",
    )


def downgrade() -> None:
    op.drop_index("ix_suggestion_runs_result", table_name="suggestion_runs")
    op.drop_index("ix_suggestion_runs_tenant_client", table_name="suggestion_runs")
    op.drop_index("ix_suggestion_runs_tenant_case", table_name="suggestion_runs")
    op.drop_table("suggestion_runs")

    op.drop_index("ix_generated_letters_render_context", table_name="generated_letters")
    op.drop_index("ix_generated_letters_tenant_client", table_name="generated_letters")
    op.drop_index("ix_generated_letters_tenant_case", table_name="generated_letters")
    op.drop_table("generated_letters")

    op.drop_index("ix_letter_templates_tenant", table_name="letter_templates")
    op.drop_index("ix_letter_templates_tenant_slug", table_name="letter_templates")
    op.drop_table("letter_templates")

    op.drop_index("ix_dispute_items_details", table_name="dispute_items")
    op.drop_index("ix_dispute_items_reason_codes", table_name="dispute_items")
    op.drop_index("ix_dispute_items_tenant_client", table_name="dispute_items")
    op.drop_index("ix_dispute_items_tenant_case", table_name="dispute_items")
    op.drop_table("dispute_items")

    op.drop_index("ix_dispute_cases_tenant_client", table_name="dispute_cases")
    op.drop_table("dispute_cases")

    suggestion_run_status.drop(op.get_bind(), checkfirst=True)
    suggestion_engine.drop(op.get_bind(), checkfirst=True)
    generated_letter_status.drop(op.get_bind(), checkfirst=True)
    letter_delivery_channel.drop(op.get_bind(), checkfirst=True)
    letter_template_category.drop(op.get_bind(), checkfirst=True)
    dispute_item_status.drop(op.get_bind(), checkfirst=True)
    dispute_item_type.drop(op.get_bind(), checkfirst=True)
    credit_bureau.drop(op.get_bind(), checkfirst=True)
    dispute_case_priority.drop(op.get_bind(), checkfirst=True)
    dispute_case_status.drop(op.get_bind(), checkfirst=True)
