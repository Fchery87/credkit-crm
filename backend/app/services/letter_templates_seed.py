from __future__ import annotations

from typing import Any, Dict, Iterable
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.letter_template import (
    LetterDeliveryChannel,
    LetterTemplate,
    LetterTemplateCategory,
)

SYSTEM_TEMPLATES: Iterable[Dict[str, Any]] = [
    {
        "slug": "bureau-reinvestigation",
        "name": "Bureau Reinvestigation",
        "subject": "Request for Reinvestigation of Reported Information",
        "preview_text": "Challenges inaccurate bureau reporting and requests reinvestigation.",
        "category": LetterTemplateCategory.DISPUTE,
        "channel": LetterDeliveryChannel.MAIL,
        "body": """# Request for Reinvestigation\n\n{{ current_date }}\n\n{{ bureaus.address_line | default('') }}\n\nRe: Reinvestigation Request for {{ client.full_name }}\n\nTo Whom It May Concern,\n\nI am disputing the accuracy of the items listed below. Please complete a reinvestigation within 30 days and provide written confirmation of the outcome.\n\n{% for item in items %}## {{ item.furnisher }} - {{ item.account_number | default('N/A') }}\n- Issue: {{ item.issue }}\n- Requested Resolution: {{ item.requested_resolution }}\n{% endfor %}\n\nAttached you will find supporting identification and documentation.\n\nSincerely,\n\n{{ client.full_name }}\n{{ client.address_line1 }}\n{% if client.address_line2 %}{{ client.address_line2 }}\n{% endif %}{{ client.city }}, {{ client.state }} {{ client.postal_code }}\n""",
    },
    {
        "slug": "furnisher-investigation",
        "name": "Furnisher Investigation",
        "subject": "Formal Investigation Request",
        "preview_text": "Direct dispute letter to the furnishing creditor.",
        "category": LetterTemplateCategory.DISPUTE,
        "channel": LetterDeliveryChannel.MAIL,
        "body": """# Investigation Request\n\n{{ current_date }}\n\n{{ furnisher.name }}\n{{ furnisher.address_line | default('') }}\n\nRe: {{ account.account_number | default('Account') }}\n\nTo Whom It May Concern,\n\nI request a reasonable investigation into the information furnished for the above account. Please provide documentation validating the reporting or update the bureaus to reflect the correct status.\n\n- Reported Status: {{ account.reported_status | default('Unknown') }}\n- Claimed Issue: {{ account.issue }}\n- Requested Outcome: {{ account.requested_resolution | default('Correct or remove the tradeline') }}\n\nPlease respond within 30 days as required by the FCRA.\n\nRegards,\n\n{{ client.full_name }}\n{{ client.address_line1 }}\n{% if client.address_line2 %}{{ client.address_line2 }}\n{% endif %}{{ client.city }}, {{ client.state }} {{ client.postal_code }}\n""",
    },
    {
        "slug": "identity-mismatch",
        "name": "Identity Mismatch",
        "subject": "Incorrect Personal Information",
        "preview_text": "Highlights personal data mismatches on the credit file.",
        "category": LetterTemplateCategory.COMPLIANCE,
        "channel": LetterDeliveryChannel.MAIL,
        "body": """# Identity Information Does Not Match\n\n{{ current_date }}\n\nTo Whom It May Concern,\n\nThe credit file associated with my Social Security number contains personal information that does not belong to me.\n\n{% for mismatch in mismatches %}- Field: {{ mismatch.field }} - Reported: {{ mismatch.reported }} - Correct: {{ mismatch.expected }}\n{% endfor %}\n\nPlease correct these items immediately and provide written confirmation once the updates are complete.\n\nThank you,\n\n{{ client.full_name }}\n{{ client.address_line1 }}\n{% if client.address_line2 %}{{ client.address_line2 }}\n{% endif %}{{ client.city }}, {{ client.state }} {{ client.postal_code }}\n""",
    },
    {
        "slug": "obsolete-information",
        "name": "Obsolete Information",
        "subject": "Removal of Obsolete Information",
        "preview_text": "Requests deletion of accounts past the reporting period.",
        "category": LetterTemplateCategory.DISPUTE,
        "channel": LetterDeliveryChannel.MAIL,
        "body": """# Removal of Obsolete Information\n\n{{ current_date }}\n\nTo Whom It May Concern,\n\nThe following accounts are older than the maximum reporting period allowed by the Fair Credit Reporting Act and should be removed from my credit file:\n\n{% for account in accounts %}- {{ account.furnisher }} - {{ account.account_number }} (DOFD: {{ account.dofd }})\n{% endfor %}\n\nPlease delete these obsolete entries and send updated copies of my report.\n\nSincerely,\n\n{{ client.full_name }}\n{{ client.address_line1 }}\n{% if client.address_line2 %}{{ client.address_line2 }}\n{% endif %}{{ client.city }}, {{ client.state }} {{ client.postal_code }}\n""",
    },
    {
        "slug": "incorrect-balance-limit",
        "name": "Incorrect Balance/Limit",
        "subject": "Incorrect Balance or Credit Limit Reporting",
        "preview_text": "Challenges discrepancies between reported balances and limits.",
        "category": LetterTemplateCategory.DISPUTE,
        "channel": LetterDeliveryChannel.MAIL,
        "body": """# Incorrect Balance or Credit Limit Reporting\n\n{{ current_date }}\n\nTo Whom It May Concern,\n\nI dispute the accuracy of the balance and/or credit limit reported for the accounts listed below:\n\n{% for account in accounts %}## {{ account.furnisher }} - {{ account.account_number }}\n- Reported Balance: {{ account.reported_balance }}\n- Actual Balance: {{ account.actual_balance }}\n- Reported Limit: {{ account.reported_limit }}\n- Actual Limit: {{ account.actual_limit }}\n{% endfor %}\n\nPlease correct these figures with all bureaus and confirm the updates in writing.\n\nRespectfully,\n\n{{ client.full_name }}\n{{ client.address_line1 }}\n{% if client.address_line2 %}{{ client.address_line2 }}\n{% endif %}{{ client.city }}, {{ client.state }} {{ client.postal_code }}\n""",
    },
    {
        "slug": "dofd-mismatch",
        "name": "DOFD Mismatch",
        "subject": "Incorrect Date of First Delinquency",
        "preview_text": "Requests correction of the date of first delinquency.",
        "category": LetterTemplateCategory.DISPUTE,
        "channel": LetterDeliveryChannel.MAIL,
        "body": """# Incorrect Date of First Delinquency\n\n{{ current_date }}\n\nTo Whom It May Concern,\n\nThe Date of First Delinquency reported for the account(s) below is inaccurate:\n\n{% for account in accounts %}- {{ account.furnisher }} - {{ account.account_number }}: Reported {{ account.reported_dofd }}, Actual {{ account.actual_dofd }}\n{% endfor %}\n\nPlease investigate and update the credit bureaus with the correct DOFD.\n\nThank you,\n\n{{ client.full_name }}\n{{ client.address_line1 }}\n{% if client.address_line2 %}{{ client.address_line2 }}\n{% endif %}{{ client.city }}, {{ client.state }} {{ client.postal_code }}\n""",
    },
]


def seed_system_templates(db: Session, tenant_id: UUID) -> None:
    existing = {
        template.slug: template
        for template in db.query(LetterTemplate)
        .filter(LetterTemplate.tenant_id == tenant_id, LetterTemplate.deleted_at.is_(None))
        .all()
    }

    created = False
    for definition in SYSTEM_TEMPLATES:
        slug = definition["slug"]
        if slug in existing:
            continue

        template = LetterTemplate(
            tenant_id=tenant_id,
            name=definition["name"],
            slug=slug,
            category=definition["category"],
            channel=definition["channel"],
            version=1,
            locale="en-US",
            subject=definition["subject"],
            preview_text=definition["preview_text"],
            body=definition["body"],
            variables=[],
            is_active=True,
        )
        db.add(template)
        created = True

    if created:
        db.commit()


